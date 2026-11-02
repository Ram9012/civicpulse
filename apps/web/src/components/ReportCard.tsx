import type { Report } from "@civicpulse/contract";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import { useI18n, type Key } from "../lib/i18n";
import { PriorityBadge, StatusBadge } from "./badges";

export function ReportCard({ report, to }: { report: Report; to?: string }) {
  const { t } = useI18n();
  const photo = report.media.find((m) => m.kind === "photo");
  return (
    <Link
      to={to ?? `/reports/${report.id}`}
      className="flex gap-3 rounded-lg border bg-white p-3 hover:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
    >
      {photo ? (
        <img src={photo.url} alt="" className="h-20 w-20 shrink-0 rounded object-cover" loading="lazy" />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded bg-slate-100" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={report.status} />
          <PriorityBadge priority={report.priority} />
        </div>
        <h3 className="mt-1 truncate font-medium">{report.title}</h3>
        <p className="truncate text-sm text-slate-500">
          {t(`cat.${report.category}` as Key)} · {report.areaLabel}
        </p>
        <p className="text-xs text-slate-400">
          {report.id} · {formatDate(report.createdAt)} · 👍 {report.upvotes}
        </p>
      </div>
    </Link>
  );
}
