import type { Priority, ReportStatus } from "@civicpulse/contract";
import { useI18n, type Key } from "../lib/i18n";

const STATUS_STYLE: Record<ReportStatus, { cls: string; icon: string }> = {
  submitted: { cls: "bg-slate-100 text-slate-700", icon: "○" },
  verified: { cls: "bg-blue-100 text-blue-800", icon: "✓" },
  assigned: { cls: "bg-indigo-100 text-indigo-800", icon: "→" },
  in_progress: { cls: "bg-amber-100 text-amber-800", icon: "⚙" },
  resolved: { cls: "bg-green-100 text-green-800", icon: "✔" },
  duplicate: { cls: "bg-zinc-100 text-zinc-600", icon: "⧉" },
  reopened: { cls: "bg-red-100 text-red-800", icon: "↺" },
};

/** Status is always text + icon + color, never color alone. */
export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      <span aria-hidden>{s.icon}</span>
      {t(`status.${status}` as Key)}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  low: "text-slate-500",
  medium: "text-slate-700",
  high: "text-orange-700",
  critical: "text-red-700 font-semibold",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n();
  return (
    <span className={`text-xs uppercase tracking-wide ${PRIORITY_STYLE[priority]}`}>
      {t(`priority.${priority}` as Key)}
    </span>
  );
}
