import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const notImplemented = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
  res.status(501).json({ error: { code: "not_implemented", message: "TODO (Bipin) - see packages/contract/openapi.yaml" } });

// Route stubs mirror packages/contract/openapi.yaml. Bipin replaces each 501 with a real handler.
// Keep one file per area when you implement (reports.ts, staff.ts, admin.ts, media.ts, notifications.ts).

export const reportsRouter = Router();
reportsRouter.get("/", notImplemented);
reportsRouter.post("/", requireAuth, notImplemented);
reportsRouter.get("/:id", notImplemented);
reportsRouter.post("/:id/upvote", requireAuth, notImplemented);
reportsRouter.post("/:id/reopen", requireAuth, notImplemented);

export const mediaRouter = Router();
mediaRouter.post("/upload-url", requireAuth, notImplemented);

export const notificationsRouter = Router();
notificationsRouter.get("/", requireAuth, notImplemented);
notificationsRouter.post("/:id/read", requireAuth, notImplemented);

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("staff", "admin"));
staffRouter.get("/reports", notImplemented);
staffRouter.post("/reports/:id/transition", notImplemented);
staffRouter.get("/workers", notImplemented);

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/analytics", notImplemented);
adminRouter.all("/departments", notImplemented);
adminRouter.all("/workers", notImplemented);
adminRouter.all("/routing", notImplemented);
adminRouter.put("/users/:id/role", notImplemented);
adminRouter.get("/audit-logs", notImplemented);

export const aiRouter = Router();
aiRouter.post("/suggest", requireAuth, notImplemented);
