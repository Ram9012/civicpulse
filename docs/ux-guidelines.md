# UX guidelines (Jerome)

The reference site was cluttered: banners, filler counters, 10-item admin sidebar, duplicate nav, placeholder testimonials. We do the opposite.

## Rules
1. **One primary action per screen.** Citizen home: "Report an issue". Staff queue: the next action on the selected report.
2. **Mobile first.** Design at 360px wide, then scale up. Touch targets at least 44px.
3. **Max 4 nav items per role.**
   - Public / citizen: Explore, Report, My reports, Sign in/Account
   - Staff: Queue, Map, Account
   - Admin: Queue, Map, Analytics, Settings
4. **No fake data.** Empty states say what to do next ("No reports yet. Report the first one.").
5. **Status = text + icon + color**, never color alone. One shared `StatusBadge`.
6. **Progressive disclosure.** Staff list shows ID, title, priority, status, one action button. Details open in a side panel/page.
7. **Report wizard: 3 steps max** - (1) photo/video, (2) location pin, (3) category + description + anonymous toggle. Show progress, allow back, keep entered data.
8. **Plain language**, no jargon (not "triage", say "review").
9. **Always handle loading, empty and error states.**
10. **Accessible**: keyboard navigable, visible focus, labels on inputs, alt text on images, respect reduced motion.

## Screens (what exists)
| Route | Who | Content |
|---|---|---|
| `/` | all | Headline, Report button, link to Explore |
| `/explore` | all | List/map toggle, filters (category, status), search by area |
| `/reports/:id` | all | Photo(s), status timeline, location (coarse), upvote |
| `/signin` | all | Sign in / sign up in one form with a toggle |
| `/report` | citizen | 3-step wizard |
| `/my` | citizen | My reports + notifications |
| `/staff` | staff, admin | Queue + detail panel + action buttons |
| `/admin` | admin | Analytics, routing table, departments/workers, users |

## Visual
- Tailwind only. Small palette: one brand color, slate neutrals, four status colors.
- Shared components in `src/components/` (Button, StatusBadge, PriorityBadge, Timeline, EmptyState, PhotoUpload, MapPicker).
- Map: Leaflet + OpenStreetMap tiles. No paid map services.

## Cross-portal behaviour
Lists poll every 10 s (already configured). After a mutation, invalidate the related queries so the actor sees the change instantly; everyone else sees it on the next poll.
