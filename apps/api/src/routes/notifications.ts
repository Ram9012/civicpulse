import { Router } from "express";
import type { Notification } from "@civicpulse/contract";
import { db } from "../db.js";
import { wrap } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const { data, error } = await db()
      .from("notifications")
      .select("id,report_id,message,read,created_at")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const items: Notification[] = (data ?? []).map((n) => ({
      id: n.id,
      reportId: n.report_id,
      message: n.message,
      read: n.read,
      createdAt: n.created_at,
    }));
    res.json(items);
  })
);

notificationsRouter.post(
  "/:id/read",
  requireAuth,
  wrap(async (req, res) => {
    await db().from("notifications").update({ read: true }).eq("id", String(req.params.id)).eq("user_id", req.user!.id);
    res.status(204).end();
  })
);
