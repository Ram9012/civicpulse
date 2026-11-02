# apps/web (owner: Jerome)

React + Vite + TypeScript + Tailwind. One app, three role-gated portals (citizen, staff, admin).

```bash
npm install            # from repo root
cp .env.example .env   # from repo root
npm run dev:web        # http://localhost:5173
```

- Server calls go through `src/lib/api.ts`. Types come from `@civicpulse/contract` (read-only for you).
- While the API is unfinished, develop against mock data in `src/mocks/` (create it; keep `VITE_USE_MOCKS=true`).
- Server state: TanStack Query (already polling every 10s). No Redux or extra state libs.
- Suggested layout: `src/features/{report,explore,staff,admin,auth}/`, shared UI in `src/components/`.
- Follow `docs/ux-guidelines.md`. Mobile first, max 4 nav items per role.
- Adding a dependency needs Ramansh approval first.
