import { Router } from "express";
import { z } from "zod";
import { CATEGORIES, type AdminUser, type AuditEntry, type Category } from "@civicpulse/contract";
import { db } from "../db.js";
import { HttpError, wrap } from "../lib/http.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeAnalytics } from "../services/analytics.js";
import { audit } from "../services/audit.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/analytics", wrap(async (_req, res) => res.json(await computeAnalytics())));

// ---- departments ----
const nameBody = z.object({ name: z.string().trim().min(2).max(80) });

adminRouter.get(
  "/departments",
  wrap(async (_req, res) => {
    const { data, error } = await db().from("departments").select("id,name").order("name");
    if (error) throw error;
    res.json(data);
  })
);
adminRouter.post(
  "/departments",
  wrap(async (req, res) => {
    const { name } = nameBody.parse(req.body);
    const { data, error } = await db().from("departments").insert({ name }).select("id,name").single();
    if (error) throw new HttpError(409, "conflict", "A department with that name already exists");
    await audit(req.user!.id, "department.create", data.id, { name });
    res.status(201).json(data);
  })
);
adminRouter.put(
  "/departments/:id",
  wrap(async (req, res) => {
    const { name } = nameBody.parse(req.body);
    const { data, error } = await db().from("departments").update({ name }).eq("id", String(req.params.id)).select("id,name").single();
    if (error) throw new HttpError(409, "conflict", "Could not rename (name already used?)");
    await audit(req.user!.id, "department.rename", data.id, { name });
    res.json(data);
  })
);
adminRouter.delete(
  "/departments/:id",
  wrap(async (req, res) => {
    const id = String(req.params.id);
    const { error } = await db().from("departments").delete().eq("id", id);
    if (error) throw new HttpError(409, "in_use", "Department is still used by reports, workers, staff or routing rules");
    await audit(req.user!.id, "department.delete", id);
    res.status(204).end();
  })
);

// ---- workers ----
const workerBody = z.object({
  name: z.string().trim().min(2).max(80),
  departmentId: z.string().uuid(),
  capacity: z.number().int().min(1).max(50).default(5),
  active: z.boolean().default(true),
});
const workerOut = (w: { id: string; name: string; department_id: string; active: boolean; capacity: number }) => ({
  id: w.id,
  name: w.name,
  departmentId: w.department_id,
  active: w.active,
  capacity: w.capacity,
});

adminRouter.get(
  "/workers",
  wrap(async (_req, res) => {
    const { data, error } = await db().from("workers").select("id,name,department_id,active,capacity").order("name");
    if (error) throw error;
    res.json((data ?? []).map(workerOut));
  })
);
adminRouter.post(
  "/workers",
  wrap(async (req, res) => {
    const b = workerBody.parse(req.body);
    const { data, error } = await db()
      .from("workers")
      .insert({ name: b.name, department_id: b.departmentId, capacity: b.capacity, active: b.active })
      .select("id,name,department_id,active,capacity")
      .single();
    if (error) throw new HttpError(400, "invalid_worker", "Could not create worker (unknown department?)");
    await audit(req.user!.id, "worker.create", data.id, { name: b.name });
    res.status(201).json(workerOut(data));
  })
);
adminRouter.put(
  "/workers/:id",
  wrap(async (req, res) => {
    const b = workerBody.parse(req.body);
    const { data, error } = await db()
      .from("workers")
      .update({ name: b.name, department_id: b.departmentId, capacity: b.capacity, active: b.active })
      .eq("id", String(req.params.id))
      .select("id,name,department_id,active,capacity")
      .single();
    if (error) throw new HttpError(400, "invalid_worker", "Could not update worker");
    await audit(req.user!.id, "worker.update", data.id, { name: b.name, active: b.active });
    res.json(workerOut(data));
  })
);
adminRouter.delete(
  "/workers/:id",
  wrap(async (req, res) => {
    const id = String(req.params.id);
    const { error } = await db().from("workers").delete().eq("id", id);
    if (error) throw new HttpError(409, "in_use", "Worker has assigned reports. Deactivate them instead");
    await audit(req.user!.id, "worker.delete", id);
    res.status(204).end();
  })
);

