# apps/api (owner: Bipin)

Express + TypeScript + Zod, talking to Supabase with the service-role key.

```bash
npm install            # from repo root
cp .env.example .env   # from repo root; ask Ramansh for values
npm run dev:api        # http://localhost:4000/health
npm run test -w apps/api
```

- Route stubs live in `src/routes/stubs.ts` and return `501`. Replace them following `packages/contract/openapi.yaml`.
- `src/domain/statusMachine.ts` is Ramansh's core rule set. Use `canTransition()`; do not edit it.
- Every status change must insert a `report_events` row and notify the reporter (`notifications`).
- Validate every request body with Zod. Never trust the client for role, department or reporter id.
- Schema changes: add a new numbered file in `db/migrations/`. Never edit an applied migration.
