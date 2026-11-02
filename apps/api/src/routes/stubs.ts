import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const notImplemented = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
  res.status(501).json({ error: { code: "not_implemented", message: "TODO (Bipin) - see packages/contract/openapi.yaml" } });

// Remaining route stubs (staff, admin, ai) mirror packages/contract/openapi.yaml. Bipin replaces each 501 with a real handler.
// Keep one file per area when you implement (reports.ts, staff.ts, admin.ts, media.ts, notifications.ts).

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
