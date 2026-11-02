# API contract

The machine-readable source of truth is [`packages/contract/openapi.yaml`](../packages/contract/openapi.yaml) and types in `packages/contract/src/index.ts`. This page is the human summary. If they disagree, the YAML wins and you should tell Ramansh.

Errors always look like `{ "error": { "code": "...", "message": "..." } }`.

| Method + path | Who | Purpose |
|---|---|---|
| GET `/health` | anyone | Liveness + DB ping |
| GET `/me` | logged in | My profile (role, department) |
| GET `/reports` | anyone | List (filters: category, status, q, mine, bbox, page) |
| GET `/reports/nearby` | anyone | Open same-category reports within ~100 m (duplicate nudge) |
| POST `/reports` | citizen | Create; returns report + nearby duplicates |
| GET `/reports/:id` | anyone | Detail + event timeline |
| POST `/reports/:id/upvote` | logged in | Toggle confirm |
| POST `/reports/:id/reopen` | citizen (owner) | Reopen a resolved report |
| POST `/media/upload-url` | logged in | Signed upload URL |
| GET `/notifications`, POST `/notifications/:id/read` | logged in | My notifications |
| POST `/ai/suggest` | logged in | Advisory AI (501 if disabled) |
| GET `/staff/reports` | staff, admin | Department queue |
| POST `/staff/reports/:id/transition` | staff, admin | Status change (409 if invalid) |
| GET `/staff/workers` | staff, admin | Workers in my department |
| GET `/admin/analytics` | admin | Aggregates |
| `/admin/departments`, `/admin/workers`, `/admin/routing` | admin | CRUD |
| PUT `/admin/users/:id/role` | admin | Set role/department |
| GET `/admin/audit-logs` | admin | Read-only log |

## Changing the contract
1. Open an issue labelled `contract` describing the need (field, endpoint, reason).
2. Ramansh decides, edits the YAML and types, and merges.
3. Both Jerome and Bipin then rebase. Nobody else edits `packages/contract/**`.
