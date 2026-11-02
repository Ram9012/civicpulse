# Overview

## The problem
Residents see civic problems but have no clear way to report them or see what happened next. Municipal staff get unstructured complaints with no routing or tracking.

## The product
1. **Citizen** reports an issue: photo/video, location pin, category, short description.
2. The system suggests a department (routing rules; optional AI suggestion). A **staff** member verifies it.
3. Staff assigns a **field worker**, who starts work and uploads a **proof photo** when done.
4. The citizen sees each step on a timeline and gets a notification. They can reopen if it is not fixed.
5. **Admin** manages departments, workers, routing rules, users, and sees simple analytics.

## The key idea: one source of truth
All three portals read the same `reports` table through the same API. There is no sync logic. A staff "Verify" click writes one row; the citizen's page picks it up on its next 10-second refresh.

## Status machine
```
submitted -> verified -> assigned -> in_progress -> resolved
    |            |                                      |
    +-> duplicate <-+                       reopened -> assigned
```
Enforced on the server in `apps/api/src/domain/statusMachine.ts`. The UI never decides what is valid; it asks the API.

## Roles
| Role | Can do |
|---|---|
| citizen | Create reports, upvote, view own reports + notifications, reopen own resolved report |
| staff | See own department's queue; verify, mark duplicate, assign worker, start work, resolve with proof |
| admin | All staff actions across departments; manage departments, workers, routing, user roles; analytics; audit log |
| public (not logged in) | Browse Explore list/map and report detail (no personal info) |

## Roles of people vs roles in the app
Do not confuse the two. "Frontend/backend" ownership is about who writes code (see workflow-and-roles.md). "citizen/staff/admin" are user roles inside the product.
