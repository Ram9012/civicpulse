# Contributing

Read [docs/workflow-and-roles.md](docs/workflow-and-roles.md) first. You may only change files in your own area.

## Branches
- `main`: deployed to Render. Only Ramansh merges here, by promoting `dev`.
- `dev`: integration branch. **All your PRs target `dev`, never `main`.**
- `feat/*`, `fix/*`, `chore/*`: your work, branched from `dev`.

## Flow
1. Pick (or be assigned) an issue. One issue = one small PR.
2. Branch from the latest `dev` (`git checkout dev && git pull`): `feat/<name>-<topic>`, `fix/<name>-<topic>`, `chore/<name>-<topic>`.
3. Make the change. Keep it small (aim for under ~400 changed lines).
4. Run locally: `npm run lint && npm run typecheck && npm run test && npm run build`.
5. Commit with Conventional Commits: `feat(web): ...`, `fix(api): ...`, `docs: ...`.
6. Push and open a PR **into `dev`** with the template filled in. Frontend PRs include mobile screenshots; backend PRs include request/response examples.
7. CI must be green (lint, typecheck, test, build, scope).
8. Ramansh reviews and merges into `dev`. Address comments with new commits. **Do not merge your own PR.**

## Rules
- Never commit or push to `main` or `dev`. Never force-push shared branches.
- Never commit `.env`, keys, or tokens. If you leaked one, tell Ramansh immediately.
- No new dependencies, services or tools without Ramansh approval.
- No drive-by refactors or formatting changes in unrelated files.
- Do not touch the API contract. Open a `contract` issue.
- Do not build anything listed as out of scope in [docs/scope.md](docs/scope.md).

## Definition of done
- Acceptance criteria in the issue are met
- Handles loading, empty and error states (web) / validates input and checks roles (api)
- Tests added for new logic
- CI green, PR template complete
- Docs updated if behaviour changed (ask Ramansh to update docs; you do not edit `docs/**`)

## Review turnaround
Ramansh aims to review within one working day. If blocked, say so in the PR.
