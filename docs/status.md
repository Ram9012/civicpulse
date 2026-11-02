# Project status

Last updated after the M1 to M4 merge and first deploy. Maintained by Ramansh.

## What exists today
Everything on the reference site's feature list is built, with our own cleaner UX and real authentication. It is deployed: web (Render static site), API (Render web service), database/auth/storage (Supabase), keep-alive (UptimeRobot).

### Citizen (M1)
- Sign up / sign in / sign out (Supabase Auth)
- 3-step report wizard: photo/video upload, map pin or GPS, category, description, anonymous option
- Duplicate nudge: shows open same-category reports within ~100 m (last 7 days) so people can confirm instead of re-filing; confirmations raise priority at 5 (high) and 10 (critical)
- Explore: list or map, filters by category, status and area search, pagination
- Report page: media, status timeline, location map, confirm, reopen (reporter or admin), delete (reporter or admin, audited)
- My reports, in-app notifications, saved areas

### Staff (M2)
- Department queue, highest priority first, list or map, status and priority filters
- Actions: verify (set priority; admin can change department), mark duplicate, assign worker (capacity-aware), start work (optional on-site photo), resolve (proof photo required)
- Each action writes a timeline event and notifies the reporter

### Admin (M3)
- Analytics: totals, weekly volume, by category, hotspots, department workload, worker availability, reopen and duplicate rates
- Manage departments, workers, category-to-department routing, user roles
- Audit log (admin actions plus every status change)

### Extras (M4)
- English, Kannada, Hindi UI; voice description in the chosen language (browsers with Web Speech)
- Offline queue with automatic upload on reconnect; draft text survives refresh
- AI triage and PulseBot assistant (Groq when enabled, keyword rules otherwise)
- Map tools: clusters, heatmap, satellite, GeoJSON export
- Live Impact page, How it works, Help

## Where things are
| Thing | Location |
|---|---|
| Web app | `apps/web` |
| API | `apps/api` (routes in `src/routes`, logic in `src/services`, rules in `src/domain`) |
| API contract + shared types | `packages/contract` |
| Database schema | `apps/api/db/migrations/0001` to `0003`, seed in `seed.sql` |
| Decisions and reasons | `docs/adr/` |
| What Jerome / Bipin do next | `docs/handoff-jerome.md`, `docs/handoff-bipin.md` |

## Pull request history
| PR | What |
|---|---|
| #1 | M1 citizen core |
| #2 | M2 to M4 |
| #3 | Promote `dev` to `main` (first deploy) |
| direct | CI/Render contract-build fix; Node 22 fix |

## Verified vs not verified
- **Verified in CI and locally:** lint, typecheck, build, 13 API unit tests (status machine, distance, AI rules, analytics).
- **Verified live:** both builds succeed and `/health` reports the database up.
- **Not yet verified by anyone:** the full end-to-end flow in a browser (citizen submits, staff processes, admin analytics), Groq with a real key, voice input on real devices, offline sync on a real phone, Kannada and Hindi wording. Run the test checklist in PR #2 and record findings as issues.

## Known limitations
- Translations cover the main flows, not every admin or info string (J4).
- The web app has no automated component tests yet (J3); the API has unit tests for pure logic but not for the routes (B2).
- No rate limiting on the API (B3). Treat the public URL as a prototype, not a hardened service.
- Status changes write several rows without a database transaction (B4).
- Analytics reads up to 10,000 reports into memory (B5).
- Unattached uploads are never cleaned up (B6).
- Firefox has no speech recognition; the voice button hides there.
- Branch protection on `main` and `dev` is a GitHub setting Ramansh must turn on.

## Ramansh's own to-do
1. Confirm migrations `0002` and `0003` are applied in Supabase.
2. Promote an admin; add workers per department; create a staff account.
3. Run the end-to-end checklist and file issues.
4. Add `jeromejohn123` and `bipin523396` as collaborators (their usernames are already in `.github/scope-map.json`).
5. Turn on branch protection for `main` and `dev`.
6. Optional: set `AI_ENABLED=true` and `GROQ_API_KEY` after updating the privacy text (ADR 0007).
