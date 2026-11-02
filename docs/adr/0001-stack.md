# ADR 0001: Minimal stack

**Status:** accepted. **Decider:** Architect.

## Decision
Monorepo with React/Vite web, Express API, Supabase (Postgres + Auth + Storage), Render hosting, UptimeRobot keep-alive.

## Why
- Three people, prototype, free tiers. Fewest moving parts wins.
- A separate Express API (instead of the browser talking to Supabase directly) gives Bipin a clear backend domain and keeps all rules (roles, status machine) in one reviewable place.
- Polling instead of websockets: simple, good enough for a demo, no extra infra.
- OpenAPI contract lets Jerome and Bipin work in parallel without blocking.

## Consequences
- Render free tier sleeps; UptimeRobot pinging `/health` mitigates. `/health` also does a trivial DB query, which incidentally counts as Supabase activity.
- No realtime push; up to 10 s delay across portals.
- Adding any new service, library, or infra needs a new ADR.
