# ADR 0008: Offline queue in IndexedDB

**Status:** accepted. **Decider:** Ramansh.

## Context
The reference site promised that reports and media made without signal are saved and uploaded later, without duplicates. Civic problems are often spotted on poor connections.

## Decision
- `apps/web/src/lib/offline.ts` stores queued reports (payload + the actual `File` objects) in **IndexedDB**, which can hold binary files; `localStorage` cannot.
- If the browser is offline, or submit fails with a network error, the wizard enqueues instead and tells the user.
- `SyncBanner` flushes the queue when signed in, on the `online` event, and every 30 s. For each item: upload files, create the report, and **delete the item only after the server accepted it**. Any failure stops the flush and retries later.
- Text fields of the wizard are also drafted in `localStorage` so a refresh does not lose them.

## Why
- IndexedDB is the standard, dependency-free way to persist files in the browser.
- "Delete after success" is a simple duplicate-prevention rule: a crash mid-flush leaves the item queued, and a re-send happens at most once per item.
- No service worker is required, which keeps the build and caching story simple.

## Alternatives rejected
- **Service worker + background sync:** more capable but adds a build step, caching pitfalls, and limited browser support.
- **`localStorage` with base64 images:** size limits and slow.
- **No offline support:** drops a feature users in poor-coverage areas need.

## Consequences
- The queue is per browser/device and only flushes while the app is open (no true background sync).
- Uploads happen at flush time, so very large videos on slow links can take a while; client-side image downscaling is in the backlog (J5).
- If a flush crashes after the server created the report but before we deleted the item, a rare duplicate can occur. The duplicate-nudge and staff "mark duplicate" flow handle that case.
