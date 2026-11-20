# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project at a glance

The Mindful Calendar is an intention-based calendar and journal app. You set broad life intentions (Health, Family, Creativity...), and projects, calendar events and journal entries count toward them. One person owns it, but they often run **several AI agents at the same time** in this repo, so the rules below are written so parallel agents don't trip over each other.

The calendar at `/dashboard` is the only real page (`/` redirects there). Every other feature (Intentions, Projects, Quick Lists, Journals, Post-its, Dopamine menu, Affirmations, event new/edit, account settings) opens as a popup or slide-over on top of it. The week/month switch is a `?mode=month` param on the same page, not a popup. Don't add new top-level routes for features; add a popup instead.

How popups work:
- Each popup is its own route under `/dashboard`, such as `/dashboard/journals`, rendered into the layout's `@panel` slot (a Next.js "parallel route", in `src/app/dashboard/@panel/<name>/page.tsx`). Which screen it shows stays in the query string, for example `/dashboard/journals?view=detail&id=...`. Opening one renders only the popup; the calendar beside it isn't re-rendered, which is what keeps popups fast.
- Build every popup link and redirect with `dashboardRoutes` (`src/lib/dashboard-routes.ts`), never a hand-written URL. To add a popup, add its address there (with a test), then three files in `@panel/<name>/`: a `layout.tsx` that renders the `PanelSheet` frame (art, size, title, with per-screen titles in `titlesByView`), a `loading.tsx` that renders `PanelLoading`, and a `page.tsx` that returns only the view. Keep data fetching out of the layout: Next prefetches the frame and the loading state before the click, so the popup opens at once and its content streams in, and the frame stays put while you move between the popup's screens.
- `src/app/dashboard/default.tsx` draws the calendar under a popup on a full page load, and skips it on in-app clicks (the browser keeps the calendar already on screen). `@panel/page.tsx` and `@panel/default.tsx` render nothing, so going back to `/dashboard` closes the popup.
See "Stored results" below for how server actions refresh the screen after a save.
- One exception: the "+N more" post-its pop-out stays on the calendar page as `?panel=postits`, because its post-its must sit inside the calendar's drag-and-drop area (`CalendarDndProvider`).

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui on `@base-ui/react`, lucide icons, dnd-kit for drag and drop, Zod for validation. Data lives in Postgres on Supabase, accessed through Prisma 7. Sign-in uses Supabase Auth.
- **Run:** `npm install` (its `postinstall` runs `prisma generate`), then `npm run dev`. Lint with `npm run lint`, type-check with `npx tsc --noEmit` and test with `npm test` (`npm run test:watch` while working). Start the dev server with `SKIP_LOGIN=true` to browse the UI without signing in; everything is then saved under one shared `demo-user`. First-time setup (Supabase, env vars, Google OAuth) is in [README.md](./README.md).
- **Plan docs:** [project-summary.md](./project-summary.md) holds the data model, the reasoning behind each decision and the build order. It is partly stale (the Seasons feature was removed on 2026-09-13). [TASKS.md](./TASKS.md) is the live checklist. `wireframes.html` is the original wireframe.
- **Layout:**
  - `src/app/dashboard/` holds the calendar page, the panels and the popups (`overlays/`).
  - `src/app/actions/` holds the server actions, one file per feature. They are the thin layer between the UI and `src/lib/`.
  - `src/app/login/`, `signup/`, `forgot-password/` and `reset-password/` hold sign-in. `src/app/auth/` holds the password-reset confirm route and the Google OAuth routes.
  - `src/lib/<feature>.ts` holds data access for each feature, and `src/lib/<feature>-schemas.ts` holds its Zod schemas. Pure helpers such as `calendar-week.ts` and `streak.ts` also live in `src/lib/`. `src/lib/db.ts` is the Prisma client and `src/lib/supabase/` the Supabase clients.
  - `src/components/ui/` holds shared building blocks, including `sheet.tsx`, the one popup primitive every panel uses.
  - `prisma/schema.prisma` and `prisma/migrations/` hold the database tables. The Prisma client is generated into `generated/prisma/` (not `node_modules`), so import Prisma types from there, as `src/lib/db.ts` does. After changing the schema, run `npx prisma migrate dev --name <change>`.
  - `public/panel-art/` holds the decorative art for each panel.
  - `src/__tests__/` holds the tests, and `src/test/withRollback.ts` the helper that runs a test against the real database inside a transaction and rolls it back afterwards.

