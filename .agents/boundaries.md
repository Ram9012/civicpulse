# Boundaries at a glance

| Path | ramansh | jerome | bipin |
|---|:-:|:-:|:-:|
| `apps/web/**` | write | **write** | read |
| `apps/api/**` | write | read | **write** |
| `apps/api/src/middleware/auth.ts`, `domain/statusMachine.ts` | **write** | read | read |
| `packages/contract/**` | **write** | read | read |
| `.github/**`, `render.yaml`, `scripts/**`, `.claude/**` | **write** | read | read |
| `docs/**`, `.agents/**`, root `*.md`, root config | **write** | read | read |

Enforcement layers:
1. **Instructions (primary)**: contributors tell their agent their name; `AGENTS.md` and the role file in this folder make the agent work only inside that scope.
2. **CI**: `scope-check.yml` fails PRs that touch files outside the author's allowlist (read from the base branch, so a PR cannot widen its own permissions).
3. **Review**: CODEOWNERS requires Ramansh on every PR; only Ramansh merges.
4. **Optional local hooks (Ramansh's Claude Code only)**: `.claude/settings.json` runs `scripts/scope-guard.js` and `scripts/git-guard.js`, which read the `CONTRIB_ROLE` environment variable. Contributors use Antigravity and do not use these.

Known gap: instructions are not a technical lock. An agent that ignores them is caught by the CI scope check and by review. Branch protection on `main` and `dev` (set up by Ramansh) is what stops direct pushes.

To change a boundary: only Ramansh edits `.github/scope-map.json`.