// ---- routing rules ----
adminRouter.get(
  "/routing",
  wrap(async (_req, res) => {
    const { data, error } = await db().from("routing_rules").select("category,department_id");
    if (error) throw error;
    res.json((data ?? []).map((r) => ({ category: r.category as Category, departmentId: r.department_id })));
  })
);
adminRouter.put(
  "/routing",
  wrap(async (req, res) => {
    const rules = z
      .array(z.object({ category: z.enum(CATEGORIES as [Category, ...Category[]]), departmentId: z.string().uuid() }))
      .parse(req.body);
    const { error } = await db()
      .from("routing_rules")
      .upsert(rules.map((r) => ({ category: r.category, department_id: r.departmentId })));
    if (error) throw new HttpError(400, "invalid_rule", "Unknown department in routing rules");
    await audit(req.user!.id, "routing.update", null, rules);
    res.json(rules);
  })
);

// ---- users ----
adminRouter.get(
  "/users",
  wrap(async (_req, res) => {
    const [{ data: profiles }, listed] = await Promise.all([
      db().from("profiles").select("id,name,role,department_id").order("name"),
      db().auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const emails = new Map((listed.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const users: AdminUser[] = (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: emails.get(p.id) ?? "",
      role: p.role,
      departmentId: p.department_id,
    }));
    res.json(users);
  })
);
adminRouter.put(
  "/users/:id/role",
  wrap(async (req, res) => {
    const b = z
      .object({ role: z.enum(["citizen", "staff", "admin"]), departmentId: z.string().uuid().nullable().default(null) })
      .parse(req.body);
    const id = String(req.params.id);
    if (id === req.user!.id && b.role !== "admin") {
      throw new HttpError(400, "self_demote", "You cannot remove your own admin role");
    }
    if (b.role === "staff" && !b.departmentId) {
      throw new HttpError(400, "department_required", "Staff members need a department");
    }
    const { data, error } = await db()
      .from("profiles")
      .update({ role: b.role, department_id: b.role === "staff" ? b.departmentId : null })
      .eq("id", id)
      .select("id,name,role,department_id")
      .single();
    if (error) throw new HttpError(400, "invalid_user", "Could not update user");
    await audit(req.user!.id, "user.role", id, { role: b.role, departmentId: b.departmentId });
    res.json({ id: data.id, name: data.name, role: data.role, departmentId: data.department_id });
  })
);

// ---- audit log ----
adminRouter.get(
  "/audit-logs",
  wrap(async (_req, res) => {
    const [logs, events] = await Promise.all([
      db().from("audit_logs").select("id,action,target,detail,created_at,actor:profiles(name)").order("created_at", { ascending: false }).limit(100),
      db()
        .from("report_events")
        .select("id,report_id,from_status,to_status,note,created_at,actor:profiles(name)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    type Actor = { actor: { name: string } | null };
    const entries: AuditEntry[] = [
      ...((logs.data ?? []) as unknown as (Actor & { id: string; action: string; target: string | null; detail: unknown; created_at: string })[]).map(
        (l) => ({
          id: l.id,
          at: l.created_at,
          actor: l.actor?.name ?? "System",
          action: l.action,
          target: l.target,
          detail: l.detail ? JSON.stringify(l.detail) : null,
        })
      ),
      ...((events.data ?? []) as unknown as (Actor & { id: string; report_id: string; from_status: string | null; to_status: string; note: string | null; created_at: string })[]).map(
        (e) => ({
          id: e.id,
          at: e.created_at,
          actor: e.actor?.name ?? "System",
          action: `status: ${e.from_status ?? "new"} → ${e.to_status}`,
          target: e.report_id,
          detail: e.note,
        })
      ),
    ].sort((a, b) => b.at.localeCompare(a.at));
    res.json(entries.slice(0, 150));
  })
);
