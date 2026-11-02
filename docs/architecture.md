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
1. Web calls `POST /media/upload-url` -> `{ mediaId, uploadUrl, publicUrl }`.
2. Web PUTs the file to `uploadUrl` (Supabase Storage bucket `report-media`).
3. Web calls `POST /reports` with `mediaIds`; the API attaches the media rows to the new report.
4. Staff proof photos use the same flow with `stage: "proof"`.

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
`departments`, `profiles`, `routing_rules`, `workers`, `reports`, `report_media`, `report_events`, `upvotes`, `notifications`. SQL: `apps/api/db/migrations/0001_init.sql`.
- `report_events` is the single history table. It powers the timeline, the audit log and notification text.
- Public responses expose `area_label` (coarse) and hide `reporter` when `anonymous`. Exact coordinates are used for the map pin only.

## Priority and routing
- Department comes from `routing_rules` (category -> department), editable by admin.
- Default priority `medium`. Staff may change it at verify time. Upvote thresholds can raise it (Bipin proposes thresholds in a PR).
- Optional AI suggestion is stored in `reports.ai_suggestion` and is never applied automatically.

## Deployment
See [deployment.md](deployment.md).
