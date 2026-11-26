# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project at a glance

The Mindful Calendar is an intention-based calendar and journal app. You set broad life intentions (Health, Family, Creativity...), and projects, calendar events and journal entries count toward them. One person owns it, but they often run **several AI agents at the same time**, each in its own git worktree (see "Working alongside other agents"), so the rules below are written so parallel agents don't trip over each other.

The calendar at `/dashboard` is the only real page (`/` redirects there). Every other feature (Intentions, Projects, Quick Lists, Journals, Post-its, Dopamine menu, Affirmations, event new/edit, account settings) opens as a popup or slide-over on top of it. The week/month switch is a `?mode=month` param on the same page, not a popup. Don't add new top-level routes for features; add a popup instead.

How popups work:
- Each popup is its own route under `/dashboard`, such as `/dashboard/journals`, rendered into the layout's `@panel` slot (a Next.js "parallel route", in `src/app/dashboard/@panel/<name>/page.tsx`). Which screen it shows stays in the query string, for example `/dashboard/journals?view=detail&id=...`. Opening one renders only the popup; the calendar beside it isn't re-rendered, which is what keeps popups fast.
- Build every popup link and redirect with `dashboardRoutes` (`src/lib/dashboard-routes.ts`), never a hand-written URL. To add a popup, add its address there (with a test), then three files in `@panel/<name>/`: a `layout.tsx` that renders the `PanelSheet` frame (art, size, title, with per-screen titles in `titlesByView`), a `loading.tsx` that renders `PanelLoading`, and a `page.tsx` that returns only the view. Keep data fetching out of the layout: Next prefetches the frame and the loading state before the click, so the popup opens at once and its content streams in, and the frame stays put while you move between the popup's screens. Links that open a popup, and links to the screens inside one (each journal, project, intention, quick-list tab), also set `prefetch`, so the whole screen, data included, loads before the click; their reads are stored (see "Stored results"), which keeps that cheap.
- `src/app/dashboard/default.tsx` draws the calendar under a popup on a full page load and after a save (a save's answer replaces a calendar that came from a full load), and skips it on in-app clicks (the browser keeps the calendar already on screen). The rules are in `shouldDrawCalendarUnderPopup` (`src/lib/calendar-under-popup.ts`). `@panel/page.tsx` and `@panel/default.tsx` render nothing, so going back to `/dashboard` closes the popup.
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
- Only start a task that has no `(claimed: ...)` on its line. Claim it **before** writing code by adding `(claimed: <agent label>, <date>)`, for example `(claimed: agent-2, 2026-11-18)`. Use the label the user gave you, or a short description of your session if they gave none. This tells the other agents running at the same time to pick something else. Other agents only see a claim once it is on `main`, so commit it on its own (`docs(tasks): claim ...`) and push it right away, before any code. If the pull before that push shows someone else claimed the same task first, drop yours and pick another.
- If the user asks for work that isn't in TASKS.md, first check that nothing similar is already there. If a match turns up, add to that task instead of making a duplicate. Otherwise add a new `[ ]` line in the matching section, then claim it.
- When a task is finished and its code is pushed, check it off (`[ ]` to `[x]`), remove the claim and add the commit hash, for example `(done: 14f9e51)`. Take the hash after the push: rebasing before a push changes the hashes.
- When adding a task that will change `prisma/schema.prisma`, put `(schema)` on its line (see "Schema changes" below).
- A claim more than 2 days old may have been abandoned. Ask the user before taking it over. Leave newer claims alone and pick another task.
- Don't check off, re-word or remove a task another agent claimed unless the user asks.

### Working alongside other agents
**Each agent works in its own folder (a git worktree).** A worktree is an extra folder linked to this same repo, on its own branch, with its own files, staging area and `.next/` build folder. Agents in separate worktrees never see each other's half-finished work, so a test that another agent is deliberately keeping red (the first step of TDD) can't block your commit. Branches here are short-lived: every commit goes straight to `main`, so there's no separate merge step.

- **Setup (the user does this once per agent):** from the main `calendar-app` folder, run `powershell -ExecutionPolicy Bypass -File scripts\new-agent-worktree.ps1 <label> <task>`. It creates `../calendar-app-<label>` from the latest `origin/main` and runs `npm install`. The user then copies `.env` in and starts the agent in that folder. When the agent is finished: `git worktree remove ../calendar-app-<label>` and `git branch -D <label>/<task>`.
- **Code only in your own worktree.** If you were started in the main `calendar-app` folder and the task changes code, ask the user to set up a worktree for you. The main folder is for the user and for Markdown-only edits. Don't open or edit another agent's worktree folder.
- **Push with `git push origin HEAD:main`**, never a plain `git push` (your branch has a different name from `main`). Before every push, run `git pull --rebase --autostash` to put your commits on top of everyone else's. If that brings in new commits, re-run the checks before pushing. If the push is rejected because someone pushed just before you, pull and push again.
- **Rebase conflicts:** if both sides only changed different task lines in `TASKS.md` (claims or check-offs), keep both and continue. Any other conflict: stop and walk the user through it instead of resolving it silently.
- **Pull often** (at least before starting each new step of a task), so you work on top of everyone else's latest code and conflicts stay small.
- **Hot-spot files.** Almost every feature touches `prisma/schema.prisma`, `src/lib/dashboard-routes.ts`, `StoredArea` in `src/lib/stored-results.ts` and `TASKS.md`. Pull just before editing one of these, keep the change small, and commit and push it soon after. When choosing a task, prefer one in a different area from the tasks already claimed (journals and post-its at the same time, not two journal tasks).
- **Schema changes.** All worktrees share one Supabase database, so two agents running migrations at once can clash. A task that changes `prisma/schema.prisma` is marked `(schema)` on its TASKS.md line, and only one `(schema)` task may be claimed at a time. After a pull brings in another agent's migration, run `npx prisma generate` (the database already has it). Never run `prisma migrate reset`, and never accept a prompt from `prisma migrate dev` to reset the database: stop and ask the user.
- **Dev server:** each worktree needs its own port, e.g. `npm run dev -- -p 3001`. Sign-in redirects are set up for port 3000, so on other ports use `SKIP_LOGIN=true`.
- **If you do work in the shared main folder** (Markdown-only edits): when `git status` shows changes you didn't make, leave them alone. Stage and commit only your files by name: `git commit -m "..." -- TASKS.md`. Never use `git add -A`, `git add .`, `git commit -a` or a bare `git commit`: everyone there shares one staging area, and a bare commit once swept another agent's code into a `docs(tasks)` commit. If a file you need to commit also has someone else's uncommitted edits (check `git diff <file>`), stop and ask the user.

### Safety and boundaries
- Never read, write or edit the real `.env` file. Only touch `.env.example`.
- Don't read files outside this repo directory without asking first. Your own worktree counts as this repo.

### Git
- Never add `Co-Authored-By: Claude` (or any AI co-author line) to commits in this repo.
- Keep commits small. Each commit covers one change or one feature, never several features together.
- **Run the checks before every commit:** `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`. All of them must pass. In your own worktree, a failure comes from your changes or from `main` itself. If it's yours, fix it. If the same check also fails on a clean `origin/main`, stop and tell the user instead of committing. Skip the checks when a commit only changes Markdown files (such as `TASKS.md` or `AGENTS.md`), since no code runs.
- Run `npm run build` from PowerShell, not Git Bash: in Git Bash on this machine it crashes with error `0xc0000142`.
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
- Tests use [Vitest](https://vitest.dev/). While working, run only the tests you're working on, e.g. `npx vitest run src/__tests__/lib/journals.test.ts` (or `npm run test:watch`), to keep the red-green loop fast. Run the full `npm test` before committing. Keep the `vmThreads` pool in `vitest.config.ts`: the default pools fail to start on this machine with a misleading "Cannot read properties of undefined (reading 'config')" error.
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
