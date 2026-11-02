import { useQuery } from "@tanstack/react-query";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type ReportListResponse,
  type ReportStatus,
} from "@civicpulse/contract";
import { useState } from "react";
import { ReportCard } from "../../components/ReportCard";
import { ReportsMap } from "../../components/maps";
import { api } from "../../lib/api";

const STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];

export default function Explore() {
  const [view, setView] = useState<"list" | "map">("list");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page) });
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (q.trim()) params.set("q", q.trim());

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", category, status, q, page],
    queryFn: () => api<ReportListResponse>(`/reports?${params}`),
  });

  const field = "min-h-11 rounded border bg-white px-3 text-sm";
  const reset = (fn: () => void) => () => {
    fn();
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Explore reports</h1>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${field} flex-1`}
          placeholder="Search by area"
          aria-label="Search by area"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={field}
          aria-label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <select
          className={field}
          aria-label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded border text-sm" role="group" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={reset(() => setView(v))}
              aria-pressed={view === v}
              className={`min-h-11 px-4 ${view === v ? "bg-teal-700 text-white" : "bg-white"}`}
            >
              {v === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-slate-500">Loading reports...</p>}
      {error && <p role="alert" className="text-red-700">Could not load reports. {(error as Error).message}</p>}
      {data && data.items.length === 0 && (
        <p className="rounded border bg-white p-6 text-center text-slate-600">
          No reports match. Be the first to report an issue here.
        </p>
      )}
      {data && data.items.length > 0 &&
        (view === "map" ? (
          <ReportsMap reports={data.items} />
        ) : (
          <ul className="space-y-2">
            {data.items.map((r) => (
              <li key={r.id}><ReportCard report={r} /></li>
            ))}
          </ul>
        ))}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 px-3 disabled:opacity-40">
            ← Previous
          </button>
          <span>Page {page} of {Math.ceil(data.total / 20)}</span>
          <button
            disabled={page >= Math.ceil(data.total / 20)}
            onClick={() => setPage(page + 1)}
            className="min-h-11 px-3 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
