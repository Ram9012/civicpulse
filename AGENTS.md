# AGENTS.md: read this first, every session

You are an AI coding agent working in the **CivicPulse** repo for one human contributor. Your job is to do the task they give you **inside their scope, and nothing else**.

## Step 1: Identify who you are working for
Check, in order: the `CONTRIB_ROLE` environment variable, then what the user told you. Exactly one of:

| Human | Role value | Read next |
|---|---|---|
| Jerome (frontend only) | `jerome` | `.agents/jerome-frontend.md` |
| Bipin (backend only) | `bipin` | `.agents/bipin-backend.md` |
| The Architect (reviewer, CI/CD, some backend) | `architect` | `.agents/architect.md` |

If the role is unknown or the two sources disagree, **stop and ask**. Do not guess. Do not edit anything until it is clear.

## Step 2: Understand the project (5 minutes, no more)
- `docs/overview.md`: what the product does
- `docs/scope.md`: what is in and **out** of scope
- `docs/workflow-and-roles.md`: ownership table
- `packages/contract/openapi.yaml`: the API contract

CivicPulse is a **prototype**: React + Vite web, Express API, Supabase, deployed on Render. Keep everything simple. Do not introduce enterprise patterns.

## Universal hard rules (all roles)
1. **Only edit files inside your role's allowed paths** (see your role file and `.github/scope-map.json`). The local hook `scripts/scope-guard.js` will block violations. Do not try to route around it (shell redirects, `sed -i`, `git apply`, copying files, renaming, symlinks). A block means stop and tell the human.
2. **Never push to `main` or `dev`, and never merge into them.** Branch from `dev` (`feat/<name>-<topic>`), commit when your human asks, push that branch, and open a PR **targeting `dev`** (never `main`). The Architect merges to `dev` and promotes `dev` to `main`. A hook (`scripts/git-guard.js`) blocks direct pushes to both for everyone except the Architect.
3. **Never create, read aloud, print, or commit secrets** (`.env`, keys, tokens, passwords). Only edit `.env.example` if you are the Architect. Never put the Supabase service-role key anywhere in `apps/web`.
4. **No new dependencies, services, tools, or config** without the Architect's approval. Ask first; do not run `npm install <new package>`.
5. **Stay on the task.** No drive-by refactors, renames, reformatting, or "improvements" to code you were not asked to touch. No speculative features.
6. **Never build anything listed out of scope** in `docs/scope.md`.
7. **The contract is read-only** for Jerome and Bipin. If you need a new field or endpoint, do not invent it: tell the human to open an issue labelled `contract`.
8. **Do not edit docs or agent rules** (`docs/**`, `.agents/**`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`). Suggest changes to the human instead.
9. **Do not touch CI/CD, deployment or scope config** (`.github/**`, `render.yaml`, `scripts/**`, `.claude/**`) unless you are the Architect.
10. **No fake data in the product UI/API** (fake counters, placeholder testimonials, hardcoded credentials). Mocks live only in `apps/web/src/mocks/` and tests.
11. **When unsure, ask.** A short question is cheaper than a rejected PR.

## Before saying "done"
Run from the repo root: `npm run lint && npm run typecheck && npm run test && npm run build`. Report real output; if something fails, say so. Then list the files you changed and confirm each is inside your allowed paths.

## If asked to do something outside your scope
Refuse politely and say: which rule it breaks, who owns it (see table), and what the human should do (open an issue / ask the Architect). Do not do "just a small part" of it.
