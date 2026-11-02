import { CATEGORY_LABELS, type Report } from "@civicpulse/contract";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import { PriorityBadge, StatusBadge } from "./badges";

export function ReportCard({ report }: { report: Report }) {
  const photo = report.media.find((m) => m.kind === "photo");
  return (
    <Link
      to={`/reports/${report.id}`}
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
          {CATEGORY_LABELS[report.category]} · {report.areaLabel}
        </p>
        <p className="text-xs text-slate-400">
          {report.id} · {formatDate(report.createdAt)} · 👍 {report.upvotes}
        </p>
      </div>
    </Link>
  );
}
