import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CATEGORIES,
  type AdminUser,
  type Analytics,
  type AuditEntry,
  type Category,
  type Department,
  type RoutingRule,
  type Role,
  type Worker,
} from "@civicpulse/contract";
import { useState } from "react";
import { BarList, Stat, WeeklyChart } from "../../components/charts";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { useI18n, type Key } from "../../lib/i18n";

const TABS = ["Analytics", "Departments & routing", "Workers", "Users", "Audit log"] as const;
type Tab = (typeof TABS)[number];

const input = "min-h-11 rounded border bg-white px-3 text-sm";
const btn = "min-h-11 rounded border bg-white px-3 text-sm disabled:opacity-40";
const send = (method: string, body?: unknown) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

function ErrorLine({ error }: { error: unknown }) {
  return error ? <p role="alert" className="text-sm text-red-700">{(error as Error).message}</p> : null;
}

function AnalyticsTab() {
  const { t } = useI18n();
  const { data: a, isLoading, error } = useQuery({ queryKey: ["admin", "analytics"], queryFn: () => api<Analytics>("/admin/analytics") });
  if (isLoading) return <p className="text-slate-500">Loading...</p>;
  if (error || !a) return <ErrorLine error={error ?? new Error("No data")} />;
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Total reports" value={a.totals.total} />
        <Stat label="Open" value={a.totals.open} />
        <Stat label="Resolved this month" value={a.totals.resolvedThisMonth} />
        <Stat label="Avg resolution" value={a.totals.avgResolutionDays === null ? "n/a" : `${a.totals.avgResolutionDays} d`} />
        <Stat label="Reopened" value={pct(a.totals.reopenedRate)} />
        <Stat label="Duplicates caught" value={pct(a.totals.duplicateRate)} />
      </div>
      <section>
        <h3 className="mb-2 font-semibold">Weekly volume</h3>
        <WeeklyChart data={a.weekly} />
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-2 font-semibold">By category</h3>
          <BarList rows={CATEGORIES.map((c) => ({ label: t(`cat.${c}` as Key), value: a.byCategory[c] ?? 0 }))} />
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Hotspots (open reports)</h3>
          {a.hotspots.length === 0 ? <p className="text-sm text-slate-500">No open reports.</p> : (
            <BarList rows={a.hotspots.map((h) => ({ label: `${h.area} · ${t(`cat.${h.category}` as Key)}`, value: h.count }))} />
          )}
        </section>
      </div>
      <section className="overflow-x-auto">
        <h3 className="mb-2 font-semibold">Department workload</h3>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead><tr className="border-b text-slate-500"><th className="py-1">Department</th><th>Open</th><th>Resolved (month)</th><th>Avg days</th><th>Workers</th></tr></thead>
          <tbody>
            {a.departments.map((d) => (
              <tr key={d.id} className="border-b"><td className="py-1">{d.name}</td><td>{d.open}</td><td>{d.resolvedThisMonth}</td><td>{d.avgDays ?? "n/a"}</td><td>{d.workers}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Field worker availability</h3>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {a.workers.map((w) => {
            const used = w.activeTasks ?? 0;
            const cap = w.capacity ?? 5;
            return (
              <li key={w.id} className="flex justify-between rounded border bg-white px-3 py-2">
                <span>{w.name}{!w.active && " (inactive)"}</span>
                <span>{used}/{cap} · {used >= cap ? "At capacity" : used > 0 ? "On site" : "Available"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function DepartmentsTab() {
  const qc = useQueryClient();
  const depts = useQuery({ queryKey: ["admin", "departments"], queryFn: () => api<Department[]>("/admin/departments") });
  const rules = useQuery({ queryKey: ["admin", "routing"], queryFn: () => api<RoutingRule[]>("/admin/routing") });
  const [name, setName] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["departments"] });
  };
  const add = useMutation({ mutationFn: () => api("/admin/departments", send("POST", { name })), onSuccess: () => { setName(""); refresh(); } });
  const rename = useMutation({ mutationFn: (d: Department) => api(`/admin/departments/${d.id}`, send("PUT", { name: d.name })), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api(`/admin/departments/${id}`, send("DELETE")), onSuccess: refresh });
  const route = useMutation({
    mutationFn: (r: RoutingRule) => api("/admin/routing", send("PUT", [r])),
    onSuccess: refresh,
  });
  const { t } = useI18n();
  const [edit, setEdit] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 font-semibold">Departments</h3>
        <ul className="space-y-2">
          {(depts.data ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap gap-2">
              <input className={`${input} flex-1`} aria-label="Department name" value={edit[d.id] ?? d.name} onChange={(e) => setEdit({ ...edit, [d.id]: e.target.value })} />
              <button className={btn} disabled={(edit[d.id] ?? d.name) === d.name} onClick={() => rename.mutate({ id: d.id, name: edit[d.id]! })}>Rename</button>
              <button className={`${btn} text-red-700`} onClick={() => confirm(`Delete ${d.name}?`) && remove.mutate(d.id)}>Delete</button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input className={`${input} flex-1`} placeholder="New department" aria-label="New department" value={name} onChange={(e) => setName(e.target.value)} />
          <button className={btn} disabled={name.trim().length < 2} onClick={() => add.mutate()}>Add</button>
        </div>
        <ErrorLine error={add.error ?? rename.error ?? remove.error} />
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Routing: which department gets each category</h3>
        <ul className="space-y-2">
          {CATEGORIES.map((c) => {
            const current = rules.data?.find((r) => r.category === c)?.departmentId ?? "";
            return (
              <li key={c} className="flex flex-wrap items-center gap-2">
                <span className="w-56 text-sm">{t(`cat.${c}` as Key)}</span>
                <select
                  className={input}
                  aria-label={`Department for ${c}`}
                  value={current}
                  onChange={(e) => route.mutate({ category: c as Category, departmentId: e.target.value })}
                >
                  <option value="" disabled>Choose</option>
                  {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </li>
            );
          })}
        </ul>
        <ErrorLine error={route.error} />
      </section>
    </div>
  );
}

function WorkersTab() {
  const qc = useQueryClient();
  const depts = useQuery({ queryKey: ["admin", "departments"], queryFn: () => api<Department[]>("/admin/departments") });
  const workers = useQuery({ queryKey: ["admin", "workers"], queryFn: () => api<Worker[]>("/admin/workers") });
  const [form, setForm] = useState({ name: "", departmentId: "", capacity: 5 });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const add = useMutation({ mutationFn: () => api("/admin/workers", send("POST", form)), onSuccess: () => { setForm({ ...form, name: "" }); refresh(); } });
  const update = useMutation({
    mutationFn: (w: Worker) => api(`/admin/workers/${w.id}`, send("PUT", { name: w.name, departmentId: w.departmentId, capacity: w.capacity ?? 5, active: w.active })),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/admin/workers/${id}`, send("DELETE")), onSuccess: refresh });
  const deptName = (id: string) => depts.data?.find((d) => d.id === id)?.name ?? "?";

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {(workers.data ?? []).map((w) => (
          <li key={w.id} className="flex flex-wrap items-center gap-2 rounded border bg-white p-2 text-sm">
            <span className="flex-1">{w.name} · {deptName(w.departmentId)} · capacity {w.capacity}</span>
            <button className={btn} onClick={() => update.mutate({ ...w, active: !w.active })}>{w.active ? "Deactivate" : "Activate"}</button>
            <button className={`${btn} text-red-700`} onClick={() => confirm(`Delete ${w.name}?`) && remove.mutate(w.id)}>Delete</button>
          </li>
        ))}
        {workers.data?.length === 0 && <li className="text-sm text-slate-500">No workers yet. Add one below so staff can assign reports.</li>}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input className={`${input} flex-1`} placeholder="Worker name" aria-label="Worker name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={input} aria-label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">Department</option>
          {(depts.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input className={`${input} w-24`} type="number" min={1} max={50} aria-label="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <button className={btn} disabled={form.name.trim().length < 2 || !form.departmentId} onClick={() => add.mutate()}>Add worker</button>
      </div>
      <ErrorLine error={add.error ?? update.error ?? remove.error} />
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => api<AdminUser[]>("/admin/users") });
  const depts = useQuery({ queryKey: ["admin", "departments"], queryFn: () => api<Department[]>("/admin/departments") });
  const [draft, setDraft] = useState<Record<string, { role: Role; departmentId: string }>>({});
  const save = useMutation({
    mutationFn: (v: { id: string; role: Role; departmentId: string }) =>
      api(`/admin/users/${v.id}/role`, send("PUT", { role: v.role, departmentId: v.role === "staff" ? v.departmentId : null })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">Promote a signed-up user to staff (pick their department) or admin.</p>
      {(users.data ?? []).map((u) => {
        const d = draft[u.id] ?? { role: u.role, departmentId: u.departmentId ?? "" };
        const dirty = d.role !== u.role || (d.role === "staff" && d.departmentId !== (u.departmentId ?? ""));
        return (
          <div key={u.id} className="flex flex-wrap items-center gap-2 rounded border bg-white p-2 text-sm">
            <span className="min-w-48 flex-1">{u.name} <span className="text-slate-400">{u.email}</span></span>
            <select className={input} aria-label={`Role for ${u.name}`} value={d.role} onChange={(e) => setDraft({ ...draft, [u.id]: { ...d, role: e.target.value as Role } })}>
              <option value="citizen">Citizen</option><option value="staff">Staff</option><option value="admin">Admin</option>
            </select>
            {d.role === "staff" && (
              <select className={input} aria-label={`Department for ${u.name}`} value={d.departmentId} onChange={(e) => setDraft({ ...draft, [u.id]: { ...d, departmentId: e.target.value } })}>
                <option value="">Department</option>
                {(depts.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            )}
            <button className={btn} disabled={!dirty || (d.role === "staff" && !d.departmentId)} onClick={() => save.mutate({ id: u.id, ...d })}>Save</button>
          </div>
        );
      })}
      <ErrorLine error={save.error} />
    </div>
  );
}

function AuditTab() {
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "audit"], queryFn: () => api<AuditEntry[]>("/admin/audit-logs") });
  if (isLoading) return <p className="text-slate-500">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <ErrorLine error={error} />
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead><tr className="border-b text-slate-500"><th className="py-1">When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
        <tbody>
          {(data ?? []).map((e) => (
            <tr key={e.id} className="border-b align-top">
              <td className="whitespace-nowrap py-1">{formatDateTime(e.at)}</td><td>{e.actor}</td><td>{e.action}</td><td>{e.target ?? ""}</td>
              <td className="max-w-xs truncate" title={e.detail ?? ""}>{e.detail ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Analytics");
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="flex flex-wrap gap-1 border-b" role="tablist">
        {TABS.map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            className={`min-h-11 px-3 text-sm ${tab === x ? "border-b-2 border-teal-700 font-semibold text-teal-700" : "text-slate-600"}`}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "Analytics" && <AnalyticsTab />}
      {tab === "Departments & routing" && <DepartmentsTab />}
      {tab === "Workers" && <WorkersTab />}
      {tab === "Users" && <UsersTab />}
      {tab === "Audit log" && <AuditTab />}
    </main>
  );
}
