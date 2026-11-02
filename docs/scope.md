# Scope

**Decision (Ramansh):** we are rebuilding the reference site with **full feature parity**, on our own infra (React + Express + Supabase + Render), with our cleaner UX and role-based auth. Features are delivered in milestones; each milestone is one reviewed PR into `dev`.

## Feature roadmap
| Milestone | Features | Status |
|---|---|---|
| **M1 Citizen core** | Sign up/in; 3-step report wizard (photo/video upload, map pin + geolocation, category, description, anonymous); duplicate nudge (`/reports/nearby`) + "confirm" (upvote) with priority bump; Explore list + map with category/status/area filters; report detail with status timeline; My reports; in-app notifications; reopen resolved report | in PR |
| **M2 Staff workflow** | Department queue; verify, mark duplicate, assign field worker, start work, resolve with proof photo; on-site photos; staff map view; timeline + notifications to the citizen | in PR |
| **M3 Admin** | Departments, workers, routing rules, user roles; analytics (volume, resolution time, department workload, hotspots, worker availability); audit log; report deletion (reporter or admin, audited) | in PR |
| **M4 Parity extras** | Kannada / Hindi UI; offline drafts with auto-sync; voice description (speech to text); AI triage (category, priority, summary, keywords; Groq when `AI_ENABLED=true` and a key is set, keyword rules otherwise; staff approve/edit); PulseBot assistant (same Groq/rules split); map clusters / heatmap / satellite layer / GeoJSON export; saved areas; live Impact, How it works and Help pages | in PR |

## Deliberate differences from the reference site
- Real accounts and roles. **No public admin credentials** and no quick-fill login; admin is a normal account promoted in the database.
- **No fake data**: no demo counters, placeholder testimonials, or hardcoded sample reports in the product. Numbers come from the database.
- Delete is available only behind login (reporter or admin) and is audited, never as a public button.
- Cleaner layout: one primary action per screen, max 4 nav items per role (see `ux-guidelines.md`).
- Updates reach other portals by polling every 10 s, not websockets.

## Out of scope (do not build, do not propose)
- Native mobile apps
- Payments, multi-city / multi-tenant support
- Realtime websockets
- Microservices, queues, caches, Kubernetes, anything "enterprise"
- Role / permission editors beyond the three fixed roles (citizen, staff, admin)
