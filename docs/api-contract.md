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
| DELETE `/reports/:id` | reporter, admin | Delete a report (audited) |
| GET `/departments` | anyone | Department names for labels and dropdowns |
| GET `/stats/public` | anyone | Live Impact page numbers (no personal data) |
| GET/POST `/me/areas`, DELETE `/me/areas/:id` | logged in | Saved areas (max 10); used with the `bbox` list filter |
| POST `/ai/suggest` | logged in | Advisory triage: Groq if enabled, keyword rules otherwise (`source` says which) |
| POST `/ai/chat` | anyone | PulseBot. Looks up a mentioned `CIV-` id; Groq if enabled, rules otherwise |
| GET `/staff/reports` | staff, admin | Department queue, highest priority first, includes `aiSuggestion` |
| POST `/staff/reports/:id/transition` | staff, admin | Status change. 409 if invalid. `assigned` needs `workerId`, `resolved` needs `proofMediaId`, `duplicate` needs `duplicateOf` |
| GET `/staff/workers` | staff, admin | Active workers with `activeTasks` / `capacity` |
| GET `/admin/analytics` | admin | Totals, weekly volume, by category, hotspots, department workload, worker availability |
| `/admin/departments`, `/admin/workers` | admin | CRUD (delete fails with 409 if in use) |
| GET/PUT `/admin/routing` | admin | Category to department rules |
| GET `/admin/users`, PUT `/admin/users/:id/role` | admin | List users; set role (and department for staff) |
| GET `/admin/audit-logs` | admin | Admin actions plus every status change, newest first |

## Changing the contract
1. Open an issue labelled `contract` describing the need (field, endpoint, reason).
2. Ramansh decides, edits the YAML and types, and merges.
3. Both Jerome and Bipin then rebase. Nobody else edits `packages/contract/**`.
