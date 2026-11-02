# ADR 0005: Supabase Auth, three fixed roles in `profiles`

**Status:** accepted. **Decider:** Ramansh.

## Context
The reference site had one shared login form with a publicly displayed admin password (`admin` / `admin123`) and a "quick fill" button, and Delete buttons on public pages. That is unacceptable for anything real.

## Decision
- Accounts and passwords are handled by **Supabase Auth** (email + password). We store no passwords.
- Roles live in `profiles.role`: `citizen` (default), `staff` (has a `department_id`), `admin`. Exactly three; no role editor.
- A database trigger creates a `citizen` profile on sign-up.
- The API verifies the bearer token (`supabase.auth.getUser`), loads the profile, and attaches it to `req.user`. Authorization is always based on that, never on anything the client sends.
- **Admins are promoted in the database** (first admin via SQL), then admins promote others in the Admin portal. There are no default credentials anywhere.
- Deleting a report is allowed only for its reporter or an admin, and is written to `audit_logs`.

## Why
- Do not build or store credentials ourselves; Supabase Auth is battle-tested and free.
- Fixed roles keep the permission model small enough to hold in your head and to test.
- Server-side role checks mean a modified browser gains nothing.

## Alternatives rejected
- **Role in the JWT / custom claims:** harder to change instantly and needs Supabase-side configuration; reading `profiles` per request is simple and always current.
- **Roles as a separate table with permissions:** over-engineered for three roles.
- **Copying the original shared-login model:** insecure by design.

## Consequences
- Every authenticated request costs two Supabase calls (verify token, load profile). Acceptable now; cache briefly if it becomes a bottleneck.
- If a user's role changes, it applies on their next request, but the web app caches `/me` for the session. They should sign out and in (documented in the runbook).
- Email confirmation is a Supabase setting. Site URL / redirect URLs must point at the web service, or confirmation emails go to the wrong place.