### Times and time zones
Calendar event times are stored as **wall-clock times in UTC fields**: an event at 9:00am is saved as `09:00Z` wherever the user lives. Three bugs so far came from mixing this up, so:
- Never compare or save a raw `new Date()` as an event time. Convert "now" first with `toWallClockDate(new Date(), timeZone)`, using the time zone from `getUserTimezoneWithFallback` (`src/lib/user-settings.ts`).
- To turn a stored time back into the real moment (for example for Google Calendar), use `fromWallClockDate` from `src/lib/wall-clock.ts`. It handles daylight-saving changes.
- Timestamps that only record when something happened (`completedAt`, `doneAt`, `setAt`) are real moments and stay as plain `new Date()`.

### Stored results
The dashboard and popups read through `src/lib/stored-reads.ts`, which keeps each read's result per user (Next's `unstable_cache`, stored in Vercel's Data Cache) so repeat visits and background preloads skip the database. Each stored read lists the areas of data it uses (`StoredArea` in `src/lib/stored-results.ts`: events, projects, quickLists...). Rules:
- After every save, a server action calls `forgetStoredAfterSave(userId, [areas])` with **every** area its write touches, including side effects (deleting an event also deletes its journal entry, so it forgets `"events"` and `"journals"`). This also makes the action send back a fresh page, so don't add `revalidatePath`: it would throw away every stored copy for `/dashboard` at once. Route Handlers use `forgetStoredFromRoute` instead.
- Forgetting an area is how the screen learns about a change. A save that forgets too little leaves old data on screen for up to 10 minutes, so when unsure, list the area.
- A new stored read must list every area it reads, take only arguments that repeat (a week's first day, not "now"), and never store random picks or the Google connection (it holds tokens).
- Data-access tests keep calling the plain `src/lib/<feature>.ts` functions with `withRollback`; the stored wrappers are thin and only used by the UI.

### Google Calendar sync
Events sync both ways with Google each time the dashboard loads (`syncGoogleCalendar` in `src/lib/google-sync.ts`). The browser starts it after the page is showing, through the Route Handler `src/app/api/google-sync/route.ts`, not a server action: Next runs a tab's server actions one at a time, so a slow sync would hold up every save. Google is optional: without the `GOOGLE_*` env vars, `isGoogleCalendarConfigured()` returns false and the connect options are hidden, so code touching Google must keep working when it isn't set up. Two rules keep sync working:
- Delete calendar events only through `deleteCalendarEvent` or `removeCalendarEventRow` (`src/lib/calendar-events.ts`). They leave a note so the next sync deletes the event in Google too. A raw `calendarEvent.delete` skips that note, so the sync brings the event straight back from Google.
- Edit events with normal Prisma updates. The sync spots app edits because `updatedAt` moves past `lastSyncedAt`.

Next.js 16 and React 19 are recent and differ from older versions. Check the installed docs or types in `node_modules/` before relying on an API you remember (see the block at the bottom of this file).

## Working agreements

### Task list (TASKS.md)
- [TASKS.md](./TASKS.md) is the checklist of features and fixes. Read it before starting any feature.
- Before starting a new feature, tell the user where it sits in the plan (TASKS.md and `project-summary.md`) and what it maps to.
- Only start a task that has no `(claimed: ...)` on its line. Claim it **before** writing code by adding `(claimed: <agent label>, <date>)`, for example `(claimed: agent-2, 2026-11-18)`. Use the label the user gave you, or a short description of your session if they gave none. This tells the other agents running at the same time to pick something else.
- If the user asks for work that isn't in TASKS.md, first check that nothing similar is already there. If a match turns up, add to that task instead of making a duplicate. Otherwise add a new `[ ]` line in the matching section, then claim it.
- When a task is finished and committed, check it off (`[ ]` to `[x]`), remove the claim and add the commit hash, for example `(done: 14f9e51)`.
- A claim with an old date may have been abandoned. Ask the user before taking it over.
- Don't check off, re-word or remove a task another agent claimed unless the user asks.

### Working alongside other agents
- Other agents may be editing files in the same folder while you work. When `git status` shows changes you didn't make, leave them alone: don't revert, reformat or "fix" them.
- Stage only the files you changed, by name (`git add src/lib/foo.ts ...`). Never use `git add -A`, `git add .` or `git commit -a`, which would sweep another agent's half-finished work into your commit.
- **Always name your files in the commit command too:** `git commit -m "..." -- src/lib/foo.ts src/app/bar.tsx`. Never run a bare `git commit`. All agents share one staging area (git's "index"), so a bare `git commit` also commits whatever *another* agent has staged at that moment. This really happened: a `docs(tasks)` commit swept in another agent's calendar code and had to be reverted. With file names after `--`, git commits only those files and leaves everything else staged as it was.
- That commits each named file whole. If a file you changed also has another agent's uncommitted edits (check `git diff <file>`), their lines would go in too. In that case commit only your part from a private staging area, all in one command, so no other agent's commit can land in between:
  ```sh
  export GIT_INDEX_FILE=.git/index-<your label>; git read-tree HEAD \
    && git apply --cached my-changes.patch \
    && git commit -m "..."; unset GIT_INDEX_FILE; git reset -q -- <your files>
  ```
  `my-changes.patch` is `git diff <file>` with the other agent's hunks deleted. The final `git reset` updates the shared staging area to match your new commit. Afterwards, check `git show --stat HEAD` lists only your files. If this feels risky, stop and ask the user instead.
- Before committing, run `git fetch origin`. If `origin/main` has new commits, pull them first. If that causes merge conflicts, stop and walk the user through them instead of resolving them silently.
- If the checks below fail because of another agent's in-progress files rather than yours, tell the user instead of changing those files.

### Safety and boundaries
- Never read, write or edit the real `.env` file. Only touch `.env.example`.
- Don't read files outside this repo directory without asking first.

### Git
- Never add `Co-Authored-By: Claude` (or any AI co-author line) to commits in this repo.
- Keep commits small. Each commit covers one change or one feature, never several features together.
- **Run the checks before every commit:** `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`. All of them must pass. If anything fails, stop and tell the user instead of committing. Skip the checks when a commit only changes Markdown files (such as `TASKS.md` or `AGENTS.md`), since no code runs.
- Write commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) format:
  - **First line:** `type(scope): short summary`, for example `feat(dashboard): add drag-to-reorder for panels`.
    - `type` is one of `feat` (new feature), `fix` (bug fix), `docs`, `style` (formatting only), `refactor`, `test` or `chore` (tooling, config, dependencies).
    - `scope` is optional and names the area touched, such as `dashboard`, `post-its`, `journals`, `auth`, `lib` or `ui`.
    - Write the summary in the imperative mood ("add", not "added"), in lowercase, with no trailing period, and keep the whole line under about 72 characters.
  - **Body:** after a blank line, explain *what* changed and *why*, so the history makes sense without reading the diff.
  - Don't use vague messages like `fix`, `updates` or `wip`.
- Push to GitHub after every commit. Don't let several commits pile up before pushing.

### Design principles
- **KISS:** pick the simplest thing that works. Don't add abstractions for needs that may never come up.
- **DRY:** don't duplicate logic. Before writing something new, look for an existing helper, component or pattern to reuse (start with `src/components/ui/` and `src/lib/`).
- **SOLID:** each module gets one clear job. Depend on small, focused interfaces.
- Favor OOP where it fits the existing style. Don't force classes into code that is naturally functional.
- No unrequested cleanup. Change only what the task needs.
- Use clear names that are easy to understand. No cryptic abbreviations.

### Layering and TDD
- Keep three layers separate: **data access** (`src/lib/*.ts`), **business logic** (pure helpers in `src/lib/`, called from server actions in `src/app/actions/`), and **UI** (`src/app/`, `src/components/`).
- This project follows TDD. Write and test data-access functions **before** any UI is wired to them.
- Tests use [Vitest](https://vitest.dev/). Run them with `npm test`. Keep the `vmThreads` pool in `vitest.config.ts`: the default pools fail to start on this machine with a misleading "Cannot read properties of undefined (reading 'config')" error.
- Keep tests in `src/__tests__/`, mirroring the source layout (for example `src/lib/post-its.ts` is tested by `src/__tests__/lib/post-its.test.ts`). Don't put test files next to the code.
- Tests for data access run against the real database. Wrap them in `withRollback` from `src/test/withRollback.ts` so they never leave data behind.

### Process and communication
- After finishing a feature, recap any real bugs or difficulties you hit and how you fixed them. Keep these separate from ordinary tooling friction.
- Explain things plainly and in a beginner-friendly way. The project owner is new to Next.js, Prisma, Supabase and TDD, so define terms, use concrete examples and say *why*, not just *what*.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
