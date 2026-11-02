import type { WeeklyPoint } from "@civicpulse/contract";

/** Tiny dependency-free charts. Values are always printed as text too, so color is never the only signal. */

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.submitted, d.resolved]));
  return (
    <figure>
      <div className="flex h-36 items-end gap-3" role="img" aria-label="Reports submitted and resolved per week">
        {data.map((d) => (
          <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <div className="w-1/2 rounded-t bg-slate-400" style={{ height: `${(d.submitted / max) * 100}%` }} title={`${d.submitted} submitted`} />
              <div className="w-1/2 rounded-t bg-teal-600" style={{ height: `${(d.resolved / max) * 100}%` }} title={`${d.resolved} resolved`} />
            </div>
            <span className="text-[10px] text-slate-500">{d.week}</span>
            <span className="text-[10px] text-slate-700">{d.submitted}/{d.resolved}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex gap-4 text-xs text-slate-600">
        <span><span className="mr-1 inline-block size-2 bg-slate-400" />Submitted</span>
        <span><span className="mr-1 inline-block size-2 bg-teal-600" />Resolved</span>
      </figcaption>
    </figure>
  );
}

export function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-sm">
          <span className="w-40 shrink-0 truncate">{r.label}</span>
          <span className="h-3 flex-1 rounded bg-slate-100">
            <span className="block h-3 rounded bg-teal-600" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-8 text-right tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
