# Intention-based Calendar/Journal App — Project Summary

Reference doc for the wireframe (`wireframes.html`). Captures the data model and the *reasoning* behind each decision, not just the current shape — a lot of this went through multiple iterations before landing here.

---

## Core data model

```
Intention (broad, stable life domain)
 ├── Project (deliverable with a real end goal, flat tasks, optional due date)
 ├── tagged events (recurring things, e.g. workouts, family time — no
 │      object needed, just tag events to the intention repeatedly)
 └── journal entries (via the automatic "Journal" intention)

Season (optional, lightweight — name + free-text note, owns nothing)
CalendarEvent (title required, everything else optional)
Journal (multiple named journals, each with its own prompt pool)
QuickList (multiple named lists, no intention required)
WorkoutRoutine / SavedMeal (drag-and-drop libraries, schedule onto calendar)
```

### Intention
- Broad and stable: Health, Creativity, Family, Career advancement, Volunteering (user-defined, not fixed).
- Doesn't require a Project to be "real" — gets substance from a Project, journal entries, or events tagged directly to it.
- **Tracks its own frequency/streak.** Any event tagged directly to an intention (no Project attached) counts as a rep. Detail view shows: this-month count, 8-week streak bar chart, recent tagged events.
- **Multi-intention support:** a Project or event can serve more than one intention (e.g., "Weekly family time" counting toward both Family and Health). Needs a join table, not a single FK.
- A special **"Journal" intention** exists automatically — every journal entry ties to it with zero setup. Entries can *optionally* also tag other intentions.

### Project
- The only structured type under an intention — no separate recurring/habit type exists.
- **Requires a real end goal** — a specific, concrete finish condition (e.g., "Run the Cedar Falls 5k on Oct 12"), not just an open-ended checklist. This is what "done" means.
- Flat task list, no phases. Tasks are **fully reversible** — check/uncheck freely, redoing a task is normal, not a special case.
- **Due date is optional**, independent of the end goal — a project can be open-ended (no calendar deadline) while still having a real finish line.
- **Pause/resume**: pausing preserves all progress exactly as-is; resuming picks up with nothing lost.
- **"Mark complete" is a manual, independent action** — not derived from 100% task completion. You decide when the actual goal is met, even with tasks still unchecked.
- Wanting to repeat something (train for a *second* 5k) means creating a **new** Project, not reopening the old one. Completed projects stay as closed historical records.

### CalendarEvent
- **Only Title is required.** Everything else — time, location, intention, attach-to-project, notes — is optional and defaults to nothing/none.
- **Intention defaults to "— None —"**, not a pre-selected value. Has to be actively chosen.
- **Attach to Project is optional** even when an intention is picked — defaults to "just this intention."
- **All-day / no-specific-time events** are supported — live in a separate strip above the hourly grid, not positioned by time.
- **Quick Add**: a separate, minimal fast lane (title + Enter, nothing else) distinct from the full New Event form — for when you don't want to make any decisions at all.
- Notes/title/location sync to Google Calendar. Journal content never does (see Journal below).

### Journal
- **Multiple named journals** (e.g., Daily Reflection, Food Diary, Gratitude), each with its own prompt pool.
- Prompts: pick randomly, choose from a list, write your own, or **save a prompt you found elsewhere** into the pool (same capture-before-you-lose-it pattern as workouts/meals below).
- **Automatically tied to the "Journal" intention** — no picking required. Can optionally tag additional intentions per entry (e.g., a Food Diary entry might also count toward Health).
- **Two ways to get a journal entry onto the calendar:**
  1. Write spontaneously → saving automatically creates a calendar event at that moment.
  2. Pre-schedule a journal entry time via the New Event form ("Schedule a journal entry?" toggle) → opens straight into that journal when the time comes.
- Only the event title + prompt sync to Google Calendar. Entry content and attached media stay private, always.

### QuickList
- Multiple named lists (Errands, Groceries, Random ideas, etc.) — real tabs, not one flat list.
- **No intention required.** Pure capture — braindump now, deal with it later.
- Each item can be **scheduled directly into a calendar event** (pre-fills the New Event title) without leaving the list, and without being removed from the list until manually checked off.

