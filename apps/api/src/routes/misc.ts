import { Router } from "express";
import { z } from "zod";
import { STATUS_LABELS, type AiSuggestion, type PublicStats, type SavedArea } from "@civicpulse/contract";
import { db } from "../db.js";
import { HttpError, wrap } from "../lib/http.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { chat, suggest } from "../services/ai.js";
import { computeAnalytics } from "../services/analytics.js";

// ---------- public ----------
export const publicRouter = Router();

/** Department list for dropdowns and labels. Names are not sensitive. */
publicRouter.get(
  "/departments",
  wrap(async (_req, res) => {
    const { data, error } = await db().from("departments").select("id,name").order("name");
    if (error) throw error;
    res.json(data);
  })
);

/** Real numbers from the database for the Impact page. No personal data. */
publicRouter.get(
  "/stats/public",
  wrap(async (_req, res) => {
    const a = await computeAnalytics();
    const stats: PublicStats = {
      reportsSubmitted: a.totals.total,
      issuesResolved: a.totals.resolved,
      departmentsConnected: a.departments.length,
      avgResponseDays: a.totals.avgResolutionDays,
      departments: a.departments,
      weekly: a.weekly,
    };
    res.json(stats);
  })
);

// ---------- AI ----------
export const aiRouter = Router();

aiRouter.post(
  "/suggest",
  requireAuth,
  wrap(async (req, res) => {
    const { description } = z.object({ description: z.string().trim().min(5).max(1000) }).parse(req.body);
    const s = await suggest(description);
    const { data: rule } = await db().from("routing_rules").select("department_id").eq("category", s.category).maybeSingle();
    const out: AiSuggestion = { ...s, departmentId: rule?.department_id ?? null };
    res.json(out);
  })
);

const chatBody = z.object({
  message: z.string().trim().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) }))
    .max(12)
    .default([]),
});

aiRouter.post(
  "/chat",
  optionalAuth,
  wrap(async (req, res) => {
    const b = chatBody.parse(req.body);
    // If the user names a report, give the bot its real public status (never reporter identity).
    let facts: string | null = null;
    const id = b.message.match(/CIV-\d+/i)?.[0]?.toUpperCase();
    if (id) {
      const { data } = await db().from("reports").select("id,status,category,area_label,priority").eq("id", id).maybeSingle();
      facts = data
        ? `${data.id}: ${STATUS_LABELS[data.status as keyof typeof STATUS_LABELS]} (${data.category}, ${data.priority} priority) near ${data.area_label}.`
        : `I could not find a report with ID ${id}. Check the ID in My reports.`;
    }
    res.json(await chat(b.message, b.history, facts));
  })
);

// ---------- saved areas (/me/areas) ----------
export const areasRouter = Router();
areasRouter.use(requireAuth);

const areaOut = (a: { id: string; name: string; lat: number; lng: number; radius_km: number }): SavedArea => ({
  id: a.id,
  name: a.name,
  lat: a.lat,
  lng: a.lng,
  radiusKm: a.radius_km,
});

areasRouter.get(
  "/",
  wrap(async (req, res) => {
    const { data, error } = await db().from("saved_areas").select("id,name,lat,lng,radius_km").eq("user_id", req.user!.id).order("name");
    if (error) throw error;
    res.json((data ?? []).map(areaOut));
  })
);
areasRouter.post(
  "/",
  wrap(async (req, res) => {
    const b = z
      .object({
        name: z.string().trim().min(1).max(40),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusKm: z.number().min(0.2).max(20).default(1),
      })
      .parse(req.body);
    const { count } = await db().from("saved_areas").select("*", { count: "exact", head: true }).eq("user_id", req.user!.id);
    if ((count ?? 0) >= 10) throw new HttpError(400, "limit", "You can save up to 10 areas");
    const { data, error } = await db()
      .from("saved_areas")
      .insert({ user_id: req.user!.id, name: b.name, lat: b.lat, lng: b.lng, radius_km: b.radiusKm })
      .select("id,name,lat,lng,radius_km")
      .single();
    if (error) throw error;
    res.status(201).json(areaOut(data));
  })
);
areasRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    await db().from("saved_areas").delete().eq("id", String(req.params.id)).eq("user_id", req.user!.id);
    res.status(204).end();
  })
);
