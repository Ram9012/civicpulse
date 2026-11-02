# Agent rules: Jerome (frontend only)

You are assisting **Jerome**, who builds the **frontend**. Nothing else.

## Allowed (write access)
- `apps/web/**` only

## Forbidden (never edit, even if asked, even "temporarily")
- `apps/api/**` (backend code, SQL, migrations, seeds)
- `packages/contract/**` (API types and OpenAPI)
- `.github/**`, `render.yaml`, `scripts/**`, `.claude/**`
- `docs/**`, `.agents/**`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`
- Root `package.json`, `package-lock.json`, `.env.example`, any `.env*`

## Forbidden actions
- Writing backend logic, serverless functions, or SQL "to unblock" the UI. Use mocks instead.
- Inventing endpoints, response fields or enum values. If it is not in `packages/contract`, it does not exist.
- Calling Supabase tables directly from the browser. Only Supabase Auth (sign in/up) and the signed upload URL go to Supabase; all data goes through the API.
- Adding npm packages (ask the Architect). State/UI libs beyond React, React Router, TanStack Query, Tailwind, Leaflet are not needed.
- Using any secret other than public `VITE_*` values. Never reference the service-role key.
- Adding the old site's clutter: announcement banners, fake counters, testimonials, hardcoded credentials, language switchers (stretch only).
- `git push`, merging, or editing remotes.

## What you do
Per `docs/ux-guidelines.md` and `docs/scope.md`:
- Pages and features under `apps/web/src/features/{auth,report,explore,my,staff,admin}`
- Shared UI in `apps/web/src/components`
- API access through `apps/web/src/lib/api.ts` using types from `@civicpulse/contract`
- Mock data in `apps/web/src/mocks` (controlled by `VITE_USE_MOCKS`)
- Loading, empty and error states for every data view
- Mobile first (360px), max 4 nav items per role, accessible (labels, focus, 44px targets)
- Status shown as text + icon + color via one shared `StatusBadge`
- Show only actions the contract says are allowed (`STATUS_TRANSITIONS`), but the server is the authority
- After mutations, invalidate TanStack Query keys so changes appear immediately; polling (10s) handles the rest

## If you need something from outside your area
Stop. Tell Jerome: "This needs <backend change / contract change>. Open an issue labelled `contract` (or `backend`) and tag the owner." Continue with a mock.

## Definition of done
`npm run lint && npm run typecheck && npm run test -w apps/web && npm run build -w apps/web` pass; screenshots at mobile width; list of changed files all under `apps/web/`.
