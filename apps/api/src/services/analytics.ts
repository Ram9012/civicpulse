import type {
  Analytics,
  Category,
  DepartmentStats,
  ReportStatus,
  WeeklyPoint,
  Worker,
} from "@civicpulse/contract";
import { db } from "../db.js";

const DAY = 24 * 3600 * 1000;

export interface AnalyticsInput {
  now: Date;
  reports: {
    status: ReportStatus;
    category: Category;
    department_id: string | null;
    worker_id: string | null;
    area_label: string;
    created_at: string;
    resolved_at: string | null;
  }[];
  departments: { id: string; name: string }[];
  workers: { id: string; name: string; department_id: string; active: boolean; capacity: number }[];
  reopenedCount: number;
}

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const days = (r: { created_at: string; resolved_at: string | null }) =>
  (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()) / DAY;

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

/** Pure aggregation so it can be unit tested without a database. */
export function buildAnalytics(input: AnalyticsInput): Analytics {
  const { now, reports, departments, workers } = input;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const isOpen = (s: ReportStatus) => s !== "resolved" && s !== "duplicate";
  const resolved = reports.filter((r) => r.resolved_at && r.status === "resolved");

  const byStatus: Analytics["byStatus"] = {};
  const byCategory: Analytics["byCategory"] = {};
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  const thisWeek = startOfWeek(now).getTime();
  const weekly: WeeklyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const from = thisWeek - i * 7 * DAY;
    const to = from + 7 * DAY;
    weekly.push({
      week: new Date(from).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      submitted: reports.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= from && t < to;
      }).length,
      resolved: resolved.filter((r) => {
        const t = new Date(r.resolved_at!).getTime();
        return t >= from && t < to;
      }).length,
    });
  }

  const deptStats: DepartmentStats[] = departments.map((d) => {
    const mine = reports.filter((r) => r.department_id === d.id);
    const doneThisMonth = mine.filter((r) => r.resolved_at && new Date(r.resolved_at).getTime() >= monthStart);
    return {
      id: d.id,
      name: d.name,
      open: mine.filter((r) => isOpen(r.status)).length,
      resolvedThisMonth: doneThisMonth.length,
      avgDays: mean(mine.filter((r) => r.resolved_at).map(days)),
      workers: workers.filter((w) => w.department_id === d.id && w.active).length,
    };
  });

  const areas = new Map<string, { count: number; cats: Map<Category, number> }>();
  for (const r of reports.filter((x) => isOpen(x.status))) {
    const a = areas.get(r.area_label) ?? { count: 0, cats: new Map() };
    a.count++;
    a.cats.set(r.category, (a.cats.get(r.category) ?? 0) + 1);
    areas.set(r.area_label, a);
  }
  const hotspots = [...areas.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([area, a]) => ({
      area,
      count: a.count,
      category: [...a.cats.entries()].sort((x, y) => y[1] - x[1])[0]![0],
    }));

  const workerList: Worker[] = workers.map((w) => ({
    id: w.id,
    name: w.name,
    departmentId: w.department_id,
    active: w.active,
    capacity: w.capacity,
    activeTasks: reports.filter((r) => r.worker_id === w.id && (r.status === "assigned" || r.status === "in_progress")).length,
  }));

  const total = reports.length;
  return {
    totals: {
      total,
      open: reports.filter((r) => isOpen(r.status)).length,
      resolved: resolved.length,
      resolvedThisMonth: resolved.filter((r) => new Date(r.resolved_at!).getTime() >= monthStart).length,
      avgResolutionDays: mean(resolved.map(days)),
      reopenedRate: total ? Math.round((input.reopenedCount / total) * 1000) / 1000 : 0,
      duplicateRate: total ? Math.round(((byStatus.duplicate ?? 0) / total) * 1000) / 1000 : 0,
    },
    byStatus,
    byCategory,
    weekly,
    departments: deptStats,
    hotspots,
    workers: workerList,
  };
}

export async function computeAnalytics(): Promise<Analytics> {
  const [reports, departments, workers, reopened] = await Promise.all([
    db()
      .from("reports")
      .select("status,category,department_id,worker_id,area_label,created_at,resolved_at")
      .limit(10000),
    db().from("departments").select("id,name").order("name"),
    db().from("workers").select("id,name,department_id,active,capacity"),
    db().from("report_events").select("*", { count: "exact", head: true }).eq("to_status", "reopened"),
  ]);
  return buildAnalytics({
    now: new Date(),
    reports: (reports.data ?? []) as AnalyticsInput["reports"],
    departments: departments.data ?? [],
    workers: workers.data ?? [],
    reopenedCount: reopened.count ?? 0,
  });
}
