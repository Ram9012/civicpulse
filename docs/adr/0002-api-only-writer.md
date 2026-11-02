# ADR 0002: The API is the only writer

**Status:** accepted. **Decider:** Ramansh.

## Context
Supabase lets browsers query the database directly, protected by Row Level Security (RLS) policies. We have rules that are not just "can this user see this row": role checks, department scoping, a status state machine, media attachment rules, notifications on every change.

## Decision
- The browser uses Supabase **only** for Auth (sign up / sign in) and for uploading a file to a **signed URL** the API issued.
- Every read and write of report data goes through the Express API, which uses the Supabase **service-role** key.
- RLS is enabled on every table with **no policies**, so a leaked anon key cannot read or write anything.

## Why
- **One place enforces the rules.** Roles, department scoping, "proof photo required to resolve", and "anonymous reporters are never exposed" live in reviewable TypeScript, not scattered across SQL policies.
- **Clear ownership.** Bipin owns every rule; Jerome owns none. A UI button being hidden is cosmetic; the server is the authority.
- **Side effects stay consistent.** A status change must also write a timeline event and a notification. Doing that in one request handler is simpler and safer than database triggers or client orchestration.
- **Testable.** Rules can be unit tested in the API without a browser.

## Alternatives rejected
- **Direct client access with RLS policies:** powerful, but complex policies are hard to review and test, and multi-step side effects would need triggers or edge functions anyway.
- **Hybrid (reads direct, writes via API):** two authorization models to keep in sync; public/anonymous masking would have to be duplicated.

## Consequences
- The API is a single point of failure and a cold-start cost on the free tier (see ADR 0001, 0012).
- The service-role key is highly sensitive: it lives only in Render env vars and a local `.env`, never in the web app or git.
- Every new data need requires an API endpoint (and a contract change, ADR 0003).
