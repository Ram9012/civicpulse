# Architecture Decision Records

Each ADR records **one decision, why we made it, what we rejected, and what it costs us**. They exist so nobody re-litigates a settled choice, and so a new contributor can learn the reasoning in minutes. Decider for all of them: Ramansh (system architect).

New infrastructure, services, or libraries need a new ADR before they are added.

| # | Decision | One line |
|---|---|---|
| [0001](0001-stack.md) | Minimal stack and hosting | React + Express + Supabase on Render, kept boring on purpose |
| [0002](0002-api-only-writer.md) | API is the only writer | Browser never touches data tables; one place enforces rules |
| [0003](0003-contract-first-monorepo.md) | Contract-first monorepo | One OpenAPI file + shared types lets two people build in parallel |
| [0004](0004-polling-over-websockets.md) | Polling, not websockets | 10 s refresh gives "live enough" with zero infrastructure |
| [0005](0005-auth-and-roles.md) | Supabase Auth, roles in `profiles` | Three fixed roles, admin promoted in the database |
| [0006](0006-status-machine-and-event-log.md) | Server-enforced status machine + event log | One history table feeds timeline, audit and notifications |
| [0007](0007-ai-advisory-with-rules-fallback.md) | AI is advisory, with a rules fallback | Groq when configured, keyword rules otherwise |
| [0008](0008-offline-queue.md) | Offline queue in IndexedDB | Reports and photos survive bad connectivity |
| [0009](0009-i18n-dictionary.md) | Tiny i18n dictionary | Three languages without an i18n library |
| [0010](0010-maps-leaflet-no-extra-libs.md) | Leaflet/OSM, hand-rolled map tools | No paid maps, no plugin dependencies |
| [0011](0011-git-workflow-and-agent-boundaries.md) | `dev`/`main`, scope map, agent rules | Boundaries enforced by instructions, CI and review |
| [0012](0012-node-22-and-deploy.md) | Node 22 and deploy mechanics | What broke on first deploy and why the fixes are permanent |
