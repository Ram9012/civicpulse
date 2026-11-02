# ADR 0012: Node 22 and deploy mechanics

**Status:** accepted. **Decider:** Ramansh.

## Context
The first deploy hit three failures that all trace back to build assumptions. Recording them stops a repeat.

## Decisions and the incidents behind them
1. **Build the contract before anything that imports it.** `packages/contract/dist` is not committed. Render's build and CI ran `tsc` on the API first, so `@civicpulse/contract` could not be found. Fix: every build command and CI job runs `npm run build:contract` first (`render.yaml`, `.github/workflows/ci.yml`; root scripts do it automatically).
2. **Load the root `.env` explicitly in the API.** `npm run dev:api` runs with the working directory `apps/api`, so `dotenv/config` looked in the wrong place, every Supabase variable was empty, and `/health` reported "db down". `apps/api/src/config.ts` now resolves `../../../.env`. On Render real env vars are used and the file does not exist, which dotenv ignores.
3. **Use Node 22 everywhere** (`render.yaml` `NODE_VERSION`, CI, `engines`). `supabase-js` needs a native `WebSocket`, which Node 20 lacks (`native WebSocket not found`). Node 22 has it.
4. **`/health` logs the real failure reason** and returns 503, so an uptime monitor sees problems and a developer can debug them from logs.

## Other deploy facts
- Render deploys from `main` only. `dev` is never deployed.
- `VITE_*` variables are baked into the web build; changing one requires a rebuild (Manual Deploy > Clear build cache).
- Migrations are applied by hand in Supabase **before** merging code that needs them; they are forward-only.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`) are set only in the Render dashboard and local `.env`.

## Consequences
- Anyone adding a new workspace package that apps import must follow the same "build before use" rule.
- Upgrading Node later is a one-line change in three places; keep them in sync.
