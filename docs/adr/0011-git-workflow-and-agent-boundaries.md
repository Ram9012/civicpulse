# ADR 0011: `dev`/`main` workflow and agent boundaries

**Status:** accepted. **Decider:** Ramansh.

## Context
Three people, two of whom (Jerome, Bipin) develop with AI agents (Antigravity). Ramansh must review everything, and the product must not be deployed accidentally. Agents are fast and will cheerfully edit files outside the task unless told otherwise.

## Decision
**Branches**
- `main`: deployed by Render. Only Ramansh merges here, by promoting `dev` through a PR.
- `dev`: integration. Contributors open PRs **into `dev`**, never `main`.
- `feat/*`, `fix/*`, `chore/*`: short-lived, branched from `dev`.

**Ownership** (single source: `.github/scope-map.json`)
- Jerome: `apps/web/**`. Bipin: `apps/api/**` except `middleware/auth.ts` and `domain/statusMachine.ts` (Ramansh core). Ramansh: everything, including contract, CI, infra, docs.

**Enforcement, from strongest to weakest**
1. **CI scope check** (`scope-check.yml`) fails a PR that touches files outside its author's allowlist. It reads the rules from the *base* branch, so a PR cannot widen its own permissions.
2. **Review**: `CODEOWNERS` requires Ramansh on every change; PRs use a template with a scope checklist.
3. **Agent instructions**: `AGENTS.md` plus `.agents/<role>.md`. The contributor tells the agent their name; the agent reads only that scope. No shell setup, because Antigravity does not use Claude Code hooks.
4. **Optional local hooks** (Ramansh's Claude Code only): `scripts/scope-guard.js` and `scripts/git-guard.js` read `CONTRIB_ROLE`.

## Why
- A human-readable rule ("tell the agent your name") is what contributors will actually follow; CI catches the cases where it fails.
- Reading scope from the base branch closes the obvious loophole of editing the rules inside the PR.
- Separating `dev` from `main` means a bad merge never reaches users.

## Alternatives rejected
- **Trunk-based development with feature flags:** needs more discipline than a three-person student team.
- **Hard technical blocks only (hooks):** tied to one tool; contributors use another.
- **Separate repos per role:** loses atomic changes and the shared contract.

## Consequences
- Instructions are not a technical lock. Until branch protection is enabled on `main` and `dev`, nothing stops someone pushing directly from their own terminal. Enabling it is a GitHub setting Ramansh owns.
- Edits to the rules themselves (`scope-map.json`) are Ramansh-only.
- The Jerome/Bipin GitHub usernames in `scope-map.json` and `CODEOWNERS` must be real, or the scope check rejects their PRs.
