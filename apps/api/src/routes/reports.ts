import { Router } from "express";
import { z } from "zod";
import { CATEGORIES, type Priority, type ReportDetail } from "@civicpulse/contract";
import { config } from "../config.js";
import { canTransition } from "../domain/statusMachine.js";
import { db } from "../db.js";
import { HttpError, wrap } from "../lib/http.js";
import { audit } from "../services/audit.js";
import { suggest } from "../services/ai.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  REPORT_SELECT,
  fetchEvents,
  fetchReport,
  findNearby,
  recordEvent,
  toReport,
  upvotedSet,
  type ReportRow,
} from "../services/reports.js";

export const reportsRouter = Router();
const PAGE_SIZE = 20;
const category = z.enum(CATEGORIES as [string, ...string[]]);

const listQuery = z.object({
  category: category.optional(),
  status: z.string().optional(),
  q: z.string().max(80).optional(),
  mine: z.enum(["true", "false"]).optional(),
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/)
    .optional(), // minLng,minLat,maxLng,maxLat
  page: z.coerce.number().int().min(1).default(1),
});

reportsRouter.get(
  "/",
  optionalAuth,
  wrap(async (req, res) => {
    const f = listQuery.parse(req.query);
    let q = db()
      .from("reports")
      .select(REPORT_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE - 1);
    if (f.category) q = q.eq("category", f.category);
    if (f.status) q = q.eq("status", f.status);
    if (f.q) {
      const t = f.q.replace(/[,()%*]/g, " ").trim();
      if (t) q = q.or(`area_label.ilike.%${t}%,title.ilike.%${t}%`);
    }
    if (f.bbox) {
      const [minLng, minLat, maxLng, maxLat] = f.bbox.split(",").map(Number) as [number, number, number, number];
      q = q.gte("lat", minLat).lte("lat", maxLat).gte("lng", minLng).lte("lng", maxLng);
    }
    if (f.mine === "true") {
      if (!req.user) throw new HttpError(401, "unauthenticated", "Sign in to see your reports");
      q = q.eq("reporter_id", req.user.id);
    }
    const { data, count, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as unknown as ReportRow[];
    const ups = await upvotedSet(req.user?.id, rows.map((r) => r.id));
    res.json({ items: rows.map((r) => toReport(r, { upvoted: ups?.has(r.id), viewerId: req.user?.id })), total: count ?? 0 });
  })
);

const nearbyQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category,
});

reportsRouter.get(
  "/nearby",
  optionalAuth,
  wrap(async (req, res) => {
    const f = nearbyQuery.parse(req.query);
    const rows = await findNearby(f.lat, f.lng, f.category as never);
    const ups = await upvotedSet(req.user?.id, rows.map((r) => r.id));
    res.json(rows.map((r) => toReport(r, { upvoted: ups?.has(r.id), viewerId: req.user?.id })));
  })
);

const createBody = z.object({
  category,
  description: z.string().trim().min(5).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  areaLabel: z.string().trim().max(120).optional(),
  anonymous: z.boolean().default(false),
  mediaIds: z.array(z.string().uuid()).min(1).max(5),
});

reportsRouter.post(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const user = req.user!;
    const b = createBody.parse(req.body);

    // Only the creator's own, still-unattached uploads may be attached.
    const { data: media } = await db()
      .from("report_media")
      .select("id")
      .in("id", b.mediaIds)
      .eq("uploader_id", user.id)
      .is("report_id", null);
    if ((media ?? []).length !== b.mediaIds.length) {
      throw new HttpError(400, "invalid_media", "One or more uploads are missing or already used");
    }

    const { data: rule } = await db().from("routing_rules").select("department_id").eq("category", b.category).maybeSingle();
    const ai = await suggest(b.description).catch(() => null); // advisory only, never blocks a report
    const firstLine = b.description.split(/[.\n]/)[0]!.trim();
    const title = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;

    const { data: created, error } = await db()
      .from("reports")
      .insert({
        reporter_id: user.id,
        anonymous: b.anonymous,
        title,
        description: b.description,
        category: b.category,
        lat: b.lat,
        lng: b.lng,
        area_label: b.areaLabel || `${b.lat.toFixed(3)}, ${b.lng.toFixed(3)}`,
        department_id: rule?.department_id ?? null,
        ai_suggestion: ai ? { ...ai, departmentId: rule?.department_id ?? null } : null,
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("insert failed");

    await db().from("report_media").update({ report_id: created.id }).in("id", b.mediaIds);
    await recordEvent({
      reportId: created.id,
      from: null,
      to: "submitted",
      actorId: user.id,
      notifyUserId: user.id,
      message: `Your report ${created.id} was received.`,
    });

    const [row, dupes] = await Promise.all([
      fetchReport(created.id),
      findNearby(b.lat, b.lng, b.category as never, created.id),
    ]);
    res.status(201).json({ report: toReport(row!, { upvoted: false, viewerId: user.id }), nearbyDuplicates: dupes.map((d) => toReport(d, { viewerId: user.id })) });
  })
);

