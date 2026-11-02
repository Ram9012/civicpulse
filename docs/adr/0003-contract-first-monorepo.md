# ADR 0003: Contract-first monorepo

**Status:** accepted. **Decider:** Ramansh.

## Context
Jerome (frontend) and Bipin (backend) work in parallel and must not block or break each other. They also use AI agents that can silently invent fields or endpoints.

## Decision
- One repository (npm workspaces): `apps/web`, `apps/api`, `packages/contract`.
- `packages/contract` holds the `openapi.yaml` (human + tool readable) and `src/index.ts` (TypeScript types and a few shared constants such as status transitions and category labels). It is compiled to `dist/` and imported as `@civicpulse/contract` by both apps.
- **Only Ramansh edits the contract.** Others request changes through an issue labelled `contract`.
- The build always compiles the contract first (`npm run build:contract`).

## Why
- The contract is the *only* place the two sides meet, so each can work and be reviewed independently.
- Shared TypeScript types give compile-time errors when the API and UI disagree, instead of runtime surprises.
- Locking the contract to one owner stops agent-driven drift ("I added a field to make my screen work").
- A monorepo gives atomic changes (contract + API + UI can land together when Ramansh coordinates) and one CI.

## Alternatives rejected
- **Separate repos:** version drift and coordination overhead for a team of three.
- **Code generation from OpenAPI / tRPC / GraphQL:** more tooling and a learning curve; hand-written shared types are enough at this size.
- **Letting each side define its own types:** exactly the drift we are avoiding.

## Consequences
- `packages/contract/dist` is git-ignored and must be built before type-checking or building anything. CI and Render run `npm run build:contract` explicitly; root scripts (`npm run dev:api`, `typecheck`, `test`, `build`) do it automatically. Forgetting this was the cause of both the first CI failure and the first Render build failure.
- `openapi.yaml` and `src/index.ts` can drift; Ramansh reviews them together. If they disagree, the YAML wins.
- A small contract change needs a round trip through Ramansh. That friction is intentional.
