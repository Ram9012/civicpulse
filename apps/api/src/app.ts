import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { db } from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import {
  adminRouter,
  aiRouter,
  mediaRouter,
  notificationsRouter,
  reportsRouter,
  staffRouter,
} from "./routes/stubs.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  // UptimeRobot pings this every 5 min to keep Render awake. The DB query doubles as a DB connectivity check.
  app.get("/health", async (_req, res) => {
    try {
      const { error } = await db().from("departments").select("id").limit(1);
      if (error) throw error;
      res.json({ ok: true, db: "up" });
    } catch (err) {
      // Log the real reason (missing env, bad key, missing table) so "db down" is debuggable.
      console.error("[health] db check failed:", err instanceof Error ? err.message : err);
      res.status(503).json({ ok: false, db: "down" });
    }
  });

  app.get("/me", requireAuth, (req, res) => res.json(req.user));
  app.use("/reports", reportsRouter);
  app.use("/media", mediaRouter);
  app.use("/notifications", notificationsRouter);
  app.use("/staff", staffRouter);
  app.use("/admin", adminRouter);
  app.use("/ai", aiRouter);

  return app;
}
