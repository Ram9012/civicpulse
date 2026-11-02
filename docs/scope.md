# Scope

## In scope (the prototype)
**Citizen**
- Sign up / sign in (email + password via Supabase Auth)
- Report wizard: add photo or video, pin location on map (auto-detect, adjustable), category + description, anonymous toggle
- Duplicate nudge: show nearby similar reports; "Confirm" (upvote) instead of filing a new one
- "My reports" with status timeline; in-app notifications; reopen a resolved report
- Public Explore: list + map, filter by category/status, search by area

**Staff**
- Department queue with filters
- Verify, mark duplicate, assign worker, start work, resolve with proof photo
- Report detail with timeline

**Admin**
- Everything staff can do, across departments
- Manage departments, workers, category-to-department routing, user roles
- Analytics: counts by status/category/department, average resolution time
- Read-only audit log

**Platform**
- Deployed on Render + Supabase, UptimeRobot keep-alive, CI on every PR

## Stretch (only after M4, only if Ramansh says so)
- Kannada / Hindi UI
- Offline report drafts with later sync
- AI suggestion (Groq) for category/priority; advisory only, behind `AI_ENABLED`
- PulseBot chat assistant
- Email / SMS notifications

## Out of scope (do not build, do not propose)
- Geofences, heatmaps, department zones, ward boundary editing
- Native mobile apps
- Payments, multi-city / multi-tenant support
- Realtime websockets (we poll)
- Microservices, queues, caches, Kubernetes, anything "enterprise"
- Role/permission editors beyond the three fixed roles
- Public display of the demo "impact counters" with fake numbers

## Rules for the UI that follow from this
- Do not copy the old site's clutter. One primary action per screen.
- Never show fake or placeholder statistics.
- Never display admin credentials or secrets anywhere in the UI.
