# apps/api (owner: Bipin)

Express + TypeScript + Zod, talking to Supabase with the service-role key.

```bash
npm install            # from repo root
cp .env.example .env   # from repo root; ask Ramansh for values
npm run dev:api        # http://localhost:4000/health
npm run test -w apps/api
```

- Routes live in `src/routes/` (`reports`, `media`, `notifications`, `staff`, `admin`, `misc` for public/AI/saved areas). Follow `packages/contract/openapi.yaml`; business logic lives in `src/services/`.
- Optional AI: `src/services/ai.ts` uses Groq only when `AI_ENABLED=true` and `GROQ_API_KEY` is set; otherwise keyword rules.
- `src/domain/statusMachine.ts` is Ramansh's core rule set. Use `canTransition()`; do not edit it.
- Every status change must insert a `report_events` row and notify the reporter (`notifications`).
- Validate every request body with Zod. Never trust the client for role, department or reporter id.
- Schema changes: add a new numbered file in `db/migrations/`. Never edit an applied migration.
