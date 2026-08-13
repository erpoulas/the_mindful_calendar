# The Mindful Calendar

An intention-based calendar/journal app. See `project-summary.md` for the full data model and design reasoning, and `wireframes.html` for the interactive wireframe.

## Stack

- **Next.js** (App Router) — frontend + backend in one project
- **Prisma** — ORM / type-safe database client
- **Supabase** — hosted Postgres (+ future auth/storage)
- **shadcn/ui** + Tailwind — UI components
- **Vitest** + React Testing Library — testing (TDD: tests are written before implementation)

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project. Save the database password you set — you'll need it below.
2. In project security settings during/after creation: leave **Enable Data API** off (this app talks to Postgres directly via Prisma, not `supabase-js`), and leave **Enable automatic RLS** on (free safety net for any future tables, doesn't affect Prisma's connection).
3. Once the project is provisioned, go to **Connect** on the project dashboard and grab two connection strings:
   - **Direct connection** (port `5432`) — used for running migrations
   - **Transaction pooler** (port `6543`) — used by the running app, since serverless deployments can open many short-lived connections at once and the pooler shares a small pool across them

### 3. Configure environment variables

Copy the template and fill in your real values:

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholders in both `DATABASE_URL` (direct connection) and `DATABASE_URL_POOLED` (transaction pooler) with your actual project host and database password. `.env` is gitignored — never commit it.

### 4. Run the database migration

```bash
npx prisma migrate dev
```

This creates all the tables in your Supabase database from `prisma/schema.prisma`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test        # run once
npm run test:watch   # watch mode
```

This project follows TDD: for any real application logic, a failing test is written first, then the minimum implementation to pass it.

## Database changes

After editing `prisma/schema.prisma`, generate a migration:

```bash
npx prisma migrate dev --name <describe-the-change>
```
