import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, ReportListResponse, SavedArea } from "@civicpulse/contract";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ReportCard } from "../../components/ReportCard";
import { api, post } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { useI18n } from "../../lib/i18n";

/** minLng,minLat,maxLng,maxLat around a point (1 degree of latitude is about 111 km). */
const bboxFor = (a: SavedArea) => {
  const dLat = a.radiusKm / 111;
  const dLng = a.radiusKm / (111 * Math.max(Math.cos((a.lat * Math.PI) / 180), 0.1));
  return [a.lng - dLng, a.lat - dLat, a.lng + dLng, a.lat + dLat].map((n) => n.toFixed(5)).join(",");
};

function SavedAreas() {
  const qc = useQueryClient();
  const areas = useQuery({ queryKey: ["areas"], queryFn: () => api<SavedArea[]>("/me/areas"), refetchInterval: false });
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: (pos: { lat: number; lng: number }) => post("/me/areas", { name, radiusKm: radius, ...pos }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
    onError: (e) => setError((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/me/areas/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });

  function saveHere() {
    setError(null);
    if (!navigator.geolocation) return setError("Location is not available on this device.");
    navigator.geolocation.getCurrentPosition(
      (p) => add.mutate({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Could not get your location."),
      { timeout: 10_000 }
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Saved areas</h2>
      <ul className="mb-2 space-y-1">
        {(areas.data ?? []).map((a) => (
          <li key={a.id} className="flex items-center gap-2 rounded border bg-white p-2 text-sm">
            <Link to={`/explore?bbox=${bboxFor(a)}&area=${encodeURIComponent(a.name)}`} className="flex-1 underline">
              {a.name} · {a.radiusKm} km
            </Link>
            <button className="min-h-11 px-2 text-red-700" onClick={() => remove.mutate(a.id)}>Delete</button>
          </li>
        ))}
        {areas.data?.length === 0 && <li className="text-sm text-slate-500">Save your home, work or school area to check it quickly.</li>}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-h-11 flex-1 rounded border px-3 text-sm"
          placeholder="Name (e.g. Home)"
          aria-label="Area name"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <select className="min-h-11 rounded border bg-white px-2 text-sm" aria-label="Radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          {[0.5, 1, 2, 5].map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
        <button disabled={!name.trim() || add.isPending} onClick={saveHere} className="min-h-11 rounded border bg-white px-3 text-sm disabled:opacity-40">
          Save my current location
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
    </section>
  );
}

export default function MyReports() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const reports = useQuery({
    queryKey: ["reports", "mine"],
    queryFn: () => api<ReportListResponse>("/reports?mine=true"),
  });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: () => api<Notification[]>("/notifications") });
  const markRead = useMutation({
    mutationFn: (id: string) => post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = (notes.data ?? []).filter((n) => !n.read);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          {t("my.updates")} {unread.length > 0 && <span className="text-sm text-teal-700">({unread.length} new)</span>}
        </h2>
        {notes.data?.length === 0 && <p className="text-slate-500">No updates yet.</p>}
        <ul className="space-y-2">
          {(notes.data ?? []).slice(0, 8).map((n) => (
            <li key={n.id} className={`rounded border p-3 text-sm ${n.read ? "bg-white" : "border-teal-600 bg-teal-50"}`}>
              <Link to={`/reports/${n.reportId}`} onClick={() => !n.read && markRead.mutate(n.id)} className="underline">
                {n.message}
              </Link>
              <span className="ml-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h1 className="mb-2 text-2xl font-semibold">{t("my.title")}</h1>
        {reports.isLoading && <p className="text-slate-500">Loading...</p>}
        {reports.data?.items.length === 0 && (
          <p className="rounded border bg-white p-6 text-center text-slate-600">
            {t("my.none")} <Link to="/report" className="text-teal-700 underline">{t("home.cta")}</Link>
          </p>
        )}
        <ul className="space-y-2">
          {(reports.data?.items ?? []).map((r) => (
            <li key={r.id}><ReportCard report={r} /></li>
          ))}
        </ul>
      </section>

      <SavedAreas />
    </main>
  );
}
