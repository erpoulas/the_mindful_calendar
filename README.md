# The Mindful Calendar

An intention-based calendar and journal app. You set broad life intentions (Health, Family, Creativity...), and projects, calendar events and journal entries count toward them.

The calendar at `/dashboard` is the only real page (`/` redirects there). Every other feature opens as a popup or slide-over on top of it, driven by `?panel=&view=&id=` query params:

- **Intentions** with weekly streak charts, and **Projects** with tasks (pause, resume, complete)
- **Calendar**: week time-grid with drag and drop, month view, new/edit event form with a per-event time zone
- **Journals**, **Quick Lists**, **Dopamine menu**, **Affirmations**
- **Post-its**: a column of notes you can drag onto the calendar
- **Customizable dashboard panels** (drag to reorder), including weekly intention breakdown and weekly review stats
- **Account settings**: time zone, extra time zones beside the hour labels, 12/24-hour time, email and password changes, Google Calendar connection
- **Google Calendar two-way sync**, run each time the dashboard loads

See [project-summary.md](./project-summary.md) for the data model and design reasoning (partly stale: the Seasons feature was removed), [TASKS.md](./TASKS.md) for the live checklist, and `wireframes.html` for the original wireframe. AI agents working in this repo should read [AGENTS.md](./AGENTS.md).

## Stack

- **Next.js 16** (App Router) and **React 19**: frontend and backend in one project, using server actions
- **TypeScript**, **Tailwind CSS 4**, **shadcn/ui** on `@base-ui/react`, lucide icons
- **dnd-kit**: drag and drop
- **Zod**: input validation
- **Prisma 7**: type-safe database client (generated into `generated/prisma`)
- **Supabase**: hosted Postgres and sign-in (Supabase Auth)
- **Vitest** + React Testing Library: tests (TDD: tests are written before implementation)

## First-time setup

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` (the `postinstall` script), which builds the Prisma client into `generated/prisma`.

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project. Save the database password you set; you'll need it below.
2. In the project security settings: leave **Enable Data API** off (app data is read and written directly through Prisma, not Supabase's auto-generated REST API), and leave **Enable automatic RLS** on (a free safety net that doesn't affect Prisma). Sign-in works either way; it's a separate service.
3. Once the project is ready, open **Connect** on the project dashboard and copy two connection strings:
   - **Direct connection** (port `5432`): used for running migrations
   - **Transaction pooler** (port `6543`): used by the running app and the tests, since serverless deployments open many short-lived connections and the pooler shares a small pool across them
4. Under **Project Settings > Data API**, copy the **Project URL** and **publishable key**, used for sign-in.
5. Under **Authentication > URL Configuration > Redirect URLs**, add `http://localhost:3000/auth/confirm` so password-reset emails link back to the app.

### 3. Configure environment variables

Copy the template and fill in your real values:

```bash
cp .env.example .env
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Supabase direct connection (migrations) |
| `DATABASE_URL_POOLED` | Supabase transaction pooler (the app and tests) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | This app's own URL, used to build password-reset links (`http://localhost:3000` locally) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Optional. Google OAuth client for Calendar sync (see below) |

`.env` is gitignored. Never commit it.

### 4. Run the database migrations

```bash
npx prisma migrate dev
```

This creates all the tables in your Supabase database from `prisma/schema.prisma`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be sent to the login page; sign up to create an account.

**Demo mode:** start the server with `SKIP_LOGIN=true` to browse the UI without signing in. Everything is saved under one shared `demo-user`, so use it only locally.

### Optional: Google Calendar sync

1. In Google Cloud Console, enable the Google Calendar API and create an OAuth client of type **Web application** (**APIs & Services > Credentials**).
2. Add `http://localhost:3000/auth/google/callback` under that client's **Authorized redirect URIs**.
3. Put the client ID, secret and redirect URI in `.env`.
4. In the app, open **Account settings** and connect your Google account.

Without these variables the app works normally; Google sync is simply unavailable.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm start            # run the production build
npm run lint         # ESLint
npm test             # run the tests once
npm run test:watch   # re-run tests as files change
npx tsc --noEmit     # type-check
```

## Testing

Tests live in `src/__tests__/`, mirroring the source layout (for example `src/lib/post-its.ts` is tested by `src/__tests__/lib/post-its.test.ts`).

Data-access tests run against the real database (so `.env` must be set up). Each one is wrapped in `withRollback` from `src/test/withRollback.ts`, which runs the test inside a transaction and rolls it back afterwards, so no test data is left behind.

Vitest uses the `vmThreads` pool (see `vitest.config.ts`), because the default pools fail to start on this machine.

## Project layout

```
src/
  app/
    dashboard/          the calendar page, panels and popups (overlays/)
    actions/            server actions, one file per feature
    login/ signup/ forgot-password/ reset-password/   sign-in pages
    auth/               password-reset confirm and Google OAuth routes
  lib/
    <feature>.ts            data access for each feature
    <feature>-schemas.ts    Zod schemas for each feature
    calendar-week.ts, streak.ts, wall-clock.ts, ...   pure helpers
    db.ts                   Prisma client
    supabase/               Supabase clients and session handling
  components/ui/        shared building blocks (sheet.tsx is the popup every panel uses)
  __tests__/            tests
  test/withRollback.ts  real-database test helper
prisma/
  schema.prisma         database tables
  migrations/           migration history
public/panel-art/       decorative art for each panel
```

## Database changes

After editing `prisma/schema.prisma`, create a migration:

```bash
npx prisma migrate dev --name <describe-the-change>
```

## A note on times

Calendar event times are stored as **wall-clock times in UTC fields**: an event at 9:00am is saved as `09:00Z` wherever the user lives. Use the helpers in `src/lib/wall-clock.ts` to convert between "now" or a real moment and a stored event time. [AGENTS.md](./AGENTS.md) has the full rules.