### Workout Library / Meal Planning
- Same underlying pattern, two instances:
  - **Workout Library**: exercise clips (YouTube, timestamped) → build a routine → save it → drag onto the calendar.
  - **Meal Planning**: saved meals (name + short note, no recipe required) → drag onto the calendar.
- Solves "I saw something online and forgot about it" — capture into a library once, it's reference-able forever, and scheduling is drag-and-drop instead of a form.
- Routines/meals can carry a **default intention link** (pre-fills the New Event form when dragged) but it's a suggestion, not a lock — reusable across different purposes over time.
- Workout clips use YouTube's embed API specifically because it exposes `seekTo()`/time-tracking — Instagram/TikTok/Google Drive embeds don't, so those platforms can't support timestamp-based clip playback (see "workout video" discussion for the full reasoning if needed).

### Season
- Deliberately lightweight: a name, optional dates, and a free-text note (goals, reminders, how you're feeling).
- **Owns nothing.** Does not manage or select which intentions/projects are "in focus" — that whole earlier design (carry-over flow, per-intention selection) was cut for being too much management overhead for too little payoff.
- Shows a **read-only intention time-breakdown** (real data, not configured).
- Has a **reflection field** — quotes back the original note, asks "did you do that," pairs intention with real outcome. This is the actual payoff of the whole feature; available anytime, not gated behind the season ending.

### Dopamine menu / Affirmations
- Both are: a real pool + random pick + "save one you found" to grow the pool. Not static content — the whole point was fixing "I see good ideas online but have nowhere to put them."
- Affirmations additionally support "save mine just for today" (one-off override) separately from "add to my list" (permanent).

### Customizable panels
- Every sidebar panel (Season, breakdown chart, Projects, Quick list, Workouts, Meal planning, Journal, Dopamine, Weekly review) can be individually hidden via a "Customize panels" toggle, with a restore list for anything hidden. Directly addresses "this app has too many features for one person to use all of."

---

## Google Calendar sync
- **Two-way**, not one-way — because the person's actual workflow is editing events directly in Google Calendar, not exclusively through this app.
- Recommended implementation: **polling on app open** (fetch what changed since last sync, reconcile) rather than real-time webhooks — meaningfully less engineering for a solo build, matches how the app will actually be used (catch up when opened, not instant push).
- Only fields Google Calendar understands (time, title, location, notes) can sync in both directions. Intention/Project links are app-only forever — Google Calendar has no concept of them.

---

## Visual design direction (not yet implemented in real code)
- Palette: rose `#E86A8D`, light pink `#F4C2CF`, sage `#A8C7B3`, deep green `#4E6B57`, cream `#FAF3EE`.
- Cream background with a user-supplied orchid photo at ~10% opacity behind all content.
- Everything else about how the palette gets applied (which color means what, typography, per-intention colors) is still undecided — UI polish is deferred until after the v1 build.

---

## Suggested build order

**V0 — Foundation**
Next.js, Postgres + Prisma schema, auth (Supabase Auth or Clerk).

**V1 — Core usable app**
Intentions (create/list/detail with frequency), Projects (create/detail/pause/complete), a **basic week-list calendar** (skip the pixel-positioned drag grid at first), New Event form as specified above.

**V2 — Cheap wins**
Quick List, Season, Dopamine menu, Affirmations — all low-effort, don't gate them behind bigger features.

**V3 — Expensive interactive polish**
Real drag-and-drop time-grid calendar, month view, Journal (start with one journal type, extend to multiple).

**V4 — Big scope items, last**
Workout Library (YouTube API integration), Meal Planning (reuses Workout Library's drag-drop code), Google Calendar two-way sync, customizable panels polish.

---

## Tech stack (from earlier discussion)
- **Frontend/backend:** Next.js + React
- **Database:** Postgres (Neon or Supabase) + Prisma ORM
- **Auth:** Supabase Auth or Clerk
- **Drag-and-drop:** dnd-kit
- **Media storage:** Cloudinary or Supabase Storage (for journal photo/video attachments)
- **Video:** YouTube iframe API for workout clips — no self-hosted video storage needed
