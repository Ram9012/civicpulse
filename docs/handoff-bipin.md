# Handoff: Bipin (backend only)

**Your area:** `apps/api/**` except the two Ramansh-owned core files (`src/middleware/auth.ts`, `src/domain/statusMachine.ts`). Read [workflow-and-roles.md](workflow-and-roles.md) once so the boundaries are clear.

## Where we are
The whole API is built and deployed: reports, media uploads, notifications, staff queue and transitions, admin CRUD and analytics, public stats, saved areas, AI triage and chat. You are not building endpoints from scratch. Your job from here is **tests, hardening, performance and operations** on a working API, in the order below. Tell your agent "I'm Bipin" at the start of every session.

## Map of your code
| What | Where |
|---|---|
| App wiring, `/health` | `apps/api/src/app.ts` |
| Config and env loading | `src/config.ts` |
| Supabase client | `src/db.ts` |
| Routes | `src/routes/{reports,media,notifications,staff,admin,misc}.ts` |
| Business logic | `src/services/{reports,analytics,ai,audit}.ts` |
| Errors and async wrapper | `src/lib/http.ts` |
| **Not yours** (call, do not edit) | `src/middleware/auth.ts` (`requireAuth`, `optionalAuth`, `requireRole`), `src/domain/statusMachine.ts` (`canTransition`) |
| Schema | `db/migrations/0001` to `0003`, `db/seed.sql` |
| Contract (read-only for you) | `packages/contract/openapi.yaml`, `src/index.ts` |

Run it: `npm install`, copy `.env.example` to `.env` (Ramansh gives you the Supabase values and a service-role key), `npm run dev:api`, open `http://localhost:4000/health`. Tests: `npm run test -w apps/api`. Rules to know first: [ADR 0002](adr/0002-api-only-writer.md), [ADR 0006](adr/0006-status-machine-and-event-log.md).

## Your tasks, in priority order
Do one task per PR (small PRs, into `dev`). Each lists **what**, **acceptance criteria**, and **not in this task**.

### B1. Privacy regression tests and audit  (start here)
- **Known issue already fixed by Ramansh:** the public timeline showed the reporter's name on the first event even for anonymous reports. It now shows "Anonymous reporter". Add a regression test.
- **What:** audit every response that can reach a public or non-owner caller for personal data: `toReport`, `fetchEvents`, notifications, `ai/chat` report facts, `stats/public`, error messages. Confirm anonymous reports never expose the reporter by name or id. Decide with Ramansh whether `aiSuggestion` should be hidden from non-staff on `GET /reports/:id`; implement what he chooses.
- **Accept:** a written checklist in the PR of each endpoint checked; tests proving anonymous reporter identity is hidden on list, detail and timeline; no raw database error text reaches clients.

### B2. Route tests
- **What:** test the routes without a real database by mocking `src/db.ts` with `vi.mock` and a small fake query builder.
- **Allowed new dev dependency (pre-approved):** `supertest` (and `@types/supertest`).
- **Cover at least:** reports list hides reporter for anonymous; create requires auth and ownership of the attached media (400 otherwise); upvote toggles and bumps priority at 5 (high) and 10 (critical); reopen only by owner or admin and only from `resolved` (409 otherwise); delete only by owner or admin; staff transition matrix: invalid transition is 409, other department is 403, `assigned` needs an active worker of that department (400), `resolved` needs a proof photo (400), `duplicate` needs `duplicateOf` (400); admin routes return 403 for staff; role update: staff needs a department, an admin cannot demote themselves.
- **Accept:** `npm run test -w apps/api` passes locally and in CI; every error branch in `routes/staff.ts` and `routes/reports.ts` has a test.

