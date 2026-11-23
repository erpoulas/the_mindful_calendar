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
- [x] Easy back-and-forth inside popups: (done: d7083b0, 30b528c, fe9ee26) from a journal, project or intention detail, a "back to list" link plus a way to jump straight to another one (previous/next or a switcher, like Quick Lists' tabs) without closing the popup. Start with Journals, then Projects and Intentions. Build on the per-panel routes from the "Faster popups" task. Also add back and forward buttons in the popup header that step through the screens you've visited inside the popup (like a browser's back/forward), so you can retrace your steps without closing it. (header back/forward buttons done: 96d2da5; Journals back-to-list and previous/next links done: d7083b0; Projects: 30b528c; Intentions: fe9ee26). Do Journals first: opening an entry (`JournalEntryEditView` in `src/app/dashboard/overlays/journals.tsx`) shows only the edit form, with no link back to the journal or its entry list (reported 2026-11-20)

## Dashboard and calendar polish (uncommitted work found 2026-11-18)
- [x] Dashboard customization context and layout spacing; fixes the build broken by 14f9e51 (done: 03f85a2)
- [x] Event form: start required, End shown only for all-day events, no duplicate popup title (done: 0369266)
- [x] Panel art icons for Affirmation, Time this week and Weekly review (done: e332ba9)
- [x] Calendar "today" markers: current-time line, sticky day headers, today circle in month view (done: ec535f6)
- [x] Demo mode: SKIP_LOGIN=true skips sign-in for local UI browsing (done: fdcf474)
- [x] Color events by intention: intention colors limited to Google Calendar's 11 event colors (swatch picker), events drawn in their intention's color, the same color sent to Google, and changing an intention's color recolors all its events (in Google on the next sync) (done: adb5185, eb13238, 7b23dea)
- [x] Schedule project tasks: a "Schedule" link on each task in a project's detail, like the one on Quick List items, that opens the New Event form with the task's text as the title and the project already picked, so the event counts toward the project's intentions (done: 8101d1f)
- [x] Intentions: make edit, delete and color change easy to find. They already exist (8db72cc, adb5185) but only behind an intention's detail screen, and built-in intentions hide them; add them to the intentions list too (done: 1a885e4)
- [x] Event form: show each intention's color dot next to its name in the Intentions checkboxes, like the intentions list does (done: bc0f512)
- [x] Event form: a location field like Google Calendar's, suggesting real places as you type, so the place (and its map link) shows up properly in Google Calendar after sync. Needs a place-search service (e.g. Google Places), which is optional like the other Google features (done: 5d55fd8)
- [x] Quick Lists: edit an item's text in place (click it, like post-its) (done: 2932a78)
- [x] Quick Lists popup: declutter the layout (each item row currently carries a checkbox plus "Schedule" and "→ Post-it" links) (done: 2932a78)
- [x] Dopamine menu: quick-add an item as a post-it or a calendar event, with the same "Schedule" and "→ Post-it" actions as Quick List items (done: 3e959b6)
- [x] "Start now" button on quick-list items, project tasks and dopamine-menu items (next to Schedule): instantly creates a 1-hour event starting at the moment it's clicked, titled with the item and noting where it came from ("From quick list: Groceries", "Task in project: Garden"); project tasks link the event to their project (done: 6cc02eb)
- [ ] Calendar header: a "Today" button that jumps straight back to the current week (or the current month in month view) from wherever you have scrolled to, like Google Calendar's Today button (claimed: today-button agent, 2026-11-22)
- [ ] Journals popup: make entries easier to view. Today the entry list sits at the bottom of a journal, under the new-entry form and the prompt pool, shows only the first 120 characters, and clicking an entry jumps straight into an edit form. Let entries be read in full (a reading view, with editing as a separate step) and put the entries where they are easy to reach
- [ ] Journals popup: make the UI cuter, with softer cards for entries, friendlier headings and empty states, and the panel art and fonts from the Canva mockup (1cf71a6)

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
- [x] Week view: clicking an event only opens the edit form if you hit the title text; make the whole box clickable while keeping it draggable (done: ad85706, 78cf4f1)
- [x] Post-its: dismissing (✕) gives no feedback until the whole dashboard reloads, and the ✕ is a tiny target; hide the note right away and enlarge the button (done: 113ca25)
- [x] Post-its: click a note to edit its text in place (still draggable) (done: e1c18c1)
- [x] Dashboard is capped at 72rem and centered, leaving empty bands on wide windows; let it fill the full width (done: e46dd9f)
- [x] Month view: event titles are cut off and look broken. On busy days the chips are squashed into thin bars with only the top half of the text showing ("morning w", "csci 4273" sliced through), some days show empty slivers, and chip heights differ from day to day. Each visible event should be a full-height, single-line chip with "…" at the end, with the rest moved into "+N more" (done: 5dd2a28)
- [x] Popups (seen in Journals, reported 2026-11-22): the scrollable area spills outside the panel art. Content and the scrollbar run past the notebook PNG: the form box sits above the paper's top edge and overlaps the header's "Account settings" and "Log out", and the scrollbar sits outside the paper on the right. Confine the scroll area (content and scrollbar) to the pixels of the panel art image so nothing draws outside it (`PanelSheet` / `src/components/ui/sheet.tsx`) (done: 09ec938)

- [x] `npm test`: the GoogleCalendarSync and NavigationProgress component tests (12 tests) fail because their `vi.mock("next/navigation")` isn't applied, so the real router runs ("invariant expected app router to be mounted"). This blocks every commit, since the checks must pass. Cause: Vitest treats `c:` and `C:` as different paths on Windows (done: 9028e84)

## Onboarding
- [ ] Audit the in-app instructions and helper text, and cut or shorten them so screens stay uncluttered
- [ ] First-run tutorial: after sign up, a short guided walk-through of setting up (first intention, project, event, post-it); replay it anytime from Account settings. Replaces most of the cut instructions

## Performance
- [x] Faster dashboard clicks: run the Google sync in the background instead of before every render, check the login without a second network call, run the dashboard queries in parallel, show feedback while a click loads (done: 09c568d, 677e2e6, 4902f6c)
- [x] Faster popups: count the weekly breakdown once and in one grouped query; then move each popup to its own /dashboard/<panel> route (parallel routes) so opening one renders only the popup, not the whole dashboard; update the AGENTS.md popup rule to match (done: bba38b2, d3797e5, ff0e882, 05d5f8c, 4d6c7c4, fa7126a, 199e302, f792fa5)
- [x] Smoother navigation: instant popup frames, instant close that keeps the week, single-render drag-and-drop, non-blocking Google sync, fewer dashboard queries, prefetched week arrows (done: ddb890a, 59528e0, b4cc82a, 05f9990, bb3901e, afc33d1)
- [x] Stored server results and preloaded popups: keep each feature's query results per user and throw away only that feature's copy when it changes, then preload every popup's first screen (done: 60dcf1a, df2bafb)
- [x] Instant clicks in popups: ticks, adds, deletes and project status changes show on screen at once and save in the background, undoing themselves if the save fails; top loading bar removed (done: 1421f13, 33c4b4a)

## Sign-in polish
- [x] Password preview: a show/hide (eye) toggle on password fields (done: 7cb694b)
- [x] Password requirements list on sign up, each one checked off live as the password meets it (done: c43821e)

## Calendar display options
- [x] Account settings: show extra time zones beside the week view's hour labels (like Google Calendar), and pick 12-hour (am/pm) or 24-hour (military) time (done: 81fb82a)
- [x] Week view: show each all-day event under the day it falls on, instead of one flat list (done: d943482)
- [x] Event form: pick the time zone an event's times are entered in (like Google Calendar); the event remembers it and shows in the right place on the calendar (done: ab69758)

## Going live
- [x] Deploy to Vercel: generate the Prisma client on install, set env vars on Vercel, add production URLs to Supabase and Google OAuth redirects (done: 2fd87a4; env vars and redirect URLs set up on Vercel, Supabase and Google by the owner)

## Docs
- [x] Bring README up to date with the current codebase (done: b2c9d3d)
- [x] Bring AGENTS.md up to date with the current codebase (done: 6c5d1da)
- [x] AGENTS.md: commit rule so one agent's `git commit` can't sweep in another agent's staged files (done: ca017a6)

## V4 — Big scope items
- [ ] Workout Library (YouTube clips, routines, drag onto the calendar)
- [ ] Meal Planning (reuses the Workout Library drag-and-drop)
- [x] Time zone groundwork for Google sync: wall-clock → real-moment converter (DST-safe), Google env vars in .env.example, "now" rule in AGENTS.md (done: 1f110f6)
- [x] Google Calendar one-way view: connect a Google account in Account settings, show its events read-only on the week and month views (done: 0ffbb3c, 035dc87, 8ee47a0)
- [x] Google Calendar two-way sync (polling on app open) (done: 8717a85, 218f950)
- [x] Dismissible "connect Google Calendar" banner on the dashboard when not connected (done: 3c808c2)
