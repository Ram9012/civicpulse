# Workflow and roles (hard boundaries)

These boundaries are enforced three ways: this document, the AI-agent rules in `.agents/`, and automation (`scripts/scope-guard.js` locally, `scope-check` in CI). A PR that crosses them fails.

## Ownership
| Area | Path | Owner | Others |
|---|---|---|---|
| Web app | `apps/web/**` | **Jerome** | read-only |
| API + DB SQL | `apps/api/**` | **Bipin** | read-only |
| API contract + shared types | `packages/contract/**` | **Ramansh** | read-only |
| CI/CD, deploy, scope rules | `.github/**`, `render.yaml`, `scripts/**`, `.claude/**` | **Ramansh** | read-only |
| Docs and agent rules | `docs/**`, `.agents/**`, `*.md` at root | **Ramansh** | read-only |
| Root config | `package.json`, lockfile, `.env.example` | **Ramansh** | read-only |

## Jerome (frontend only)
**Does**
- Every screen, component, route and style in `apps/web`
- Wizard, Explore (list + map), My reports, Staff queue, Admin pages
- API calls via `src/lib/api.ts` using types from `@civicpulse/contract`
- Mock data under `apps/web/src/mocks/` so work is never blocked by the backend
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
- Optional Groq AI module (only when told)

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
3. Keep working on something else, or on your mock.

## Milestones
| | Goal | Jerome | Bipin | Ramansh |
|---|---|---|---|---|
| M0 | Deployed hello-world | - | - | Repo, Supabase, Render, UptimeRobot, CI |
| M1 | Sign in + submit a report | Sign in, wizard, My reports | Auth, `/me`, media upload URL, `POST /reports`, `GET /reports` | Review, apply migration |
| M2 | Staff workflow | Staff queue + detail + actions | `/staff/*` transitions, events, notifications | Review |
| M3 | Admin + analytics | Admin pages | `/admin/*`, analytics | Review |
| M4 | Polish and demo | Mobile polish, empty/error states | Seed script, hardening | Final QA, demo data |