### B3. Rate limiting
- **What:** an in-memory sliding-window limiter in `src/middleware/rateLimit.ts`, **no new dependency**. Suggested limits: `POST /reports` 10 per hour per user, `POST /media/upload-url` 60 per hour per user, `POST /ai/suggest` 30 per hour per user, `POST /ai/chat` 20 per 10 minutes per IP (behind Render's proxy: set Express `trust proxy` and use `req.ip`). Over the limit returns 429 with the standard error shape and a `Retry-After` header. Put the numbers in the rules config (B7) or as named constants.
- **Accept:** unit tests for the limiter; documented in `apps/api/README.md`; note that it resets on restart and is per instance.

### B4. Atomic status transitions
- **What:** a status change currently makes several separate writes (update report, attach media, insert event, insert notification), so a failure mid-way can leave them out of sync. Add a Postgres function `transition_report(...)` in a new migration that does the report update, event insert and notification insert in **one transaction**, and call it with `db().rpc(...)` from `routes/staff.ts` and the reopen route. Keep every validation (`canTransition`, worker, proof, department) in TypeScript before calling it.
- **Accept:** same API behaviour and response; a test shows nothing is written when the function fails; the migration is reviewed by Ramansh, who applies it before merge.
- **Not in this task:** changing the transition rules or `statusMachine.ts`.

### B5. Analytics performance and indexes
- **What:** `services/analytics.ts` loads up to 10,000 reports into memory. Move the aggregation into SQL (views or an `rpc` function) in a new migration and add indexes: `reports(created_at)`, `reports(resolved_at)`, `reports(worker_id)`, `report_events(report_id, created_at)`, `notifications(user_id, created_at)`.
- **Accept:** `GET /admin/analytics` and `/stats/public` return the **identical shape** (the contract does not change); port or keep the `buildAnalytics` tests; note the before/after query time on a large seed (see B9).

### B6. Media hygiene
- **What:** a script `apps/api/scripts/cleanup-media.ts` plus an npm script that deletes `report_media` rows with no report that are older than 24 hours, and their storage objects. Default to a dry run that only prints what it would delete; require `--apply` to delete. Document it in `apps/api/README.md`.
- **Accept:** safe to run repeatedly; never touches media attached to a report.
- **Ramansh does:** set the bucket's file size and allowed-type limits in Supabase.

### B7. Tunable rules in one place
- **What:** move the duplicate radius (100 m) and window (7 days), upvote priority thresholds (5, 10), page size (20), and `TYPICAL_DAYS` into `src/config/rules.ts` as named constants with comments; add tests. No behaviour change.
- **Accept:** changing a number in one file changes the behaviour everywhere; existing tests still pass.

### B8. Logging and operations
- **What:** a request-id middleware and a one-line access log (method, path, status, milliseconds, user role; **never** bodies, tokens or emails). Include the request id in error logs. Add `version` (from `RENDER_GIT_COMMIT` when present) to the `/health` response without changing its existing fields.
- **Accept:** a failing request can be traced from the client error to a log line; no secrets or personal data in logs.

### B9. Dev-only demo data
- **What:** `npm run seed:demo -w apps/api` that creates sample users (one citizen, one staff per department, one admin), workers, and about 30 reports across all statuses with titles prefixed `[demo]`, plus `--remove` to delete exactly that data. It must refuse to run unless `ALLOW_DEMO_SEED=true` and must print which Supabase project it is about to modify and ask for confirmation.
- **Accept:** never runs by default, never on production. This exists so B5 and the staff/admin screens can be tested with realistic volume.

## Rules that always apply
- Work only in `apps/api/**` and never edit `auth.ts` or `statusMachine.ts`. If you need a change there, or a contract change (new endpoint, field, or response shape), **stop and open an issue labelled `contract`** (or `core`). Ramansh decides.
- Match `packages/contract/openapi.yaml` exactly. Do not add or rename fields.
- Validate every input with Zod; return `{ error: { code, message } }`; take identity, role and department only from `req.user`, never the request body.
- Every status change must go through the status machine and write a timeline event and a notification.
- Never apply migrations to the shared Supabase project and never touch real data. Write numbered SQL files (never edit an applied one); Ramansh runs them after review.
- New dependencies only the pre-approved `supertest` above. Anything else: ask first.
- Never log or return secrets, tokens, or the service-role key.

## Branch and PR flow
```bash
git checkout dev && git pull
git checkout -b feat/bipin-<topic>
# work, then
npm run lint && npm run typecheck && npm run test && npm run build
git push -u origin feat/bipin-<topic>   # then open a PR INTO dev
```
PR template filled in with example requests and responses, CI green. Ramansh reviews and merges. Do not merge your own PR. Never push to `main` or `dev`.

## Definition of done
Acceptance criteria met; input validated and roles checked; tests added; lint, typecheck, test and build pass; request/response examples in the PR; only files under `apps/api/` changed.

## Who to ask
Anything about scope, the contract, migrations, env values or deployment: Ramansh. Background on why things are the way they are: [docs/adr/](adr/README.md).
