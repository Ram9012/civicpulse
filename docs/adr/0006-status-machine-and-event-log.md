# ADR 0006: Server-enforced status machine and a single event log

**Status:** accepted. **Decider:** Ramansh.

## Context
A report passes through several people. We need the process to be predictable, auditable, and visible in three portals, and we need notifications.

## Decision
- Allowed transitions are data: `STATUS_TRANSITIONS` in `packages/contract`. Which role may trigger each target is in `apps/api/src/domain/statusMachine.ts` (`canTransition(from, to, role)`).
  ```
  submitted -> verified -> assigned -> in_progress -> resolved -> reopened -> assigned
  submitted/verified -> duplicate
  ```
- Extra rules per transition live in `routes/staff.ts`: `assigned` needs an active worker of the report's department, `resolved` needs an uploaded proof photo, `duplicate` needs the original report's ID. Staff can only act on their own department's reports.
- **Every** status change calls `recordEvent()`, which inserts a row into `report_events` and (when relevant) a `notifications` row for the reporter.
- `report_events` is the single history: it drives the public timeline, the admin audit view (together with `audit_logs` for non-status admin actions), and notification text.

## Why
- Putting the rules in one small module makes them easy to review and impossible for the UI to bypass.
- One event table avoids three diverging histories (timeline, audit, notifications).
- Data-driven transitions let the UI show only valid buttons by reading the same constant the server enforces.

## Alternatives rejected
- **Free-form status editing:** invites inconsistent data and unaccountable changes.
- **Database triggers for events/notifications:** logic hidden from code review and harder to test.
- **A workflow engine:** far too heavy.

## Consequences
- `statusMachine.ts` and `auth.ts` are Ramansh-owned core. Bipin calls them, never edits them (enforced in `.github/scope-map.json`).
- Changing the process (e.g. adding an "escalated" state) touches the contract, the machine, the migration check constraint, and the UI. That is deliberate friction.
- A transition does several writes without a database transaction (Supabase REST has none). Failures mid-way could leave an event missing. Acceptable for a prototype; a Postgres function would fix it (backlog item B4).
