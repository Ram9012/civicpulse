# Handoff: Jerome (frontend only)

**Your area:** `apps/web/**` and nothing else. Read [workflow-and-roles.md](workflow-and-roles.md) once so the boundaries are clear.

## Where we are
The whole web app is built and deployed: citizen, staff and admin portals, Explore with map tools, report wizard with offline queue and voice input, three languages, assistant widget, info pages. You are not building features from scratch. Your job from here is **quality, polish and tests** on a working product, in the order below. Tell your agent "I'm Jerome" at the start of every session.

## Map of your code
| What | Where |
|---|---|
| Routes and nav | `apps/web/src/App.tsx` |
| Citizen pages | `src/features/{home,explore,report,my,auth}/` |
| Staff queue and actions | `src/features/staff/StaffPage.tsx` |
| Admin portal (5 tabs) | `src/features/admin/AdminPage.tsx` |
| Info pages | `src/features/info/InfoPages.tsx` |
| Shared UI | `src/components/` (`badges`, `ReportCard`, `maps`, `charts`, `Assistant`, `SyncBanner`) |
| API client, auth, i18n, offline, upload, speech | `src/lib/` |
| Types and constants shared with the API | `@civicpulse/contract` (read-only for you) |

Run it: `npm install`, copy `.env.example` to `.env`, then `npm run dev:api` and `npm run dev:web`. Ramansh gives you the Supabase values. See [day-one.md](day-one.md).

## Your tasks, in priority order
Do one task per PR (small PRs, into `dev`). Each lists **what**, **acceptance criteria**, and **not in this task**.

### J1. Mobile and accessibility pass  (start here)
- **What:** Walk every route at 360px wide as a citizen, a staff member and an admin. Fix what is broken or cramped: nav wrapping, the Account menu (`<details>`) should close when you navigate or click elsewhere, wizard steps, staff two-column layout, admin tables, map controls, the assistant panel covering content.
- **Accept:** no horizontal scroll at 360px on any route; the whole report flow can be completed with keyboard only; visible focus everywhere; touch targets at least 44px; text contrast passes WCAG AA; every input has a label; every image has meaningful `alt` (or `alt=""` if decorative).
- **Allowed new dev dependency:** `eslint-plugin-jsx-a11y` (pre-approved by Ramansh). Add it to `apps/web/eslint.config.js` and fix what it reports.
- **Not in this task:** new features, visual redesign, backend changes.

### J2. Robust states: 404, errors, loading
- **What:** add a 404 route; a route-level error boundary that shows a friendly message and a "Try again" button; one shared `EmptyState` and `Loading` component used across pages; handle an expired session (API returns 401: send the user to `/signin?next=...` with a message); if the first API response takes longer than ~5 s, show "Waking up the server, this can take 30 seconds" (Render cold start).
- **Accept:** no page ever shows a blank screen or a raw error string; every data view has loading, empty and error states; verified by temporarily throwing in a component and by stopping the API.

### J3. Component tests
- **What:** set up Vitest for components and test the logic-heavy parts.
- **Allowed new dev dependencies (pre-approved):** `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fake-indexeddb`. Configure `test.environment: "jsdom"` in `apps/web/vite.config.ts`.
- **Tests to write:** `StatusBadge` (text + icon for every status), `ReportCard`, i18n (switching language changes text; unknown key falls back to English), `RequireAuth` (redirects when logged out, blocks wrong role), report wizard (Next is disabled until a photo, then a pin, then category and 5+ characters; draft restored from `localStorage`), offline queue (enqueue, flush success removes item, flush failure keeps it).
- **Accept:** `npm run test -w apps/web` passes locally and in CI; no test depends on the real API.

### J4. Finish translations
- **What:** every user-visible string is translated into Kannada and Hindi. Missing now: sign-in page, report detail page (Confirm, Reopen, Delete, Timeline, Location), staff page, admin page, assistant widget, info pages, saved areas, map tool buttons, pagination, error messages. Add keys in `src/lib/i18n.tsx`; the build fails if a language misses a key.
- **Accept:** switching to Kannada or Hindi leaves no English UI text except proper nouns and user-entered content. List in the PR which strings you are unsure about so a native speaker can check them.
- **Not in this task:** translating the contents of reports.

### J5. Upload quality
- **What:** in `src/lib/upload.ts`, downscale photos larger than 1600px on the longest side to JPEG (quality about 0.8) using a canvas before uploading; show per-file progress/status in the wizard; reject videos over 50 MB with a friendly message.
- **Accept:** a 12 MP phone photo uploads as a few hundred KB; failures show which file failed and allow retry; the offline queue stores the downscaled file.

### J6. Explore keeps its state in the URL
- **What:** category, status, search, page and list/map view live in the query string; going back restores them; search is debounced about 400 ms; the saved-area `bbox` parameter keeps working.
- **Accept:** copying the URL and opening it elsewhere shows the same results.

### J7. Notification badge
- **What:** show an unread count on the Account menu and highlight unread items; add a "Mark all as read" button that calls the existing `POST /notifications/:id/read` for each unread item.
- **Accept:** badge updates on the 10-second poll and after reading. (If you want a single "read all" endpoint, open a `contract` issue; do not invent one.)

### J8. Password reset
- **What:** "Forgot password?" on the sign-in page using Supabase `resetPasswordForEmail`, plus a `/reset-password` route that calls `updateUser`. Clear messages for wrong password and unconfirmed email.
- **Needs from Ramansh first:** the web URL added to Supabase redirect URLs. Ask before starting.

## Rules that always apply
- Work only in `apps/web/**`. If a task needs anything else (a new field, a new endpoint, a different response), **stop and open an issue labelled `contract`**. Ramansh decides. Never invent endpoints or fields.
- Only the pre-approved dependencies above. Anything else: ask first.
- Keep the UX principles in [ux-guidelines.md](ux-guidelines.md): one primary action per screen, max 4 nav items per role, mobile first, no fake data, status = text + icon + color.
- Never put secrets in code. Only `VITE_*` public values exist in the web app. Never reference the service-role key.
- The browser may talk to Supabase **only** for sign-in/sign-up and signed file uploads. All data goes through the API (see [ADR 0002](adr/0002-api-only-writer.md)).

## Branch and PR flow
```bash
git checkout dev && git pull
git checkout -b feat/jerome-<topic>
# work, then
npm run lint && npm run typecheck && npm run test && npm run build
git push -u origin feat/jerome-<topic>   # then open a PR INTO dev
```
PR template filled in, mobile screenshots attached, CI green. Ramansh reviews and merges. Do not merge your own PR. Never push to `main` or `dev`.

## Definition of done
Acceptance criteria met; loading, empty and error states handled; tests added for new logic; lint, typecheck, test and build pass; screenshots at 360px; only files under `apps/web/` changed.

## Who to ask
Anything about scope, the contract, env values or deployment: Ramansh. Background on why things are the way they are: [docs/adr/](adr/README.md).
