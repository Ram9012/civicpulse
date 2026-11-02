import { Router } from "express";
import { z } from "zod";
import { STATUS_LABELS, type ReportDetail, type ReportStatus, type Worker } from "@civicpulse/contract";
import { canTransition } from "../domain/statusMachine.js";
import { db } from "../db.js";
import { HttpError, wrap } from "../lib/http.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  REPORT_SELECT,
  fetchEvents,
  fetchReport,
  recordEvent,
  toReport,
  type ReportRow,
} from "../services/reports.js";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("staff", "admin"));

const queueQuery = z.object({
  status: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

/** Department queue. Staff see only their department; admins see everything. */
staffRouter.get(
  "/reports",
  wrap(async (req, res) => {
    const user = req.user!;
    const f = queueQuery.parse(req.query);
    let q = db().from("reports").select(REPORT_SELECT).order("created_at", { ascending: false }).limit(300);
    if (user.role === "staff") {
      if (!user.departmentId) return res.json([]);
      q = q.eq("department_id", user.departmentId);
    }
    if (f.status) q = q.eq("status", f.status);
    if (f.priority) q = q.eq("priority", f.priority);
    const { data, error } = await q;
    if (error) throw error;
    const rows = ((data ?? []) as unknown as ReportRow[]).sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );
    res.json(rows.map((r) => toReport(r, { viewerId: user.id, ai: true })));
  })
);

staffRouter.get(
  "/workers",
  wrap(async (req, res) => {
    const user = req.user!;
    let q = db().from("workers").select("id,name,department_id,active,capacity").eq("active", true).order("name");
    if (user.role === "staff") {
      if (!user.departmentId) return res.json([]);
      q = q.eq("department_id", user.departmentId);
    }
    const { data, error } = await q;
    if (error) throw error;
    const { data: busy } = await db()
      .from("reports")
      .select("worker_id")
      .in("status", ["assigned", "in_progress"])
      .not("worker_id", "is", null);
    const load = new Map<string, number>();
    for (const b of busy ?? []) load.set(b.worker_id, (load.get(b.worker_id) ?? 0) + 1);
    const workers: Worker[] = (data ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      departmentId: w.department_id,
      active: w.active,
      capacity: w.capacity,
      activeTasks: load.get(w.id) ?? 0,
    }));
    res.json(workers);
  })
);

const transitionBody = z.object({
  to: z.enum(["verified", "assigned", "in_progress", "resolved", "duplicate"]),
  workerId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  duplicateOf: z.string().max(40).optional(),
  onSiteMediaId: z.string().uuid().optional(),
  proofMediaId: z.string().uuid().optional(),
  note: z.string().trim().max(500).optional(),
});

const MESSAGES: Partial<Record<ReportStatus, (id: string) => string>> = {
  verified: (id) => `Your report ${id} was verified by municipal staff.`,
  assigned: (id) => `A field worker has been assigned to ${id}.`,
  in_progress: (id) => `Work has started on ${id}.`,
  resolved: (id) => `${id} was marked resolved. Tell us if it is not fixed.`,
  duplicate: (id) => `${id} was merged into an existing report of the same issue.`,
};

/** Attach an uploaded media row (must be the caller's, unattached, with the right stage) to the report. */
async function attach(mediaId: string, reportId: string, userId: string, stage: "on_site" | "proof") {
  const { data } = await db()
    .from("report_media")
    .update({ report_id: reportId })
    .eq("id", mediaId)
    .eq("uploader_id", userId)
    .eq("stage", stage)
    .is("report_id", null)
    .select("id");
  if (!data?.length) {
    throw new HttpError(400, "invalid_media", `The ${stage.replace("_", "-")} upload is missing or already used`);
  }
}

staffRouter.post(
  "/reports/:id/transition",
  wrap(async (req, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const b = transitionBody.parse(req.body);

    const row = await fetchReport(id);
    if (!row) throw new HttpError(404, "not_found", "Report not found");
    if (user.role === "staff" && row.department_id !== user.departmentId) {
      throw new HttpError(403, "forbidden", "This report belongs to another department");
    }
    if (!canTransition(row.status, b.to, user.role)) {
      throw new HttpError(409, "invalid_transition", `Cannot move a ${STATUS_LABELS[row.status]} report to ${STATUS_LABELS[b.to]}`);
    }

    const update: Record<string, unknown> = { status: b.to, updated_at: new Date().toISOString() };

    if (b.to === "verified") {
      if (b.priority) update.priority = b.priority;
      if (b.departmentId) {
        if (user.role !== "admin" && b.departmentId !== user.departmentId) {
          throw new HttpError(403, "forbidden", "Only an admin can move a report to another department");
        }
        update.department_id = b.departmentId;
      }
    }

    if (b.to === "assigned") {
      if (!b.workerId) throw new HttpError(400, "worker_required", "Choose a field worker");
      const dept = (update.department_id as string | undefined) ?? row.department_id;
      const { data: worker } = await db()
        .from("workers")
        .select("id,department_id,active")
        .eq("id", b.workerId)
        .maybeSingle();
      if (!worker || !worker.active || worker.department_id !== dept) {
        throw new HttpError(400, "invalid_worker", "That worker is not an active member of this department");
      }
      update.worker_id = b.workerId;
    }

    if (b.to === "in_progress" && b.onSiteMediaId) await attach(b.onSiteMediaId, id, user.id, "on_site");

    if (b.to === "resolved") {
      if (!b.proofMediaId) throw new HttpError(400, "proof_required", "Upload a proof photo to resolve");
      await attach(b.proofMediaId, id, user.id, "proof");
      update.resolved_at = new Date().toISOString();
    }

    if (b.to === "duplicate") {
      if (!b.duplicateOf || b.duplicateOf === id) {
        throw new HttpError(400, "duplicate_of_required", "Give the ID of the original report");
      }
      const { data: orig } = await db().from("reports").select("id").eq("id", b.duplicateOf).maybeSingle();
      if (!orig) throw new HttpError(400, "invalid_duplicate_of", "The original report does not exist");
      update.duplicate_of = b.duplicateOf;
    }

    const { error } = await db().from("reports").update(update).eq("id", id);
    if (error) throw error;

    await recordEvent({
      reportId: id,
      from: row.status,
      to: b.to,
      actorId: user.id,
      note: b.note ?? (b.to === "duplicate" ? `Duplicate of ${b.duplicateOf}` : null),
      notifyUserId: row.reporter_id,
      message: MESSAGES[b.to]?.(id),
    });

    const updated = (await fetchReport(id))!;
    const detail: ReportDetail = {
      ...toReport(updated, { viewerId: user.id, ai: true }),
      events: await fetchEvents(id),
      aiSuggestion: updated.ai_suggestion ?? null,
    };
    res.json(detail);
  })
);
