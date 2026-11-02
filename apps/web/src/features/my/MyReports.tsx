import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, ReportListResponse } from "@civicpulse/contract";
import { Link } from "react-router-dom";
import { ReportCard } from "../../components/ReportCard";
import { api, post } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

export default function MyReports() {
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
          Updates {unread.length > 0 && <span className="text-sm text-teal-700">({unread.length} new)</span>}
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
        <h1 className="mb-2 text-2xl font-semibold">My reports</h1>
        {reports.isLoading && <p className="text-slate-500">Loading...</p>}
        {reports.data?.items.length === 0 && (
          <p className="rounded border bg-white p-6 text-center text-slate-600">
            You have not reported anything yet. <Link to="/report" className="text-teal-700 underline">Report an issue</Link>
          </p>
        )}
        <ul className="space-y-2">
          {(reports.data?.items ?? []).map((r) => (
            <li key={r.id}><ReportCard report={r} /></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
