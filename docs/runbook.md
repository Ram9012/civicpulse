# Runbook (when something breaks)

| Symptom | Check |
|---|---|
| Site loads but data is empty / errors | API `/health`. If 503, Supabase is paused or env is wrong |
| First request after idle is slow (~30 s) | Render cold start. UptimeRobot should prevent it; check the monitor is active |
| CORS error in browser console | `CORS_ORIGIN` on the API must equal the web URL exactly (no trailing slash) |
| 401 everywhere | Web and API point at different Supabase projects, or token expired |
| 403 for staff | Their `profiles.role` / `department_id` not set; admin fixes it in Admin > Users |
| Upload fails | Bucket `report-media` missing or not public; signed URL expired |
| CI `scope` check fails | You changed files outside your area. Revert those files, or ask Ramansh |
| `Cannot find module '@civicpulse/contract'` | Run `npm run build:contract` (dev scripts do this automatically) |
| `/health` says `native WebSocket not found` | API runs on Node 20. Set `NODE_VERSION=22` on Render (ADR 0012) |
| `/health` 503 locally | Root `.env` missing or wrong; the API log prints `[health] db check failed: ...` |
| Reports fail with a missing column error | Migrations `0002`/`0003`/`0004` not applied in Supabase |
| Staff cannot assign anyone | No active worker in that department. Admin > Workers |
| Staff sees an empty queue | Their profile has no department. Admin > Users |
| New role not visible | Role is cached for the session; sign out and in |
| Web shows old API URL | `VITE_*` values are baked in at build time; redeploy with "Clear build cache" |
| Assistant/AI always gives simple answers | `AI_ENABLED` is not `true` or `GROQ_API_KEY` is missing; the fallback is intentional |
| Sign-up says `Database error saving new user` | Migration `0004_fix_signup_trigger.sql` not applied (the sign-up trigger could not find `profiles`) |
| Explore says `Unexpected token '<'` | `VITE_API_URL` is empty or wrong on the web service, so requests hit the web site. Set the full API URL, rebuild with cache cleared (ADR 0012) |
| "Something went wrong" on submit | Generic 500. Open Render > API > Logs for the real error (the API logs it) |
| `Cannot read properties of null` or `PGRST201` in API logs | Ambiguous PostgREST embed or a swallowed query error. Name the relationship (`profiles!reporter_id`) and throw on `error` (ADR 0012) |
| CORS error in the browser after fixing the URL | `CORS_ORIGIN` on the API must equal the web URL exactly, with no trailing slash |
