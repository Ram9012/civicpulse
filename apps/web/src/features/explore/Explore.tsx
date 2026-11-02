import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, type ReportListResponse, type ReportStatus } from "@civicpulse/contract";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ReportCard } from "../../components/ReportCard";
import { ReportsMap } from "../../components/maps";
import { api } from "../../lib/api";
import { useI18n, type Key } from "../../lib/i18n";

const STATUSES: ReportStatus[] = ["submitted", "verified", "assigned", "in_progress", "resolved", "duplicate", "reopened"];

export default function Explore() {
  const { t } = useI18n();
  const [sp, setSp] = useSearchParams();
  const bbox = sp.get("bbox") ?? "";
  const areaName = sp.get("area") ?? "";
  const [view, setView] = useState<"list" | "map">("list");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page) });
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (q.trim()) params.set("q", q.trim());
  if (bbox) params.set("bbox", bbox);

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", category, status, q, page, bbox],
    queryFn: () => api<ReportListResponse>(`/reports?${params}`),
  });

  const field = "min-h-11 rounded border bg-white px-3 text-sm";
  const pages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t("explore.title")}</h1>
      {bbox && (
        <p className="flex items-center gap-2 rounded bg-teal-50 p-2 text-sm">
          Showing saved area <strong>{areaName || "custom"}</strong>
          <button className="min-h-11 px-2 text-teal-700 underline" onClick={() => setSp({})}>Clear</button>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          className={`${field} flex-1`}
          placeholder={t("explore.search")}
          aria-label={t("explore.search")}
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
          <option value="">{t("explore.allCategories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`cat.${c}` as Key)}</option>
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
          <option value="">{t("explore.allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}` as Key)}</option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded border text-sm" role="group" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`min-h-11 px-4 ${view === v ? "bg-teal-700 text-white" : "bg-white"}`}
            >
              {t(v === "list" ? "explore.list" : "explore.map")}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-slate-500">{t("explore.loading")}</p>}
      {error && <p role="alert" className="text-red-700">Could not load reports. {(error as Error).message}</p>}
      {data && data.items.length === 0 && (
        <p className="rounded border bg-white p-6 text-center text-slate-600">{t("explore.empty")}</p>
      )}
      {data && data.items.length > 0 &&
        (view === "map" ? (
          <ReportsMap reports={data.items} extras />
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
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="min-h-11 px-3 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
