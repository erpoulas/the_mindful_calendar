# TASKS.md

The shared checklist of features and fixes. See the "Task list" rules in [AGENTS.md](./AGENTS.md).

- Open: `- [ ] Short description`
- Claimed: `- [ ] Short description (claimed: agent-2, 2026-11-18)`
- Done: `- [x] Short description (done: <commit hash>)`

Sections follow the build order in [project-summary.md](./project-summary.md).

## V0 — Foundation
- [x] Next.js + shadcn/ui scaffold, Vitest setup, Prisma schema and first migration (done: a9ab66b)
- [x] Real-database tests with transaction rollback (done: d16abb5)
- [x] Supabase Auth: sign up, log in, log out, session refresh, route protection (done: 50917a5)

## V1 — Core usable app
- [x] Intentions data layer: create, list, detail, weekly streak counts (done: a8514f6)
- [x] Projects data layer: create, list, detail, tasks, pause/resume/complete (done: 024fc7e)
- [x] Intentions UI with streak chart (done: a4988ef)
- [x] Projects UI (done: 82e9349)
- [x] Edit and delete for Intentions and Projects (done: 8db72cc)
- [x] Calendar events data layer (done: f5534fc)
- [x] Basic week-list calendar and New Event form (done: caff9f4)

## V2 — Cheap wins
- [x] Quick Lists (done: 941b13b)
- [x] Dopamine menu and Affirmations (done: a91f6d3)
- [x] ~~Season~~ (built in 6cc3c19, then removed entirely in 039ad99)

## V3 — Interactive polish
- [x] Month view (done: a377894)
- [x] Journal (done: 73e7b2e)
- [x] Drag-and-drop time-grid calendar (done: 27269b5)

## Dashboard and popup refactor
- [x] Dashboard as the home page with a sidebar and customizable panels (done: f2f9567)
- [x] Weekly intention breakdown and weekly review stats (done: b6a7464)
- [x] Sheet popup primitive; every feature turned into a dashboard popup (done: a4a5d94)
- [x] Post-its: data layer, tray, drag onto the calendar (done: 47a62ef)
- [x] Account settings popup: timezone, password/email change, password reset (done: a71976e)
- [x] Match the design to the Canva mockup: fonts, colors, panel art (done: 1cf71a6)
- [x] Non-scrolling app shell with a permanent post-it column (done: 6cdc095)
- [x] Post-it overflow pop-out, ghost-card creation, drag-to-reorder (done: 0d522dd)
- [x] Expand toggle for clipped post-its (done: bac28b9)
- [x] Drag-to-reorder dashboard panels in customize mode (done: 14f9e51)

## Dashboard and calendar polish (uncommitted work found 2026-11-18)
- [x] Dashboard customization context and layout spacing; fixes the build broken by 14f9e51 (done: 03f85a2)
- [x] Event form: start required, End shown only for all-day events, no duplicate popup title (done: 0369266)
- [x] Panel art icons for Affirmation, Time this week and Weekly review (done: e332ba9)
- [x] Calendar "today" markers: current-time line, sticky day headers, today circle in month view (done: ec535f6)
- [x] Demo mode: SKIP_LOGIN=true skips sign-in for local UI browsing (done: fdcf474)

## Bugs
- [x] "Today" markers use UTC instead of the user's time zone, so they land on the wrong day/hour in the evening (done: 114dea8)
- [x] Dashboard picks "this week" (and today's affirmation/weekly stats) by UTC date, so on Sunday evening in the Americas it already shows next week; should use the time zone saved in Account settings (done: 1a3ebc6)
- [x] Unused activeCount/openCount props left after removing panel descriptions (done: 68dd0b9)
- [x] Event form hides the End field for timed events; it should always show (done: 953ce40)
- [ ] Writing a journal entry creates its calendar event at the real UTC time, so it lands hours off (e.g. 8pm in New York shows at 1am the next day)
- [ ] Current-time line's scrollIntoView scrolls the whole page, clipping the month heading and header buttons (claimed: claude-scroll-fix, 2026-11-18)
- [ ] `npm test` fails every file with "Cannot read properties of undefined (reading 'config')" under the forks pool; switch Vitest to vmThreads (claimed: claude-scroll-fix, 2026-11-18)

## Sign-in polish
- [ ] Password preview: a show/hide (eye) toggle on password fields
- [ ] Password requirements list on sign up, each one checked off live as the password meets it

## V4 — Big scope items
- [ ] Workout Library (YouTube clips, routines, drag onto the calendar)
- [ ] Meal Planning (reuses the Workout Library drag-and-drop)
- [ ] Google Calendar two-way sync (polling on app open)
