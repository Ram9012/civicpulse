# Deployment (Architect)

## One-time setup
1. **GitHub**: create repo, push `main`. Add collaborators. Replace the `REPLACE_*` usernames in `.github/scope-map.json` and `.github/CODEOWNERS`.
2. **Supabase**: new project. SQL editor: run `apps/api/db/migrations/0001_init.sql`, then `apps/api/db/seed.sql`. Storage: create public bucket `report-media`. Auth: enable email/password; disable email confirmation for the prototype if you want faster demos.
3. **Make yourself admin**: sign up in the app, then `update profiles set role='admin' where id='<your uuid>';`
4. **Render**: New > Blueprint > pick the repo (reads `render.yaml`). Set the `sync: false` secrets in the dashboard. Set `CORS_ORIGIN` to the web URL and `VITE_API_URL` to the API URL.
5. **UptimeRobot**: HTTP(s) monitor on `https://<api>.onrender.com/health`, interval 5 min. Its purpose is to stop Render's free tier from spinning the API down. (Side effect: `/health` runs a trivial DB query, which also counts as Supabase activity.)

## Deploy flow
Contributor PRs merge into `dev` (nothing deploys). When `dev` is stable the Architect merges `dev` into `main` -> Render auto-deploys both services. Nothing else deploys. Migrations are applied by the Architect by hand in Supabase **before** merging the code that needs them.

## Secrets
Only in Render and Supabase dashboards and local `.env` files. The service-role key must never reach the web app or git.

## Rollback
Render dashboard > service > Deploys > roll back to previous. Migrations are forward-only; write a new migration to undo.