reportsRouter.get(
  "/:id",
  optionalAuth,
  wrap(async (req, res) => {
    const row = await fetchReport(String(req.params.id));
    if (!row) throw new HttpError(404, "not_found", "Report not found");
    const ups = await upvotedSet(req.user?.id, [row.id]);
    const detail: ReportDetail = {
      ...toReport(row, { upvoted: ups?.has(row.id), viewerId: req.user?.id, ai: true }),
      events: await fetchEvents(row.id),
      aiSuggestion: row.ai_suggestion ?? null,
    };
    res.json(detail);
  })
);

const bump = (current: Priority, count: number): Priority => {
  const target: Priority = count >= 10 ? "critical" : count >= 5 ? "high" : current;
  const order: Priority[] = ["low", "medium", "high", "critical"];
  return order.indexOf(target) > order.indexOf(current) ? target : current;
};

reportsRouter.post(
  "/:id/upvote",
  requireAuth,
  wrap(async (req, res) => {
    const id = String(req.params.id);
    const user = req.user!;
    const row = await fetchReport(id);
    if (!row) throw new HttpError(404, "not_found", "Report not found");

    const { data: existing } = await db()
      .from("upvotes")
      .select("report_id")
      .eq("report_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) await db().from("upvotes").delete().eq("report_id", id).eq("user_id", user.id);
    else await db().from("upvotes").insert({ report_id: id, user_id: user.id });

    const { count } = await db().from("upvotes").select("*", { count: "exact", head: true }).eq("report_id", id);
    const total = count ?? 0;
    const priority = bump(row.priority, total);
    if (priority !== row.priority) {
      await db().from("reports").update({ priority, updated_at: new Date().toISOString() }).eq("id", id);
    }
    res.json({ upvotes: total, upvoted: !existing });
  })
);

reportsRouter.post(
  "/:id/reopen",
  requireAuth,
  wrap(async (req, res) => {
    const id = String(req.params.id);
    const user = req.user!;
    const { data: row } = await db().from("reports").select("id,status,reporter_id").eq("id", id).maybeSingle();
    if (!row) throw new HttpError(404, "not_found", "Report not found");
    if (row.reporter_id !== user.id && user.role !== "admin") {
      throw new HttpError(403, "forbidden", "Only the reporter can reopen this report");
    }
    if (!canTransition(row.status, "reopened", user.role)) {
      throw new HttpError(409, "invalid_transition", `Cannot reopen a report that is ${row.status}`);
    }
    await db().from("reports").update({ status: "reopened", updated_at: new Date().toISOString() }).eq("id", id);
    await recordEvent({ reportId: id, from: row.status, to: "reopened", actorId: user.id });
    const updated = await fetchReport(id);
    res.json(toReport(updated!, { viewerId: user.id }));
  })
);

reportsRouter.delete(
  "/:id",
  requireAuth,
  wrap(async (req, res) => {
    const id = String(req.params.id);
    const user = req.user!;
    const row = await fetchReport(id);
    if (!row) throw new HttpError(404, "not_found", "Report not found");
    if (row.reporter_id !== user.id && user.role !== "admin") {
      throw new HttpError(403, "forbidden", "Only the reporter or an admin can delete this report");
    }
    const paths = row.report_media.map((m) => m.storage_path);
    if (paths.length) await db().storage.from(config.mediaBucket).remove(paths);
    const { error } = await db().from("reports").delete().eq("id", id);
    if (error) throw error;
    await audit(user.id, "report.delete", id, { title: row.title, by: user.role });
    res.status(204).end();
  })
);
