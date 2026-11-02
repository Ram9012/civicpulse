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
