# CivicPulse

A civic issue reporting platform. Citizens photograph a problem (pothole, broken streetlight, garbage), the report is verified and routed to the right municipal department, a field worker fixes it, and the citizen is told. **One database, three portals (citizen, staff, admin): a change in one shows up in all of them.**

This is a **prototype**, rebuilt from a demo site with full feature parity and a cleaner UX. **It is built and deployed** (Render + Supabase). Not enterprise software; keep it simple. See [docs/status.md](docs/status.md) for exactly what exists and what is next.

## Stack
| Layer | Choice |
|---|---|
| Web | React, Vite, TypeScript, Tailwind, TanStack Query, Leaflet/OSM |
| API | Node 22, Express, TypeScript, Zod |
| DB / Auth / Files | Supabase (Postgres, Auth, Storage) |
| Hosting | Render (static site + web service), UptimeRobot pings `/health` |
| CI | GitHub Actions (lint, typecheck, test, build, scope check) |

## Repo map
```
apps/web          React app           (Jerome)
apps/api          Express API + SQL   (Bipin)
packages/contract API contract + types (Ramansh)
docs/             Read these first
.agents/          Rules for AI coding agents
scripts/          Scope enforcement
```

## Quick start
```bash
npm install
cp .env.example .env      # get real values from Ramansh
npm run dev:api           # http://localhost:4000/health
npm run dev:web           # http://localhost:5173
```

## Read next
1. [docs/day-one.md](docs/day-one.md): your first day, step by step
2. **Your task list:** [Jerome](docs/handoff-jerome.md) or [Bipin](docs/handoff-bipin.md)
3. [docs/status.md](docs/status.md): what is built, what is verified, known limitations
4. [docs/overview.md](docs/overview.md) and [docs/scope.md](docs/scope.md): what we build and what we do not
5. [docs/workflow-and-roles.md](docs/workflow-and-roles.md): who owns what (hard boundaries)
6. [docs/architecture.md](docs/architecture.md) and [docs/adr/](docs/adr/README.md): how it fits together and **why** each decision was made
7. [CONTRIBUTING.md](CONTRIBUTING.md): branches, PRs, review
8. [AGENTS.md](AGENTS.md): if you use an AI coding agent

## Team
| Person | Role | Owns |
|---|---|---|
| Ramansh | System architect, reviewer, CI/CD | Everything not listed below, plus final say on all PRs |
| Jerome | Frontend only | `apps/web/**` ([tasks](docs/handoff-jerome.md)) |
| Bipin | Backend only | `apps/api/**` except two core files ([tasks](docs/handoff-bipin.md)) |

Nothing is merged or deployed without Ramansh's review.
