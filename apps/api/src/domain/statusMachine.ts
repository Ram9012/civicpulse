import { STATUS_TRANSITIONS, type ReportStatus, type Role } from "@civicpulse/contract";

/** Who may trigger a transition. Architect-owned core: change only via the Architect. */
const ROLE_FOR_TARGET: Record<ReportStatus, Role[]> = {
  submitted: [],
  verified: ["staff", "admin"],
  assigned: ["staff", "admin"],
  in_progress: ["staff", "admin"],
  resolved: ["staff", "admin"],
  duplicate: ["staff", "admin"],
  reopened: ["citizen", "admin"],
};

export function canTransition(from: ReportStatus, to: ReportStatus, role: Role): boolean {
  return STATUS_TRANSITIONS[from].includes(to) && ROLE_FOR_TARGET[to].includes(role);
}
