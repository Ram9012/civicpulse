# Workflow and roles (hard boundaries)

These boundaries are enforced three ways: this document, the AI-agent rules in `.agents/`, and automation (`scripts/scope-guard.js` locally, `scope-check` in CI). A PR that crosses them fails.

## Ownership
| Area | Path | Owner | Others |
|---|---|---|---|
| Web app | `apps/web/**` | **Jerome** | read-only |
| API + DB SQL | `apps/api/**` (except the core files below) | **Bipin** | read-only |
| API contract + shared types | `packages/contract/**` | **Ramansh** | read-only |
| CI/CD, deploy, scope rules | `.github/**`, `render.yaml`, `scripts/**`, `.claude/**` | **Ramansh** | read-only |
| Docs and agent rules | `docs/**`, `.agents/**`, `*.md` at root | **Ramansh** | read-only |
| Root config | `package.json`, lockfile, `.env.example` | **Ramansh** | read-only |

**Your exact task list:** [Jerome](handoff-jerome.md) · [Bipin](handoff-bipin.md). Background on decisions: [ADRs](adr/README.md). Current state: [status.md](status.md).

## Jerome (frontend only)
**Does**
- Every screen, component, route and style in `apps/web`
- Wizard, Explore (list + map), My reports, Staff queue, Admin pages
- API calls via `src/lib/api.ts` using types from `@civicpulse/contract`
- Real API data everywhere in the product; test fixtures only inside tests
- Component tests for logic-heavy components

**Does not**
- Touch anything outside `apps/web/**`
- Write backend code, SQL, or serverless functions "just to unblock myself"
- Edit the contract or types. Need a field? Open an issue labelled `contract`
- Add dependencies without Ramansh approval
- Put secrets in code. Only `VITE_*` public values are allowed in the web app
- Invent endpoints. If it is not in `openapi.yaml`, ask

## Bipin (backend only)
**Does**
- All endpoints in `apps/api`, following `openapi.yaml` exactly
- Zod validation, auth checks, role/department scoping
- Writing `report_events` and `notifications` on every status change
- SQL migrations in `apps/api/db/migrations/` (new numbered files only)
- Seed data, API tests
- Tests, hardening and performance work on the existing AI module (`services/ai.ts`); turning Groq on is Ramansh's decision

**Does not**
- Touch anything outside `apps/api/**`
- Change response shapes or add endpoints not in the contract. Open a `contract` issue
- Edit `statusMachine.ts` rules (Ramansh core). Use `canTransition()`
- Apply migrations to the shared Supabase project. Ramansh runs them after review
- Add dependencies without Ramansh approval
- Touch frontend, CI, or Render config

## Ramansh
Reviews and merges every PR, owns the contract, CI/CD, deployment, Supabase/Render/UptimeRobot setup, and some backend core (auth middleware, status machine).

## Branching
`feat/*` (from `dev`) -> PR into `dev` -> Ramansh merges -> Ramansh promotes `dev` into `main` -> Render deploys. Contributors never PR or push to `main`.

## When you need something outside your area
1. Do **not** do it yourself.
2. Open an issue using the feature template, tag the owner, describe what you need.
3. Keep working on another task from your list.

## Milestones
Built so far (see `docs/scope.md`): M1 citizen core, M2 staff workflow, M3 admin, M4 extras (languages, offline, voice, AI, map tools, info pages).

| Phase | Goal | Jerome | Bipin | Ramansh |
|---|---|---|---|---|
| Now | Harden and polish | Mobile/UX polish, empty and error states, component tests | API tests, input validation review, error messages | Review, apply migrations, deploy, verify |
| Next | Pilot with real users | UX fixes from feedback; translate remaining admin strings | Fix bugs from feedback; tune duplicate radius and priority thresholds | Monitor, run migrations, promote `dev` to `main` |
