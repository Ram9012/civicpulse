# ADR 0001: Minimal stack and hosting

**Status:** accepted. **Decider:** Ramansh.

## Context
A prototype that must be deployed and demoed, built by three people (one architect, one frontend, one backend), on free tiers, with a short deadline. It needs auth, relational data, file storage, maps, and three role-based portals.

## Decision
| Layer | Choice |
|---|---|
| Web | React + Vite + TypeScript + Tailwind, TanStack Query, React Router, Leaflet/OpenStreetMap |
| API | Node + Express + TypeScript + Zod |
| Data / auth / files | Supabase (Postgres, Auth, Storage) |
| Hosting | Render (static site for web, web service for API) |
| Keep-alive | UptimeRobot pinging `/health` |
| CI | GitHub Actions |

Monorepo with npm workspaces: `apps/web`, `apps/api`, `packages/contract`.

## Why this stack
- **One language end to end (TypeScript).** Shared types between web and API remove a whole class of integration bugs, and Jerome and Bipin can read each other's code.
- **Supabase replaces four things we would otherwise build or host:** a database, user accounts and password handling, file storage with signed URLs, and an admin SQL console. It is free to start and Postgres is a standard, portable database.
- **Express is deliberately plain.** Everyone knows it, there is nothing to learn, and it keeps the backend domain small enough for one person to own.
- **React + Vite** gives fast local development and a static build that Render serves for free. Tailwind keeps styling local to components so Jerome does not need a design system to be productive.
- **Render** deploys straight from GitHub using one `render.yaml`, which keeps deployment reviewable as code.
- **UptimeRobot** is the cheapest way to stop Render's free tier from sleeping the API (first request after idle otherwise takes ~30 s).

## Alternatives rejected
- **Next.js (one app, server + UI):** blurs the frontend/backend ownership split that the team structure depends on.
- **NestJS / heavier backend frameworks:** more structure than a prototype needs; slows a single backend developer.
- **Firebase:** a document database makes the relational reporting we need (analytics, joins by department) harder, and locks us in more tightly.
- **Vercel for the web:** works, but keeping both services on Render means one dashboard, one blueprint, one set of env vars.
- **Serverless functions instead of an API:** harder to run locally, test, and review as one unit.

## Consequences
- Render's free tier sleeps; UptimeRobot mitigates but does not guarantee zero cold starts.
- Supabase's free tier pauses idle projects. `/health` runs a trivial database query, which also counts as activity.
- Adding any new service, library, or infrastructure needs a new ADR.
