# AGENTS.md: read this first, every session

You are an AI coding agent working in the **CivicPulse** repo for one human contributor. Your job is to do the task they give you **inside their scope, and nothing else**.

## Step 1: Find out who you are working for
Your human tells you their name at the start of the session (for example "I'm Jerome"). **If they have not, ask: "Who are you: Ramansh, Jerome or Bipin?" and wait.** Do not guess and do not edit anything before you know.

| Name | Role | Your scope | Read next |
|---|---|---|---|
| **Jerome** | Frontend only | `apps/web/**` only | `.agents/jerome-frontend.md` |
| **Bipin** | Backend only | `apps/api/**` only (minus the files Ramansh owns) | `.agents/bipin-backend.md` |
| **Ramansh** | System architect, reviewer, CI/CD, some backend | Whole repo | `.agents/ramansh-architect.md` |

Once you know the name, read that role file and **look only at files in that scope**. Treat everything outside it as read-only reference: do not edit it, do not "fix" it, do not work around it. If the task needs something outside the scope, stop and tell your human who owns it (see the table above and `docs/workflow-and-roles.md`).

## Step 2: Understand the project (5 minutes, no more)
- `docs/overview.md`: what the product does
- `docs/scope.md`: what is in and **out** of scope
- `docs/workflow-and-roles.md`: ownership table
- `packages/contract/openapi.yaml`: the API contract

CivicPulse is a **prototype**: React + Vite web, Express API, Supabase, deployed on Render. Keep everything simple. Do not introduce enterprise patterns.

## Universal hard rules (all roles)
1. **Only edit files inside your role's allowed paths** (see your role file and `.github/scope-map.json`). CI also rejects PRs that touch files outside the author's scope. Do not try to route around the boundary (shell redirects, `sed -i`, `git apply`, copying files, renaming, symlinks). If something blocks you, stop and tell the human.
2. **Never push to `main` or `dev`, and never merge into them.** Branch from `dev` (`feat/<name>-<topic>`), commit when your human asks, push that branch, and open a PR **targeting `dev`** (never `main`). Ramansh merges to `dev` and promotes `dev` to `main`.
3. **Never create, read aloud, print, or commit secrets** (`.env`, keys, tokens, passwords). Only edit `.env.example` if you are Ramansh. Never put the Supabase service-role key anywhere in `apps/web`.
4. **No new dependencies, services, tools, or config** without Ramansh's approval. Ask first; do not run `npm install <new package>`.
5. **Stay on the task.** No drive-by refactors, renames, reformatting, or "improvements" to code you were not asked to touch. No speculative features.
6. **Never build anything listed out of scope** in `docs/scope.md`.
7. **The contract is read-only** for Jerome and Bipin. If you need a new field or endpoint, do not invent it: tell the human to open an issue labelled `contract`.
8. **Do not edit docs or agent rules** (`docs/**`, `.agents/**`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`). Suggest changes to the human instead.
9. **Do not touch CI/CD, deployment or scope config** (`.github/**`, `render.yaml`, `scripts/**`, `.claude/**`) unless you are Ramansh.
10. **No fake data in the product UI/API** (fake counters, placeholder testimonials, hardcoded credentials). Mocks live only in `apps/web/src/mocks/` and tests.
11. **When unsure, ask.** A short question is cheaper than a rejected PR.

## Before saying "done"
Run from the repo root: `npm run lint && npm run typecheck && npm run test && npm run build`. Report real output; if something fails, say so. Then list the files you changed and confirm each is inside your allowed paths.

## If asked to do something outside your scope
Refuse politely and say: which rule it breaks, who owns it (see table), and what the human should do (open an issue / ask Ramansh). Do not do "just a small part" of it.
