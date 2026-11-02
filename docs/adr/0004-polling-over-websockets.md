# ADR 0004: Polling, not websockets

**Status:** accepted. **Decider:** Ramansh.

## Context
A core requirement: when staff verify a report, the citizen (and admin) should see it without reloading. "Realtime" is the obvious word, but it has a cost.

## Decision
TanStack Query refetches lists and detail pages every **10 seconds** (`refetchInterval` in `apps/web/src/main.tsx`). After a user's own mutation we invalidate the affected queries so *they* see the change instantly; everyone else sees it on the next poll. Pages that should not poll (departments, the AI suggestion, saved areas) opt out.

## Why
- **Zero extra infrastructure.** Websockets or Supabase Realtime need connection management, auth on the socket, reconnection logic, and security rules for subscriptions.
- **Fits the free tier.** A sleeping Render service and long-lived sockets do not mix well.
- **Good enough.** Civic reports change on the scale of minutes and hours, not milliseconds. A 10-second delay is invisible in practice.
- **Simple to reason about and test.** It is just GET requests.

## Alternatives rejected
- **Supabase Realtime from the browser:** conflicts with ADR 0002 (browser must not read tables directly).
- **Server-Sent Events / websockets via the API:** extra moving parts and fragile on free hosting.

## Consequences
- Up to ~10 s staleness across portals; the UI must never claim "live" more strongly than that.
- Steady background traffic: each open tab makes a request every 10 s per active query. Fine at prototype scale; revisit if concurrent users grow into the hundreds.
- If we ever need push (e.g. SMS alerts), that is a new ADR.
