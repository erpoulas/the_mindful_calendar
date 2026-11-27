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
- [x] Popup header back button always there: it only appeared after your first click inside a popup, pushing the page down when it did. Always show it (and keep forward's space), and on a popup's first screen have Back return to the calendar, and drop the ✕ close buttons since Back now closes (requested 2026-11-26) (done: 9f746b2)
- [ ] Dopamine Menu header: no Forward button (it has only one screen), and put Back in the card's top-left corner instead of mid-card where the writing area starts (requested 2026-11-26) (claimed: agent-1, 2026-11-26)
- [ ] Project Tracker: drop the handwritten font on the end goal, use the normal text font (requested 2026-11-26) (claimed: agent-1, 2026-11-26)
- [ ] Swap the handwritten font (post-its, Dopamine menu headings, empty states) from Finger Paint to Beth Ellen, resizing where it gets hard to read (requested 2026-11-26) (claimed: agent-4, 2026-11-26)

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
- [ ] Event location suggestions: they only work with a `GOOGLE_PLACES_API_KEY` (Google Cloud project with Places API (New) enabled, billing/card required, free monthly allowance; steps in README). Until then the field is plain text (typing a full address still gives a map link in Google Calendar). Option to avoid the key: use Photon (free, OpenStreetMap-based, no key or card; weaker for businesses, volunteer-run server) by default and Google only when the key is set. Only `src/lib/place-search.ts` needs a second source
- [x] Quick Lists: edit an item's text in place (click it, like post-its) (done: 2932a78)
- [x] Quick Lists popup: declutter the layout (each item row currently carries a checkbox plus "Schedule" and "→ Post-it" links) (done: 2932a78)
- [x] Dopamine menu: quick-add an item as a post-it or a calendar event, with the same "Schedule" and "→ Post-it" actions as Quick List items (done: 3e959b6)
- [x] "Start now" button on quick-list items, project tasks and dopamine-menu items (next to Schedule): instantly creates a 1-hour event starting at the moment it's clicked, titled with the item and noting where it came from ("From quick list: Groceries", "Task in project: Garden"); project tasks link the event to their project (done: 6cc02eb)
- [x] Calendar header: a "Today" button that jumps straight back to the current week (or the current month in month view) from wherever you have scrolled to, like Google Calendar's Today button (done: c4ccbfa)
- [x] Journals popup: make entries easier to view. Today the entry list sits at the bottom of a journal, under the new-entry form and the prompt pool, shows only the first 120 characters, and clicking an entry jumps straight into an edit form. Let entries be read in full (a reading view, with editing as a separate step) and put the entries where they are easy to reach (done: 86c1b76)
- [x] Journals popup: make the UI cuter, with softer cards for entries, friendlier headings and empty states, and the panel art and fonts from the Canva mockup (1cf71a6) (done: 4caa629, follow-up: 0713820)
- [x] Quick Lists (Quick Notes) popup: redesign to feel like Apple Reminders or Apple Notes checklists. Less visual clutter, cuter look matching the Journals restyle, and much easier adding: type straight into a new blank line at the bottom of the list (Enter adds the next one), with roomier text you can edit in place (requested 2026-11-22, after the Journals restyle) (done: 3e8eb59)
- [x] Quick Lists popup follow-up: delete an item by backspacing its text away, line the text up with the ruled lines of the paper art, and make the popup slightly bigger (requested 2026-11-26) (done: 52f7c9f)
- [x] Quick Lists popup: rename a list by clicking its name, and add a new list from the tabs, both right in place instead of opening a separate form screen (requested 2026-11-26) (done: 42e12db)
- [x] Quick Lists popup follow-up: more room between the tabs and the list name, long names never run under the trash icon, and the paper art about 30% bigger while still fitting any screen size, with the text sized to stay on its ruled lines (requested 2026-11-26) (done: 9f5b8f2)
- [x] Journals popup: same in-place editing as Quick Lists. Rename a journal by clicking its name, add a new journal from a name box right in the popup, edit an entry by clicking its text (saves on clicking away) instead of separate form screens, quiet icon buttons, and a less cluttered Write tab; also one screen instead of five (tabs per journal, entries shown in full) and an editable prompt with one-click saved-prompt chips (requested 2026-11-26) (done: 68341bf)
- [x] Journals popup: write without a Save button. The writing box is today's page and saves as you type (coming back the same day carries on the same page); pick several prompts per entry, each added as an italic line in the same box with your answer under it; add saved prompts on a blank line like Quick Lists items (Enter adds, no button); a wider writing box, and never any sideways scroll. (requested 2026-11-26) (done: 4ad96ac)
- [x] Journal schedule: set a repeating writing time per journal (tick weekdays, pick a time and length), shown on the calendar as "<journal name> journal time" and kept in step with Google Calendar as a repeating event. Clicking a journal event on the calendar (a journal time or an entry's event) opens the Journals popup on that journal (requested 2026-11-26) (done: 6854a44)
- [x] Journals popup: flip through old entries one page at a time, styled like a video game's journal or adventure log, instead of a list under today's page. Arrows at the page edges (and the arrow keys when not typing) turn to older and newer pages with a small page-turn animation, each page has a header like "Entry 12 · Thursday, November 26" (in the user's time zone), and a "Back to today" link. Also search past entries by their words and jump straight to a match (requested 2026-11-26) (done: 824382e)
- [x] Affirmations: click today's affirmation to edit it in place, and choose how long to keep it (just today, a week, a month, or until you change it) instead of a random pick from your list; a "back to random" option ends it early. Replaces the separate "Just for today" card (requested 2026-11-26) (done: 4a96193)
- [x] Project Tracker popup: same redesign as Quick Lists. Less clutter, cuter look, and Reminders-style adding of tasks inline (requested 2026-11-22, after the Journals restyle). Like Journals and Quick Lists, one screen with a tab per project instead of list, detail, edit and create screens; edit the name, end goal, due date and intentions in place; edit and backspace-delete tasks like Quick List items (taken over by the user's request 2026-11-26) (done: 460d69e)
- [x] Project Tracker: make projects feel different from quick lists (a journey toward a finish line, not a checklist), with no database changes. The end goal as the page's hero with a due-date countdown, a tasks-done progress bar, time put in from the project's calendar events (this week and total), a "Next up" line for the first open task with Schedule and Start now, and finished projects moved off the tabs onto a "Finished" shelf with a short summary each. A manila-folder look (folder tabs, the page as a folder sheet), uncluttered, everything on one screen with few clicks. Builds on 460d69e (requested 2026-11-26) (done: 3c27139)
- [x] Sidebar panel icons: style more of them like desktop icons, just the image with its label underneath (no card or box around them), so the sidebar has a cute Y2K computer-desktop look overall. Builds on the panel art icons (e332ba9) (requested 2026-11-26) (done: ed29125)
- [x] (schema) Dopamine menu: tag each item with an intention, so whenever the item is scheduled (Schedule or Start now) the new calendar event automatically counts toward that intention. Builds on the dopamine-menu Schedule and Start now actions (3e959b6, 6cc02eb) (requested 2026-11-26) (done: 0f72593)
- [x] Dopamine menu popup: same restyle and simplification as Quick Lists. Less clutter, cuter look on the paper art, Reminders-style adding on a blank line at the bottom (Enter adds the next one), edit an item's text in place and backspace it away to delete it, quiet icon buttons instead of Remove buttons; keeps the random pick, Schedule, Start now, post-it and intention tag (requested 2026-11-26) (done: d627e51)
- [x] Dopamine menu popup follow-up: keep it a plain side-panel popup, not on the Quick Lists notepaper (the user may give it its own dopamine-menu background later). Keep the simpler contents: the pick with quiet icons, rows edited in place, add on the blank line (requested 2026-11-26) (claimed: agent-3, 2026-11-26) (done: da6ed7e)
- [x] Dopamine menu background: use the user's striped "dopamine menu aesthetic" image (local main's canva design assets) as the side popup's art, with its printed text painted over in the paper's cream so the menu's own contents sit on it; keep the stripes, frame, drawings and title (requested 2026-11-26) (claimed: agent-3, 2026-11-26) (done: 981d20b)
- [x] Dopamine menu as a centred popup like Quick Lists: the user's silver tray (cut out of its grey photo background) with their elegant carved-frame menu paper laid on top, as one art image; the menu's contents sit on the paper; drop the striped background (requested 2026-11-26) (claimed: agent-3, 2026-11-26) (done: cbaa764)
- [x] Dopamine menu restyle, simpler: replace the tray-and-paper art with a cream card in the user's wavy blue bow frame and their four line drawings (teacup lady, salad, cake, champagne) in the corners, all in one steel blue; headings in the post-its' handwritten font (Finger Paint), words in Open Sauce Sans; drop Caveat (requested 2026-11-26) (claimed: agent-3, 2026-11-26) (done: ef26540)
- [x] Dopamine menu dice: rolling often shows the same item again (it just re-renders and picks at random from every item). Pick on the spot, never the item already shown (requested 2026-11-26) (claimed: agent-3, 2026-11-26) (done: 95e9b28)
- [x] (schema) Dopamine menu courses: sort items like a real menu by time and energy (Appetizers: quick boosts; Entrees: longer, more rewarding; Sides: pair with a boring task; Desserts: easy to overdo; Specials: bigger planned treats), from How to ADHD's dopamine menu. An optional course on each item, picked from its hover icons; the list grouped under course headings like a menu, with no bullets or tick circles; the dice can roll within one course (requested 2026-11-26) (done: 0b128b3)
- [ ] Dopamine menu course hints: reword the small line under each course heading in How to ADHD's (Jessica McCabe's) own words, e.g. appetizers that "don't suck you in", desserts that are "fine sometimes". Builds on 0b128b3 (requested 2026-11-26) (claimed: agent-3, 2026-11-26)
- [ ] (schema) Quick Lists: one default "Post-its" list kept in sync with the post-its. Making a post-it adds it to the list; dropping a post-it onto the calendar checks its item off (not deleted); deleting a post-it deletes its item. A checked-off item stays on the list until the user deletes it by hand, and deleting an item from the list by hand also deletes its post-it (if it still has one). Likely a link from `QuickListItem` to `PostIt` plus a way to mark the default list (requested 2026-11-26)
- [ ] Journal schedule: two-way sync with Google Calendar. Today the repeating "<journal name> journal time" only goes from the app to Google (6854a44): editing it in Google (days, time, length) never comes back to the app, and deleting it in Google gets it recreated the next time the schedule changes. On each sync, read the repeating event back from Google; if it was edited there, update the journal's schedule to match, and if it was deleted there, turn the journal's schedule off in the app (requested 2026-11-26)
- [ ] Calendar header buttons: restyle the controls that sit on the blue wash (the "Today" button above all, plus the "← Previous week/month" and "Next week/month →" links beside it, and the other controls in the calendar's header rows) so they blend in. Since the wash now reaches the day headers (ad4f559), it also spreads behind the title row, and the "Today" button's solid cream fill (the shared outline `buttonVariants` in `src/app/dashboard/page.tsx`) stands out against it; e.g. a see-through or softly tinted fill. Change only these calendar-header buttons, not the shared button style (requested 2026-11-26)
- [ ] Calendar wash follow-up: move the blue gradient wash up so it sits behind the top of the calendar (the month title and the day headers) instead of the middle of the grid, and keep it from spreading toward the sidebar icons on the left. Builds on ad4f559 (the `gradient-wash.png` Image and its radial mask in `src/app/dashboard/page.tsx`); check both week and month view, since they share the wash (requested 2026-11-26) (claimed: agent-2, 2026-11-26)

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
- [x] Week view: the blue gradient wash behind the calendar looks cut off. It stops at the day-header row (Mon 11/23...), which has a solid cream background, and fades out early on the left, leaving a cream strip beside the hour labels. It should read as one soft background behind the whole calendar card (headers included). Likely causes: the sticky day headers and corner cell use opaque `bg-background` (`src/app/dashboard/time-grid.tsx`, so events don't show through when scrolling), and the wash image in `src/app/dashboard/page.tsx` is shifted down 7% with a tight radial mask (reported 2026-11-26) (done: ad4f559)
- [x] Journal entry dates and times are shown in UTC (`DATETIME_FORMAT` with `timeZone: "UTC"` in `src/app/dashboard/overlays/journals.tsx`), but `createdAt` is a real moment, so an entry written at about 1:50am shows "7:53 AM". Show it in the user's time zone (`getUserTimezoneWithFallback`) (reported 2026-11-26) (done: 824382e, pages now show the date in the user's time zone)
- [ ] Week view hydration warning: the Next.js dev badge shows "1 Issue", "A tree hydrated but some attributes of the server rendered HTML didn't match the client", inside `TimeGrid` (`src/app/dashboard/time-grid.tsx`), on a full load of /dashboard/journals. Something in the grid (likely the current-time line or a time-zone-dependent value) renders differently on the server and in the browser (reported 2026-11-26)
- [x] Deleting a journal: its future and scheduled journal events always go (its repeating journal time, in the app and Google, and any entry event set in the future), and the delete asks whether to also delete the events of its past entries or keep them on the calendar. Today `deleteJournal` (`src/lib/journals.ts`) leaves every entry's event behind; delete the chosen ones through `removeCalendarEventRow`, and have `deleteJournalAction` forget "events" too (reported 2026-11-26, reworded by the user 2026-11-26) (done: 6f2b156)
- [x] The calendar behind a popup disappears after saving in that popup, if the page was loaded (or reloaded) straight on the popup's address, e.g. /dashboard/journals. `src/app/dashboard/default.tsx` draws the calendar only for full page loads and returns null for in-app requests, expecting the browser to keep the calendar already on screen; but a save's refresh replaces the slot with that null. Opening popups by clicking from the calendar is not affected (reported 2026-11-26) (done: d8fb939)
- [x] Scrollbars look like the default Windows/browser ones (grey bar on a white track, with arrow buttons) and clash with the cream, hand-drawn style. Make them blend in: transparent track, no arrow buttons, a thin rounded thumb in a soft tint of the foreground colour that darkens slightly on hover. Likely one global rule in `src/app/globals.css` (`::-webkit-scrollbar` for Chrome/Edge/Safari, `scrollbar-width: thin` + `scrollbar-color` for Firefox) so popups, the calendar and post-its all match (reported 2026-11-26) (done: e74f75d)
- [x] Security updates: `npm audit` reports critical advisories in `next` 16.3.0. Upgrade `next` (and `eslint-config-next` to match) to the latest 16.x patch that fixes them (16.4.5 or later), and `npm audit fix` the tool-only packages; no major-version upgrades (requested 2026-11-26) (done: 12328da; next 16.4.6. Left: 3 high advisories in `effect` via the prisma CLI, whose only fix is a breaking downgrade to prisma 6)

## Onboarding
- [ ] Audit the in-app instructions and helper text, and cut or shorten them so screens stay uncluttered. Explanations like these belong in the guided tour below instead. Already cut: the Affirmations popup's "Just for today" card text ("A one-off override — it won't be added to your permanent list."), removed along with the affirmation editing task
- [ ] Guided tour and portfolio demo: one short walk-through of the app (first intention, project, event, post-it), used in two places. (1) First run: it starts after sign up, and can be replayed anytime from Account settings; it replaces most of the cut instructions. (2) Demo: a "Try the demo" button on the login page opens the live app without signing up, so visitors (e.g. from a portfolio) can see how it works, and the tour starts right away. Each demo visitor gets their own throwaway account filled with sample data (intentions, projects, a week of events, journal entries, post-its, quick lists), so one visitor's changes never show up for the next; old demo accounts are cleaned up automatically. Demo accounts hide Google Calendar connect and the email/password changes. Different from the local-only `SKIP_LOGIN` demo mode (fdcf474), which shares one `demo-user` and must stay off in production (demo requested 2026-11-26)

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
- [ ] Check how the app looks and works on iPhones and other small screens: the week and month calendar, every popup and slide-over, post-its and drag-and-drop on touch, the sidebar, and sign-in pages. Test in browser dev tools' phone sizes (e.g. iPhone SE 375px, iPhone 15 393px) and on a real iPhone in Safari, list what breaks (overflow, tiny tap targets, cut-off popups, hover-only controls), then fix (requested 2026-11-26)

## Docs
- [x] Bring README up to date with the current codebase (done: b2c9d3d)
- [x] Bring AGENTS.md up to date with the current codebase (done: 6c5d1da)
- [x] AGENTS.md: commit rule so one agent's `git commit` can't sweep in another agent's staged files (done: ca017a6)
- [x] Run each agent in its own git worktree: rewrite the AGENTS.md multi-agent rules for it (claims pushed to main, push with `git push origin HEAD:main`), add a setup script, and add rules for schema migrations, hot-spot files, stale claims, fast test runs and building in PowerShell (requested 2026-11-26) (done: f699dd3)

## V4 — Big scope items
- [ ] Workout Library (YouTube clips, routines, drag onto the calendar)
- [ ] Meal Planning (reuses the Workout Library drag-and-drop)
- [x] Time zone groundwork for Google sync: wall-clock → real-moment converter (DST-safe), Google env vars in .env.example, "now" rule in AGENTS.md (done: 1f110f6)
- [x] Google Calendar one-way view: connect a Google account in Account settings, show its events read-only on the week and month views (done: 0ffbb3c, 035dc87, 8ee47a0)
- [x] Google Calendar two-way sync (polling on app open) (done: 8717a85, 218f950)
- [x] Dismissible "connect Google Calendar" banner on the dashboard when not connected (done: 3c808c2)
