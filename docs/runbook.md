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
| Reports fail with a missing column error | Migrations `0002`/`0003` not applied in Supabase |
| Staff cannot assign anyone | No active worker in that department. Admin > Workers |
| Staff sees an empty queue | Their profile has no department. Admin > Users |
| New role not visible | Role is cached for the session; sign out and in |
| Web shows old API URL | `VITE_*` values are baked in at build time; redeploy with "Clear build cache" |
| Assistant/AI always gives simple answers | `AI_ENABLED` is not `true` or `GROQ_API_KEY` is missing; the fallback is intentional |
