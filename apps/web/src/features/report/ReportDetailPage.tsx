import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATEGORY_LABELS, type ReportDetail } from "@civicpulse/contract";
import { Link, useParams } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../components/badges";
import { ReportsMap } from "../../components/maps";
import { api, post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatDateTime } from "../../lib/format";

export default function ReportDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data: r, isLoading, error } = useQuery({
    queryKey: ["report", id],
    queryFn: () => api<ReportDetail>(`/reports/${id}`),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["report", id] });
    qc.invalidateQueries({ queryKey: ["reports"] });
  };
  const upvote = useMutation({ mutationFn: () => post(`/reports/${id}/upvote`), onSuccess: refresh });
  const reopen = useMutation({ mutationFn: () => post(`/reports/${id}/reopen`), onSuccess: refresh });

  if (isLoading) return <p className="p-6 text-slate-500">Loading...</p>;
  if (error || !r) return <p role="alert" className="p-6 text-red-700">Report not found.</p>;

  const ownResolved = r.status === "resolved" && session;
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4">
      <Link to="/explore" className="text-sm text-teal-700 underline">← Back to reports</Link>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          <PriorityBadge priority={r.priority} />
          <span className="text-xs text-slate-400">{r.id}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{r.title}</h1>
        <p className="text-sm text-slate-500">
          {CATEGORY_LABELS[r.category]} · {r.areaLabel} · {r.reporterName ?? "Anonymous"}
        </p>
      </header>

      {r.media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {r.media.map((m) =>
            m.kind === "photo" ? (
              <figure key={m.id}>
                <img src={m.url} alt={`${m.stage} evidence`} className="w-full rounded object-cover" />
                <figcaption className="text-xs text-slate-500">{m.stage.replace("_", " ")}</figcaption>
              </figure>
            ) : (
              <video key={m.id} src={m.url} controls className="w-full rounded" />
            )
          )}
        </div>
      )}

      <p className="whitespace-pre-wrap">{r.description}</p>

      <div className="flex flex-wrap gap-2">
        {session ? (
          <button
            onClick={() => upvote.mutate()}
            disabled={upvote.isPending}
            aria-pressed={!!r.upvoted}
            className={`min-h-11 rounded border px-4 ${r.upvoted ? "bg-teal-700 text-white" : "bg-white"}`}
          >
            👍 {r.upvoted ? "Confirmed" : "Confirm this issue"} ({r.upvotes})
          </button>
        ) : (
          <Link to={`/signin?next=/reports/${r.id}`} className="min-h-11 rounded border bg-white px-4 py-2.5">
            Sign in to confirm ({r.upvotes})
          </Link>
        )}
        {ownResolved && (
          <button onClick={() => reopen.mutate()} className="min-h-11 rounded border bg-white px-4">
            Not fixed? Reopen
          </button>
        )}
      </div>
      {(upvote.error || reopen.error) && (
        <p role="alert" className="text-sm text-red-700">{((upvote.error || reopen.error) as Error).message}</p>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Timeline</h2>
        <ol className="space-y-3 border-l-2 border-teal-700 pl-4">
          {r.events.map((e) => (
            <li key={e.id}>
              <StatusBadge status={e.toStatus} />
              <p className="text-sm text-slate-600">
                {e.actorName} · {formatDateTime(e.createdAt)}
              </p>
              {e.note && <p className="text-sm">{e.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Location</h2>
        <ReportsMap reports={[r]} height={220} />
      </section>
    </main>
  );
}
