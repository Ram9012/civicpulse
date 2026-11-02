# Day one

Goal for today: the app runs on your machine and you have opened one tiny PR.

## 1. Tools (15 min)
- Node.js 22 or newer (Supabase needs the built-in WebSocket) (`node -v`), npm, git
- A GitHub account (give your username to Ramansh so you are added to `.github/scope-map.json`)
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
Ask Ramansh for the Supabase values (URL, anon key, service-role key). **Never commit `.env`, never paste keys in chat, issues or PRs.** Only Bipin needs the service-role key. Jerome only needs `VITE_*` values.

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
6. [status.md](status.md) and the ADR index [adr/README.md](adr/README.md): what exists and why

## 6. Your task list
Everything is already built and deployed. Your work is a fixed, prioritised list with acceptance criteria:

- **Jerome:** [handoff-jerome.md](handoff-jerome.md), start with **J1** (mobile and accessibility pass)
- **Bipin:** [handoff-bipin.md](handoff-bipin.md), start with **B1** (privacy regression tests and audit)

Read the code before changing it. Do one task per PR. Do not add features that are not on your list; ask Ramansh.

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
Open a PR **into `dev`** (never `main`) using the template. CI must be green. Ramansh reviews; do not merge it yourself.

## 8. Using an AI agent (Antigravity)
No setup needed. At the start of every session, tell the agent who you are:

> I'm Jerome.   (or: I'm Bipin.)

The agent reads `AGENTS.md` and your role file in `.agents/`, then works **only** inside your scope: Jerome gets `apps/web/**`, Bipin gets `apps/api/**`. If your task needs anything else, it will stop and tell you who to ask. That is intentional.

If the agent does not seem to know the rules, tell it: "Read AGENTS.md first."

Optional: a code-graph tool (e.g. graphify) can help an agent navigate the repo. Ask Ramansh before adding any tool or dependency.

## Who to ask
Anything about scope, contract, env values, deployment: Ramansh.
