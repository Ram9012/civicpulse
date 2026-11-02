# ADR 0007: AI is advisory, with a deterministic fallback

**Status:** accepted. **Decider:** Ramansh.

## Context
The reference site showed an "AI advisory layer" (category, priority, summary, keywords) and a chat assistant. We want those features, but a prototype must not depend on a paid API key or fail when an external service is down, and civic decisions must stay with people.

## Decision
- `apps/api/src/services/ai.ts` exposes `suggest(text)` and `chat(...)`.
- When `AI_ENABLED=true` **and** `GROQ_API_KEY` is set, they call Groq (JSON mode for triage, model from `GROQ_MODEL`). Output is validated with Zod. On any error or timeout (15 s) we fall back.
- Otherwise they use **keyword rules** (`ruleSuggest`, `ruleChat`) that are deterministic and unit tested. The response says which was used (`source: "groq" | "rules"`).
- AI output is **advisory only**. It is stored in `reports.ai_suggestion`, shown to staff as a suggestion, and never applied automatically. Staff verify and choose priority/department.
- PulseBot only answers about CivicPulse, typical repair times (labelled "typical, not guaranteed"), emergency numbers, and the status of a report ID the user mentions (public fields only, never reporter identity).

## Why
- The feature always works, including in demos, tests, and when the key is missing or rate-limited.
- Keeping a human decision-maker is both a safety choice and a trust choice for a civic system.
- Groq is fast and has a free tier; keeping it behind one module means swapping providers is a single-file change.

## Alternatives rejected
- **Requiring the AI service:** brittle and costs money to run a demo.
- **Auto-applying AI category/priority:** a wrong guess would misroute or de-prioritise a real hazard.
- **Training our own classifier:** no data, no time.

## Consequences
- Rules-based classification is crude (English keywords). Quality depends on turning Groq on.
- User text is sent to Groq when enabled. The privacy statement must say so before it is switched on in production.
- Cost/abuse control: AI endpoints require login (suggest) or are rate-limited in the backlog (item B3).
