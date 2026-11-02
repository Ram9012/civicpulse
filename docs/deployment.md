# Deployment (Ramansh)

## One-time setup
1. **GitHub**: create repo, push `main`. Add collaborators. Usernames in `.github/scope-map.json` are set (Ram9012, jeromejohn123, bipin523396); update them there if anyone changes accounts.
2. **Supabase**: new project. SQL editor: run every file in `apps/api/db/migrations/` in numeric order (`0001` to `0004`), then `apps/api/db/seed.sql`. Run any new migration before merging the code that needs it. Storage: create public bucket `report-media`. Auth: enable email/password; disable email confirmation for the prototype if you want faster demos.
3. **Make yourself admin**: sign up in the app, then `update profiles set role='admin' where id='<your uuid>';`
4. **Render**: New > Blueprint > pick the repo (reads `render.yaml`). Set the `sync: false` secrets in the dashboard. Set `CORS_ORIGIN` (on the API) to the web URL and `VITE_API_URL` (on the web service) to the API URL, both with `https://` and no trailing slash. **The blueprint creates `VITE_API_URL` empty, and an empty value breaks the site.** After setting it, run Manual Deploy > Clear build cache & deploy on the web service, because `VITE_*` values are baked in at build time.
5. **UptimeRobot**: HTTP(s) monitor on `https://<api>.onrender.com/health`, interval 5 min. Its purpose is to stop Render's free tier from spinning the API down. (Side effect: `/health` runs a trivial DB query, which also counts as Supabase activity.)

## Deploy flow
Contributor PRs merge into `dev` (nothing deploys). When `dev` is stable Ramansh merges `dev` into `main` -> Render auto-deploys both services. Nothing else deploys. Migrations are applied by Ramansh by hand in Supabase **before** merging the code that needs them.

## Secrets
Only in Render and Supabase dashboards and local `.env` files. The service-role key must never reach the web app or git.

## Rollback
Render dashboard > service > Deploys > roll back to previous. Migrations are forward-only; write a new migration to undo.
