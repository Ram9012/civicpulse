import type { Report } from "@civicpulse/contract";
import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_CENTER } from "../lib/format";

const STREETS = { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors" };
const SATELLITE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri",
};

const PRIORITY_COLOR: Record<Report["priority"], string> = {
  low: "#64748b",
  medium: "#0f766e",
  high: "#ea580c",
  critical: "#dc2626",
};

/** Groups nearby reports into one bubble at low zoom (a 56px grid), so crowded areas stay readable. */
function cluster(reports: Report[], zoom: number) {
  const cell = (56 * 360) / (256 * 2 ** zoom);
  const groups = new Map<string, Report[]>();
  for (const r of reports) {
    const k = `${Math.floor(r.lat / cell)}:${Math.floor(r.lng / cell)}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.values()];
}

function Markers({ reports, clusters, heat }: { reports: Report[]; clusters: boolean; heat: boolean }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(
    () => (clusters ? cluster(reports, zoom) : reports.map((r) => [r])),
    [reports, clusters, zoom]
  );

  return (
    <>
      {heat &&
        reports.map((r) => (
          <CircleMarker
            key={`h${r.id}`}
            center={[r.lat, r.lng]}
            radius={26}
            interactive={false}
            pathOptions={{ stroke: false, fillColor: "#dc2626", fillOpacity: 0.16 }}
          />
        ))}
      {groups.map((g) => {
        const first = g[0]!;
        if (g.length > 1) {
          const lat = g.reduce((s, r) => s + r.lat, 0) / g.length;
          const lng = g.reduce((s, r) => s + r.lng, 0) / g.length;
          return (
            <CircleMarker
              key={`c${first.id}`}
              center={[lat, lng]}
              radius={14 + Math.min(g.length, 20)}
              pathOptions={{ color: "#134e4a", fillColor: "#0f766e", fillOpacity: 0.85 }}
              eventHandlers={{ click: () => map.setView([lat, lng], Math.min(map.getZoom() + 2, 18)) }}
            >
              <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none !text-white font-bold">
                {g.length}
              </Tooltip>
            </CircleMarker>
          );
        }
        return (
          <CircleMarker
            key={first.id}
            center={[first.lat, first.lng]}
            radius={9}
            pathOptions={{ color: PRIORITY_COLOR[first.priority], fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>{first.title}</strong>
              <br />
              <Link to={`/reports/${first.id}`}>View details</Link>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function downloadGeoJson(reports: Report[]) {
  const fc = {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: { id: r.id, title: r.title, category: r.category, status: r.status, priority: r.priority, area: r.areaLabel },
    })),
  };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" }));
  a.download = "civicpulse-reports.geojson";
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Report map. `extras` adds the staff/explorer tools: Streets/Satellite, clusters, heatmap and GeoJSON export.
 */
export function ReportsMap({
  reports,
  height = 420,
  extras = false,
}: {
  reports: Report[];
  height?: number;
  extras?: boolean;
}) {
  const [satellite, setSatellite] = useState(false);
  const [clusters, setClusters] = useState(false);
  const [heat, setHeat] = useState(false);
  const first = reports[0];
  const tiles = satellite ? SATELLITE : STREETS;
  const btn = (on: boolean) =>
    `min-h-11 rounded border px-3 text-sm ${on ? "bg-teal-700 text-white" : "bg-white"}`;

  return (
    <div className="space-y-2">
      {extras && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Map tools">
          <button aria-pressed={satellite} onClick={() => setSatellite(!satellite)} className={btn(satellite)}>
            {satellite ? "Satellite" : "Streets"}
          </button>
          <button aria-pressed={clusters} onClick={() => setClusters(!clusters)} className={btn(clusters)}>
            Clusters
          </button>
          <button aria-pressed={heat} onClick={() => setHeat(!heat)} className={btn(heat)}>
            Heatmap
          </button>
          <button onClick={() => downloadGeoJson(reports)} className={btn(false)}>
            Export map data
          </button>
        </div>
      )}
      <MapContainer
        center={first ? [first.lat, first.lng] : DEFAULT_CENTER}
        zoom={14}
        style={{ height }}
        className="z-0 rounded-lg border"
      >
        <TileLayer key={tiles.url} url={tiles.url} attribution={tiles.attribution} />
        <Markers reports={reports} clusters={clusters} heat={heat} />
      </MapContainer>
    </div>
  );
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [lat, lng, map]);
  return null;
}

/** Click to place a single pin. */
export function MapPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
      zoom={value ? 16 : 13}
      style={{ height: 320 }}
      className="z-0 rounded-lg border"
    >
      <TileLayer url={STREETS.url} attribution={STREETS.attribution} />
      <ClickToPick onPick={onChange} />
      {value && (
        <>
          <Recenter lat={value.lat} lng={value.lng} />
          <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: "#dc2626", fillOpacity: 0.8 }} />
        </>
      )}
    </MapContainer>
  );
}
