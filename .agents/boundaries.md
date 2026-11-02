# Boundaries at a glance

| Path | architect | jerome | bipin |
|---|:-:|:-:|:-:|
| `apps/web/**` | write | **write** | read |
| `apps/api/**` | write | read | **write** |
| `apps/api/src/middleware/auth.ts`, `domain/statusMachine.ts` | **write** | read | read |
| `packages/contract/**` | **write** | read | read |
| `.github/**`, `render.yaml`, `scripts/**`, `.claude/**` | **write** | read | read |
| `docs/**`, `.agents/**`, root `*.md`, root config | **write** | read | read |

Enforcement layers (defence in depth):
1. **Instructions**: `AGENTS.md` and the role files in this folder.
2. **Local hook**: `.claude/settings.json` runs `scripts/scope-guard.js` before every file edit, reading `CONTRIB_ROLE`. Blocks with exit code 2.
3. **CI**: `scope-check.yml` fails PRs that touch files outside the author's allowlist (read from the base branch, so a PR cannot widen its own permissions).
4. **Review**: CODEOWNERS requires the Architect on every PR; only the Architect merges.

Known gap: the local hook sees the file-edit tools, not arbitrary shell commands. Agents are instructed not to edit files through the shell; CI is the backstop.

To change a boundary: only the Architect edits `.github/scope-map.json`.
