# Architecture

```
 Browser (React, Render static site)
   |  1. sign in via Supabase Auth  -> gets JWT
   |  2. REST calls with  Authorization: Bearer <JWT>
   |  3. uploads photo/video directly to Supabase Storage using a signed URL
   v
 API (Express, Render web service)  --service role-->  Supabase Postgres + Storage
   ^
   |  UptimeRobot GET /health every 5 min (purpose: keep the Render free tier from spinning down)
```

## Principles
- **The API is the only writer.** The browser never writes to the database directly. RLS is on with no policies, so only the API (service role) can read or write tables.
- **Contract first.** `packages/contract/openapi.yaml` + `src/index.ts` define every endpoint and type. Frontend and backend meet only there.
- **Server enforces rules.** Roles, department scoping and status transitions are checked in the API. The UI hiding a button is cosmetic.
- **Polling, not websockets.** TanStack Query refetches every 10 s.

## Auth flow
1. Web signs up/in with Supabase Auth (anon key) and receives a JWT.
2. Web sends the JWT to the API. `middleware/auth.ts` calls `supabase.auth.getUser(token)`, loads `profiles` (role, department), sets `req.user`.
3. Roles live only in `profiles.role`. A DB trigger creates a `citizen` profile on sign-up; only an admin can change roles.

## Media upload flow
1. Web calls `POST /media/upload-url` -> `{ mediaId, path, token, publicUrl }`. The API records an unattached `report_media` row owned by the caller.
2. Web uploads with `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)` (bucket `report-media`).
3. Web calls `POST /reports` with `mediaIds`; the API checks the caller owns each unattached upload and attaches them to the new report.
4. Staff on-site and proof photos use the same flow with `stage: "on_site"` / `"proof"` and are attached by the transition request.

## Cross-portal update flow (the core requirement)
```
Citizen submits -> reports row (status=submitted) + report_events + routed department
Staff verifies  -> POST /staff/reports/:id/transition {to:"verified"}
                   API: check role + canTransition() -> update reports -> insert report_events
                        -> insert notifications for the reporter
Citizen page    -> next poll (<=10s) sees status=verified, timeline entry, notification
Admin analytics -> reads the same tables
```

## Data model
`departments`, `profiles`, `routing_rules`, `workers` (with `capacity`), `reports` (with `resolved_at`, `ai_suggestion`), `report_media` (with `uploader_id`), `report_events`, `upvotes`, `notifications`, `audit_logs`, `saved_areas`. SQL: `apps/api/db/migrations/0001` to `0003`.
- `report_events` is the single history table. It powers the timeline, the audit log and notification text.
- Public responses expose `area_label` (coarse) and hide the reporter when `anonymous`, including on the timeline. Exact coordinates are used for the map pin only.

## Priority and routing
- Department comes from `routing_rules` (category -> department), editable by admin.
- Default priority `medium`. Staff may change it at verify time. Confirmations (upvotes) raise it to `high` at 5 and `critical` at 10.
- The AI suggestion (Groq if enabled, keyword rules otherwise) is stored in `reports.ai_suggestion`, shown to staff, and never applied automatically.

## More flows
**Staff transition** (`POST /staff/reports/:id/transition`): require staff/admin -> department scope check -> `canTransition()` -> per-target rules (worker, proof photo, duplicate-of) -> update report -> `recordEvent()` (timeline row + reporter notification).

**Offline report:** wizard -> offline or network error -> files + payload saved in IndexedDB -> on reconnect `SyncBanner` uploads files, creates the report, and removes the queued item only after success.

**Duplicate nudge:** before submit, `GET /reports/nearby` returns open same-category reports within ~100 m from the last 7 days; the citizen can confirm one instead of filing a new report.

**AI / assistant:** `POST /ai/suggest` and `/ai/chat` call Groq only when `AI_ENABLED=true` and a key exists; otherwise deterministic keyword rules answer. Output is advisory.

## Why it is built this way
Every major decision and the alternatives we rejected are in [adr/](adr/README.md).

## Deployment
See [deployment.md](deployment.md).
