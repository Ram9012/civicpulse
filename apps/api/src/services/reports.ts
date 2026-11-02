import type {
  Category,
  MediaItem,
  Priority,
  Report,
  ReportDetail,
  ReportEvent,
  ReportStatus,
} from "@civicpulse/contract";
import { config } from "../config.js";
import { db } from "../db.js";

/** PostgREST select that pulls everything a Report needs in one query. */
export const REPORT_SELECT =
  "*, reporter:profiles(name), upvotes(count), report_media(id,kind,stage,storage_path)";

export interface ReportRow {
  id: string;
  reporter_id: string | null;
  anonymous: boolean;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ReportStatus;
  lat: number;
  lng: number;
  area_label: string;
  department_id: string | null;
  worker_id: string | null;
  ai_suggestion: ReportDetail["aiSuggestion"];
  created_at: string;
  updated_at: string;
  reporter: { name: string } | null;
  upvotes: { count: number }[];
  report_media: { id: string; kind: "photo" | "video"; stage: MediaItem["stage"]; storage_path: string }[];
}

export function mediaUrl(path: string): string {
  return db().storage.from(config.mediaBucket).getPublicUrl(path).data.publicUrl;
}

export interface ToReportOpts {
  upvoted?: boolean;
  viewerId?: string;
  ai?: boolean; // include the AI suggestion (staff views)
}

export function toReport(row: ReportRow, opts: ToReportOpts = {}): Report {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    lat: row.lat,
    lng: row.lng,
    areaLabel: row.area_label,
    departmentId: row.department_id,
    workerId: row.worker_id,
    // Anonymous reports never expose the reporter on any endpoint.
    reporterName: row.anonymous ? null : (row.reporter?.name ?? null),
    upvotes: row.upvotes?.[0]?.count ?? 0,
    ...(opts.upvoted === undefined ? {} : { upvoted: opts.upvoted }),
    ...(opts.viewerId ? { mine: row.reporter_id === opts.viewerId } : {}),
    ...(opts.ai ? { aiSuggestion: row.ai_suggestion ?? null } : {}),
    media: (row.report_media ?? []).map((m) => ({
      id: m.id,
      kind: m.kind,
      stage: m.stage,
      url: mediaUrl(m.storage_path),
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upvotedSet(userId: string | undefined, ids: string[]): Promise<Set<string> | undefined> {
  if (!userId) return undefined;
  if (!ids.length) return new Set();
  const { data } = await db().from("upvotes").select("report_id").eq("user_id", userId).in("report_id", ids);
  return new Set((data ?? []).map((r: { report_id: string }) => r.report_id));
}

export async function fetchReport(id: string): Promise<ReportRow | null> {
  const { data } = await db().from("reports").select(REPORT_SELECT).eq("id", id).maybeSingle();
  return (data as ReportRow | null) ?? null;
}

/**
 * Timeline for a report. When the report is anonymous, events performed by the reporter
 * are shown as "Anonymous reporter" so the name cannot leak through the public timeline.
 */
export async function fetchEvents(
  reportId: string,
  hide?: { anonymous: boolean; reporterId: string | null }
): Promise<ReportEvent[]> {
  const { data } = await db()
    .from("report_events")
    .select("id,report_id,from_status,to_status,note,created_at,actor_id,actor:profiles(name)")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  type Row = {
    id: string;
    report_id: string;
    from_status: ReportStatus | null;
    to_status: ReportStatus;
    note: string | null;
    created_at: string;
    actor_id: string | null;
    actor: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((e) => ({
    id: e.id,
    reportId: e.report_id,
    fromStatus: e.from_status,
    toStatus: e.to_status,
    actorName:
      hide?.anonymous && hide.reporterId && e.actor_id === hide.reporterId
        ? "Anonymous reporter"
        : (e.actor?.name ?? "System"),
    note: e.note,
    createdAt: e.created_at,
  }));
}

/** Insert history + notify the reporter. Every status change must go through this. */
export async function recordEvent(opts: {
  reportId: string;
  from: ReportStatus | null;
  to: ReportStatus;
  actorId: string | null;
  note?: string | null;
  notifyUserId?: string | null;
  message?: string;
}) {
  await db().from("report_events").insert({
    report_id: opts.reportId,
    from_status: opts.from,
    to_status: opts.to,
    actor_id: opts.actorId,
    note: opts.note ?? null,
  });
  if (opts.notifyUserId && opts.message) {
    await db().from("notifications").insert({
      user_id: opts.notifyUserId,
      report_id: opts.reportId,
      message: opts.message,
    });
  }
}

const EARTH_M = 6_371_000;
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(h));
}

/** Open reports of the same category within `radius` m in the last 7 days. */
export async function findNearby(
  lat: number,
  lng: number,
  category: Category,
  excludeId?: string,
  radius = 100
): Promise<ReportRow[]> {
  const dLat = 0.0015; // ~165 m box, filtered precisely below
  const dLng = 0.0015 / Math.max(Math.cos((lat * Math.PI) / 180), 0.1);
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data } = await db()
    .from("reports")
    .select(REPORT_SELECT)
    .eq("category", category)
    .not("status", "in", "(duplicate,resolved)")
    .gte("created_at", since)
    .gte("lat", lat - dLat)
    .lte("lat", lat + dLat)
    .gte("lng", lng - dLng)
    .lte("lng", lng + dLng)
    .limit(20);
  return ((data ?? []) as unknown as ReportRow[]).filter(
    (r) => r.id !== excludeId && distanceMeters(lat, lng, r.lat, r.lng) <= radius
  );
}
