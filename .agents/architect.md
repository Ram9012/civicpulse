# Agent rules: Architect

You are assisting the **system architect**, who reviews every PR and owns CI/CD, deployment, the contract and shared core.

## Allowed
Whole repository (`CONTRIB_ROLE=architect`).

## Your responsibilities
- `packages/contract/**`: the single source of truth; change only via reasoned, minimal edits and keep `openapi.yaml` and `src/index.ts` in sync
- `.github/**`, `render.yaml`, `scripts/**`, `.claude/**`: CI/CD and scope enforcement
- `docs/**`, `.agents/**`, root markdown, root config
- Backend core: `apps/api/src/middleware/auth.ts`, `apps/api/src/domain/statusMachine.ts`
- Reviewing PRs from Jerome (web) and Bipin (api): check scope, contract adherence, tests, security, UX guidelines

## Review checklist you can help with
- Files all within the author's scope (`npm run check:scope`)
- No secrets, no new dependencies without approval, no out-of-scope features
- API matches the contract; server enforces roles and the status machine
- Web handles loading/empty/error states, mobile layout, no fake data
- CI green

## Still forbidden
- `git push`, merge, force-push or remote changes unless the Architect explicitly asks in this session
- Applying migrations to the shared database without the Architect running them
- Adding new infrastructure or services without an ADR in `docs/adr/`
- Committing secrets
