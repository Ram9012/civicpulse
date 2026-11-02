# CLAUDE.md

Follow [AGENTS.md](AGENTS.md). It is mandatory and applies to every session.

Before doing anything: determine your role (`CONTRIB_ROLE` env var or the user's statement), then read your role file in `.agents/`. If the role is unknown, ask. A PreToolUse hook (`scripts/scope-guard.js`) blocks edits outside your role's paths; a block is final, not an obstacle to work around.
