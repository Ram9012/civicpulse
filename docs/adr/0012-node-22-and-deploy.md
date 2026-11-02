# ADR 0012: Node 22 and deploy mechanics

**Status:** accepted. **Decider:** Ramansh.

## Context
The first deploy and first real use hit seven failures. They are recorded here so nobody pays for them twice.

## Decisions and the incidents behind them
1. **Build the contract before anything that imports it.** `packages/contract/dist` is not committed. Render's build and CI ran `tsc` on the API first, so `@civicpulse/contract` could not be found. Fix: every build command and CI job runs `npm run build:contract` first (`render.yaml`, `.github/workflows/ci.yml`; root scripts do it automatically).
2. **Load the root `.env` explicitly in the API.** `npm run dev:api` runs with the working directory `apps/api`, so `dotenv/config` looked in the wrong place, every Supabase variable was empty, and `/health` reported "db down". `apps/api/src/config.ts` now resolves `../../../.env`. On Render real env vars are used and the file does not exist, which dotenv ignores.
3. **Use Node 22 everywhere** (`render.yaml` `NODE_VERSION`, CI, `engines`). `supabase-js` needs a native `WebSocket`, which Node 20 lacks (`native WebSocket not found`). Node 22 has it.
4. **`/health` logs the real failure reason** and returns 503, so an uptime monitor sees problems and a developer can debug them from logs.

5. **Sign-up trigger must pin its schema.** Supabase Auth runs `handle_new_user()` with a search path that excludes `public`, so the unqualified `profiles` insert failed and sign-up returned "Database error saving new user". Migration `0004_fix_signup_trigger.sql` sets `search_path = public`, schema-qualifies `public.profiles`, recreates the trigger, and backfills missing profiles. Every `security definer` function we write must set `search_path`.
6. **An empty `VITE_API_URL` makes the web app call itself.** The blueprint creates `VITE_API_URL` (a `sync: false` secret) empty. A relative URL then hits the static site, which answers every path with `index.html`, producing `Unexpected token '<'`. `apps/web/src/lib/api.ts` now normalises the value (adds `https://`, strips a trailing slash), refuses to run in production with no API address, and rejects non-JSON responses with a clear message. The variable must still be set to the API's full URL and the web service rebuilt.
7. **PostgREST embeds must name the relationship.** `reporter:profiles(name)` is ambiguous because `reports` reaches `profiles` directly (`reporter_id`) and through link tables (`upvotes`, `notifications`). PostgREST returned an error, our helper swallowed it and returned `null`, and `POST /reports` crashed with `Cannot read properties of null (reading 'id')`. All embeds now use a hint (`profiles!reporter_id`, `profiles!actor_id`), and helpers throw on a failed query instead of returning null or an empty list.

## Other deploy facts
- Render deploys from `main` only. `dev` is never deployed.
- `VITE_*` variables are baked into the web build; changing one requires a rebuild (Manual Deploy > Clear build cache).
- Migrations are applied by hand in Supabase **before** merging code that needs them; they are forward-only.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`) are set only in the Render dashboard and local `.env`.

## Consequences
- Anyone adding a new workspace package that apps import must follow the same "build before use" rule.
- Upgrading Node later is a one-line change in three places; keep them in sync.
- Rule for backend code: never ignore the `error` from a Supabase call, and always name the relationship in an embed that could be ambiguous.
- Rule for deploys: after any `VITE_*` change, rebuild the web service with the build cache cleared.
