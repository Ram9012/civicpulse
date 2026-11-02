# Agent rules: Bipin (backend only)

You are assisting **Bipin**, who builds the **backend**. Nothing else.

## Allowed (write access)
- `apps/api/**` only (routes, middleware, services, tests, `db/migrations/*.sql`, `db/seed.sql`)

## Forbidden (never edit, even if asked, even "temporarily")
- `apps/web/**` (any frontend code, styles, assets)
- `packages/contract/**` (API types and OpenAPI)
- `apps/api/src/domain/statusMachine.ts` rules and `apps/api/src/middleware/auth.ts` (Ramansh core; call them, don't change them. If they need a change, ask)
- `.github/**`, `render.yaml`, `scripts/**`, `.claude/**`
- `docs/**`, `.agents/**`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`
- Root `package.json`, `package-lock.json`, `.env.example`, any `.env*`

## Forbidden actions
- Changing request/response shapes, adding endpoints, or renaming fields without a contract change from Ramansh. Match `packages/contract/openapi.yaml` exactly.
- Applying migrations to the shared Supabase project or touching production data. Write the SQL; Ramansh applies it. Never edit an already-numbered migration; add a new one.
- Trusting the client for identity, role, department, or reporter id. Take them from `req.user`.
- Returning reporter identity for anonymous reports, exact addresses, or any personal data on public endpoints.
- Skipping `canTransition()` for status changes, or changing status without inserting a `report_events` row and a `notifications` row.
- Logging or returning secrets, tokens or the service-role key.
- Adding npm packages, queues, caches, ORMs, or new services (ask Ramansh).
- Building the Groq AI module unless the human says it is in the current task; it stays behind `AI_ENABLED` and advisory only.
- Pushing to `main` or `dev`, or merging into either (push your feature branch and open a PR **into `dev`**).

## What you do
- Implement stubs in `apps/api/src/routes/` per the contract; one file per area
- Validate every input with Zod; return the standard error shape `{ error: { code, message } }`
- Enforce role + department scoping (staff only see their department)
- Status changes: validate with `canTransition`, update `reports`, insert `report_events`, insert `notifications` for the reporter
- Media: signed upload URLs; attach media to reports; proof photo required to resolve
- Duplicate check on create: same category within ~100 m and last 7 days; return `nearbyDuplicates`
- Analytics queries; audit log read endpoint
- vitest tests for logic (transitions, scoping, validation)

## If you need something from outside your area
Stop. Tell Bipin: "This needs a contract change / frontend change / infra change. Open an issue labelled `contract` and tag Ramansh." Do not edit the other area.

## Definition of done
`npm run lint && npm run typecheck && npm run test -w apps/api && npm run build -w apps/api` pass; example requests/responses for the PR; all changed files under `apps/api/`.
