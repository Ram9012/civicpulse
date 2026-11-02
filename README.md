# CivicPulse

A civic issue reporting platform. Citizens photograph a problem (pothole, broken streetlight, garbage), the report is verified and routed to the right municipal department, a field worker fixes it, and the citizen is told. **One database, three portals (citizen, staff, admin): a change in one shows up in all of them.**

This is a **prototype**, rebuilt from a demo site with a cleaner UX. Deployed on Render + Supabase. Not enterprise software; keep it simple.

## Stack
| Layer | Choice |
|---|---|
| Web | React, Vite, TypeScript, Tailwind, TanStack Query, Leaflet/OSM |
| API | Node, Express, TypeScript, Zod |
| DB / Auth / Files | Supabase (Postgres, Auth, Storage) |
| Hosting | Render (static site + web service), UptimeRobot pings `/health` |
| CI | GitHub Actions (lint, typecheck, test, build, scope check) |

## Repo map
```
apps/web          React app           (Jerome)
apps/api          Express API + SQL   (Bipin)
packages/contract API contract + types (Architect)
docs/             Read these first
.agents/          Rules for AI coding agents
scripts/          Scope enforcement
```

## Quick start
```bash
npm install
cp .env.example .env      # get real values from the Architect
npm run dev:api           # http://localhost:4000/health
npm run dev:web           # http://localhost:5173
```

## Read next
1. [docs/day-one.md](docs/day-one.md): your first day, step by step
2. [docs/overview.md](docs/overview.md) and [docs/scope.md](docs/scope.md): what we build and what we do not
3. [docs/workflow-and-roles.md](docs/workflow-and-roles.md): who owns what (hard boundaries)
4. [docs/architecture.md](docs/architecture.md): how it fits together
5. [CONTRIBUTING.md](CONTRIBUTING.md): branches, PRs, review
6. [AGENTS.md](AGENTS.md): if you use an AI coding agent

## Team
| Person | Role | Owns |
|---|---|---|
| Architect | System architect, reviewer, CI/CD | Everything not listed below, plus final say on all PRs |
| Jerome | Frontend only | `apps/web/**` |
| Bipin | Backend only | `apps/api/**` |

Nothing is merged or deployed without the Architect's review.
