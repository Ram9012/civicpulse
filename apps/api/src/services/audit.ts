import { db } from "../db.js";

/** Record an admin/destructive action. Status changes are recorded in report_events instead. */
export async function audit(actorId: string | null, action: string, target: string | null, detail?: unknown) {
  await db().from("audit_logs").insert({ actor_id: actorId, action, target, detail: detail ?? null });
}
