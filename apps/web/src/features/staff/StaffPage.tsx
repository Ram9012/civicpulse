import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  STATUS_TRANSITIONS,
  type Priority,
  type Report,
  type ReportDetail,
  type TransitionInput,
  type Worker,
} from "@civicpulse/contract";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../components/badges";
import { ReportCard } from "../../components/ReportCard";
import { ReportsMap } from "../../components/maps";
import { api, post } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatDateTime } from "../../lib/format";
import { useDepartments } from "../../lib/hooks";
import { useI18n, type Key } from "../../lib/i18n";
import { uploadFile } from "../../lib/upload";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];
type Target = TransitionInput["to"];
const ACTION_LABEL: Record<Target, string> = {
  verified: "Verify",
  assigned: "Assign worker",
  in_progress: "Start work",
  resolved: "Resolve",
  duplicate: "Mark duplicate",
};

function Actions({ report }: { report: ReportDetail }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const { list: departments } = useDepartments();
  const { t } = useI18n();
  const isAdmin = profile?.role === "admin";
  const targets = STATUS_TRANSITIONS[report.status].filter((s): s is Target => s !== "reopened");
  const [target, setTarget] = useState<Target | null>(null);
  const [priority, setPriority] = useState<Priority>(report.priority);
  const [departmentId, setDepartmentId] = useState(report.departmentId ?? "");
  const [workerId, setWorkerId] = useState("");
  const [duplicateOf, setDuplicateOf] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const workers = useQuery({
    queryKey: ["staff-workers"],
    queryFn: () => api<Worker[]>("/staff/workers"),
    enabled: targets.includes("assigned"),
    refetchInterval: false,
  });
  const dept = report.departmentId;
  const eligible = (workers.data ?? []).filter((w) => w.departmentId === dept);

  const run = useMutation({
    mutationFn: async () => {
      const body: TransitionInput = { to: target!, note: note.trim() || undefined };
      if (target === "verified") {
        body.priority = priority;
        if (isAdmin && departmentId && departmentId !== report.departmentId) body.departmentId = departmentId;
      }
      if (target === "assigned") body.workerId = workerId;
      if (target === "duplicate") body.duplicateOf = duplicateOf.trim().toUpperCase();
      if (target === "in_progress" && file) body.onSiteMediaId = await uploadFile(file, "on_site");
      if (target === "resolved") body.proofMediaId = await uploadFile(file!, "proof");
      return post<ReportDetail>(`/staff/reports/${report.id}/transition`, body);
    },
    onSuccess: () => {
      setTarget(null);
      setNote("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["report", report.id] });
      qc.invalidateQueries({ queryKey: ["staff-reports"] });
    },
  });

  if (targets.length === 0) {
    return <p className="text-sm text-slate-500">No further actions for a {report.status} report.</p>;
  }

  const ready =
    target === "assigned" ? !!workerId : target === "duplicate" ? duplicateOf.trim().length > 3 : target === "resolved" ? !!file : !!target;
  const input = "mt-1 w-full rounded border bg-white px-3 py-2 text-sm";
  const ai = report.aiSuggestion;

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap gap-2">
        {targets.map((s) => (
          <button
            key={s}
            onClick={() => setTarget(s)}
            aria-pressed={target === s}
            className={`min-h-11 rounded border px-3 text-sm ${target === s ? "bg-teal-700 text-white" : "bg-white"}`}
          >
            {ACTION_LABEL[s]}
          </button>
        ))}
      </div>

      {target === "verified" && (
        <>
          {ai && (
            <div className="rounded bg-teal-50 p-2 text-sm">
              <p className="font-medium">AI suggestion ({ai.source ?? "rules"}, {Math.round(ai.confidence * 100)}% sure)</p>
              <p>
                {t(`cat.${ai.category}` as Key)} · {ai.priority} priority
              </p>
              <p className="text-slate-600">{ai.summary}</p>
              {ai.keywords && ai.keywords.length > 0 && <p className="text-xs text-slate-500">Keywords: {ai.keywords.join(", ")}</p>}
              <button className="mt-1 min-h-11 rounded border bg-white px-3" onClick={() => setPriority(ai.priority)}>
                Use suggested priority
              </button>
              <p className="mt-1 text-xs text-slate-500">Advisory only. You decide.</p>
            </div>
          )}
          <label className="block text-sm">
            Priority
            <select className={input} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`priority.${p}` as Key)}</option>
              ))}
            </select>
          </label>
          {isAdmin && (
            <label className="block text-sm">
              Department
              <select className={input} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

      {target === "assigned" && (
        <label className="block text-sm">
          Field worker
          <select className={input} value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">Choose a worker</option>
            {eligible.map((w) => (
              <option key={w.id} value={w.id} disabled={(w.activeTasks ?? 0) >= (w.capacity ?? 5)}>
                {w.name} ({w.activeTasks ?? 0}/{w.capacity ?? 5} tasks)
              </option>
            ))}
          </select>
          {workers.data && eligible.length === 0 && (
            <span className="text-xs text-red-700">No active workers in this department. Ask an admin to add one.</span>
          )}
        </label>
      )}

      {target === "duplicate" && (
        <label className="block text-sm">
          ID of the original report
          <input className={input} placeholder="CIV-10482" value={duplicateOf} onChange={(e) => setDuplicateOf(e.target.value)} />
        </label>
      )}

      {(target === "in_progress" || target === "resolved") && (
        <label className="block text-sm">
          {target === "resolved" ? "Proof photo (required)" : "On-site photo (optional)"}
          <input
            className={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {target && (
        <>
          <label className="block text-sm">
            Note (optional, visible in the timeline)
            <input className={input} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button
            disabled={!ready || run.isPending}
            onClick={() => run.mutate()}
            className="min-h-11 rounded bg-teal-700 px-5 font-medium text-white disabled:opacity-40"
          >
            {run.isPending ? "Saving..." : ACTION_LABEL[target]}
          </button>
        </>
      )}
      {run.error && <p role="alert" className="text-sm text-red-700">{(run.error as Error).message}</p>}
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const { name } = useDepartments();
  const { data: r, isLoading } = useQuery({ queryKey: ["report", id], queryFn: () => api<ReportDetail>(`/reports/${id}`) });
  if (isLoading || !r) return <p className="text-slate-500">Loading...</p>;
  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          <PriorityBadge priority={r.priority} />
          <span className="text-xs text-slate-400">{r.id}</span>
        </div>
        <h2 className="mt-1 text-xl font-semibold">{r.title}</h2>
        <p className="text-sm text-slate-500">
          {r.areaLabel} · {name(r.departmentId)} · {r.reporterName ?? "Anonymous"} · 👍 {r.upvotes}
        </p>
        <Link to={`/reports/${r.id}`} className="text-sm text-teal-700 underline">Open public page</Link>
      </div>
      <p className="whitespace-pre-wrap text-sm">{r.description}</p>
      {r.media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {r.media.map((m) =>
            m.kind === "photo" ? (
              <img key={m.id} src={m.url} alt={`${m.stage} evidence`} className="h-24 w-full rounded object-cover" />
            ) : (
              <video key={m.id} src={m.url} controls className="h-24 w-full rounded" />
            )
          )}
        </div>
      )}
      <Actions key={`${r.id}-${r.status}`} report={r} />
      <ol className="space-y-2 border-l-2 border-teal-700 pl-3 text-sm">
        {r.events.map((e) => (
          <li key={e.id}>
            <StatusBadge status={e.toStatus} /> {e.actorName} · {formatDateTime(e.createdAt)}
            {e.note && <span className="block text-slate-600">{e.note}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function StaffPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const { name } = useDepartments();
  const [sp, setSp] = useSearchParams();
  const selected = sp.get("r");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState<"list" | "map">("list");

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  const queue = useQuery({
    queryKey: ["staff-reports", status, priority],
    queryFn: () => api<Report[]>(`/staff/reports?${params}`),
  });
  const field = "min-h-11 rounded border bg-white px-3 text-sm";

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">
        {t("nav.queue")}{" "}
        <span className="text-base font-normal text-slate-500">
          {profile?.role === "admin" ? "All departments" : name(profile?.departmentId)}
        </span>
      </h1>
      {profile?.role === "staff" && !profile.departmentId && (
        <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          Your account has no department yet. Ask an admin to assign one.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <select className={field} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("explore.allStatuses")}</option>
          {["submitted", "verified", "assigned", "in_progress", "resolved", "duplicate", "reopened"].map((s) => (
            <option key={s} value={s}>{t(`status.${s}` as Key)}</option>
          ))}
        </select>
        <select className={field} aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{t(`priority.${p}` as Key)}</option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded border text-sm" role="group" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`min-h-11 px-4 ${view === v ? "bg-teal-700 text-white" : "bg-white"}`}>
              {t(v === "list" ? "explore.list" : "explore.map")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Reports">
          {queue.isLoading && <p className="text-slate-500">{t("explore.loading")}</p>}
          {queue.error && <p role="alert" className="text-red-700">{(queue.error as Error).message}</p>}
          {queue.data?.length === 0 && <p className="rounded border bg-white p-6 text-center text-slate-600">Nothing in the queue.</p>}
          {view === "map" && queue.data && queue.data.length > 0 ? (
            <ReportsMap reports={queue.data} extras />
          ) : (
            <ul className="space-y-2">
              {(queue.data ?? []).map((r) => (
                <li key={r.id} className={selected === r.id ? "rounded-lg ring-2 ring-teal-600" : ""}>
                  <ReportCard report={r} to={`/staff?r=${r.id}`} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-label="Selected report" className="rounded-lg border bg-slate-50 p-3 lg:sticky lg:top-2 lg:self-start">
          {selected ? (
            <>
              <button className="mb-2 min-h-11 text-sm text-teal-700 underline lg:hidden" onClick={() => setSp({})}>← Back to queue</button>
              <Detail id={selected} />
            </>
          ) : (
            <p className="text-slate-500">Select a report to review it.</p>
          )}
        </section>
      </div>
    </main>
  );
}
