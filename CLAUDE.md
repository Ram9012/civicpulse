# CLAUDE.md

Follow [AGENTS.md](AGENTS.md). It is mandatory and applies to every session.

Start by finding out who you are working for (Ramansh, Jerome or Bipin), read your role file in `.agents/`, and stay inside that scope. If you do not know who you are working for, ask.

Note for Ramansh's Claude Code sessions only: `.claude/settings.json` registers two optional guard hooks (`scripts/scope-guard.js`, `scripts/git-guard.js`) that read `CONTRIB_ROLE`. They are a local convenience; contributors do not need them.
