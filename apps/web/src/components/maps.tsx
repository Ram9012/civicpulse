import type { Report } from "@civicpulse/contract";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_CENTER } from "../lib/format";

const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = "&copy; OpenStreetMap contributors";

const PRIORITY_COLOR: Record<Report["priority"], string> = {
  low: "#64748b",
  medium: "#0f766e",
  high: "#ea580c",
  critical: "#dc2626",
};

/** Read-only map with one marker per report. */
export function ReportsMap({ reports, height = 420 }: { reports: Report[]; height?: number }) {
  const first = reports[0];
  return (
    <MapContainer
      center={first ? [first.lat, first.lng] : DEFAULT_CENTER}
      zoom={14}
      style={{ height }}
      className="z-0 rounded-lg border"
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      {reports.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.lat, r.lng]}
          radius={9}
          pathOptions={{ color: PRIORITY_COLOR[r.priority], fillOpacity: 0.7 }}
        >
          <Popup>
            <strong>{r.title}</strong>
            <br />
            <Link to={`/reports/${r.id}`}>View details</Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
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

/** Click (or drag via geolocation button elsewhere) to place a single pin. */
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
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
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
