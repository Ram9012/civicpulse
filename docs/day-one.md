# Day one

Goal for today: the app runs on your machine and you have opened one tiny PR.

## 1. Tools (15 min)
- Node.js 20 or newer (`node -v`), npm, git
- A GitHub account (give your username to the Architect so you are added to `.github/scope-map.json`)
- An editor. If you use an AI agent, read [AGENTS.md](../AGENTS.md) first

## 2. Get the code
```bash
git clone <repo-url>
cd civicCrowdSrc
npm install
```

## 3. Environment
```bash
cp .env.example .env
```
Ask the Architect for the Supabase values (URL, anon key, service-role key). **Never commit `.env`, never paste keys in chat, issues or PRs.** Only Bipin needs the service-role key. Jerome only needs `VITE_*` values.

## 4. Run it
```bash
npm run dev:api     # Bipin: http://localhost:4000/health
npm run dev:web     # Jerome: http://localhost:5173
```

## 5. Read, in this order (30 min)
1. [overview.md](overview.md): what the product does
2. [workflow-and-roles.md](workflow-and-roles.md): what you may and may not touch
3. [architecture.md](architecture.md): auth, upload and update flows
4. `packages/contract/openapi.yaml`: the API you build or consume
5. [ux-guidelines.md](ux-guidelines.md) (Jerome) or `apps/api/README.md` (Bipin)

## 6. Your first task
**Jerome**: In `apps/web`, replace the Home placeholder with a real landing section: one headline, one "Report an issue" button, a link to Explore. Mobile first. No fake stats. PR title `feat(web): home page`.

**Bipin**: In `apps/api`, implement `GET /reports` (list, filters `category`, `status`, `q`, `page`) against Supabase, with Zod-validated query params and a vitest test. Public response must not include reporter identity. PR title `feat(api): list reports`.

## 7. Open your first PR
```bash
git checkout dev && git pull
git checkout -b feat/<yourname>-<topic>
# work, then
npm run lint && npm run typecheck && npm run test && npm run build
git add <only your files>
git commit -m "feat(web): home page"
git push -u origin feat/<yourname>-<topic>
```
Open a PR **into `dev`** (never `main`) using the template. CI must be green. The Architect reviews; do not merge it yourself.

## 8. Using an AI agent
Set your role before starting it, so the scope guard knows who you are:
```bash
# macOS / Linux / Git Bash
export CONTRIB_ROLE=jerome     # or bipin
# PowerShell
$env:CONTRIB_ROLE = "jerome"
```
Easier: create the file `.claude/settings.local.json` (it is git-ignored, so it stays on your machine) with:
```json
{ "env": { "CONTRIB_ROLE": "jerome" } }
```
(use `"bipin"` if you are Bipin). Claude Code then picks it up every session.

The agent will refuse to edit files outside your area. That is intentional.

Optional: a code-graph tool (e.g. graphify) can help an agent navigate the repo. Ask the Architect before adding any tool or dependency.

## Who to ask
Anything about scope, contract, env values, deployment: the Architect.
