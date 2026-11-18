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
- [x] Writing a journal entry creates its calendar event at the real UTC time, so it lands hours off (e.g. 8pm in New York shows at 1am the next day) (done: c51104a)
- [x] Current-time line's scrollIntoView scrolls the whole page, clipping the month heading and header buttons (done: 9d6a01d)
- [x] `npm test` fails every file with "Cannot read properties of undefined (reading 'config')" under the forks pool; switch Vitest to vmThreads (done: 7b0f090)
- [x] No saved time zone falls back to UTC, so Google events import hours off (8am Mountain shows at 3pm); default to the browser's zone, and re-read Google events when the main zone changes (done: 946bb08)
- [x] Account settings: searchable time zone picker; type a city to find and set its zone (done: 11248d6)

## Performance
- [x] Faster dashboard clicks: run the Google sync in the background instead of before every render, check the login without a second network call, run the dashboard queries in parallel, show feedback while a click loads (done: 09c568d, 677e2e6, 4902f6c)
- [ ] Faster popups: count the weekly breakdown once and in one grouped query; then move each popup to its own /dashboard/<panel> route (parallel routes) so opening one renders only the popup, not the whole dashboard; update the AGENTS.md popup rule to match. Waiting for the all-day and event-click sessions to finish before starting (claimed: speed session, 2026-11-18)

## Sign-in polish
- [x] Password preview: a show/hide (eye) toggle on password fields (done: 7cb694b)
- [x] Password requirements list on sign up, each one checked off live as the password meets it (done: c43821e)

## Calendar display options
- [x] Account settings: show extra time zones beside the week view's hour labels (like Google Calendar), and pick 12-hour (am/pm) or 24-hour (military) time (done: 81fb82a)
- [x] Week view: show each all-day event under the day it falls on, instead of one flat list (done: d943482)
- [ ] Event form: pick the time zone an event's times are entered in (like Google Calendar); the event remembers it and shows in the right place on the calendar (done: ab69758)

## Going live
- [ ] Deploy to Vercel: generate the Prisma client on install, set env vars on Vercel, add production URLs to Supabase and Google OAuth redirects (claimed: deploy session, 2026-11-18)

## Docs
- [x] Bring README up to date with the current codebase (done: b2c9d3d)
- [x] Bring AGENTS.md up to date with the current codebase (done: 6c5d1da)

## V4 — Big scope items
- [ ] Workout Library (YouTube clips, routines, drag onto the calendar)
- [ ] Meal Planning (reuses the Workout Library drag-and-drop)
- [x] Time zone groundwork for Google sync: wall-clock → real-moment converter (DST-safe), Google env vars in .env.example, "now" rule in AGENTS.md (done: 1f110f6)
- [x] Google Calendar one-way view: connect a Google account in Account settings, show its events read-only on the week and month views (done: 0ffbb3c, 035dc87, 8ee47a0)
- [x] Google Calendar two-way sync (polling on app open) (done: 8717a85, 218f950)
- [x] Dismissible "connect Google Calendar" banner on the dashboard when not connected (done: 3c808c2)
