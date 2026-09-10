import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { quickAddEventAction } from "@/app/actions/calendar-events";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { getTodayAffirmation } from "@/lib/affirmations";
import { listCalendarEvents } from "@/lib/calendar-events";
import { getWeekRange } from "@/lib/calendar-week";
import { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "@/lib/dashboard";
import { getHiddenPanels } from "@/lib/dashboard-preferences";
import { db } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { countOpenQuickListItems } from "@/lib/quick-lists";
import { listSeasons } from "@/lib/seasons";
import { PanelCustomizer } from "./panel-customizer";
import {
  AffirmationPanel,
  DopaminePanel,
  IntentionBreakdownPanel,
  JournalPanel,
  ProjectsPanel,
  QuickListPanel,
  SeasonPanel,
  WeeklyReviewPanel,
} from "./panels";
import { TimeGrid } from "./time-grid";

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pickCurrentSeason(seasons: Awaited<ReturnType<typeof listSeasons>>) {
  if (seasons.length === 0) return null;
  const now = new Date();
  const current = seasons.find(
    (season) =>
      season.startDate && season.endDate && season.startDate <= now && now < season.endDate,
  );
  return current ?? seasons[seasons.length - 1];
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { start: startParam } = await searchParams;
  const userId = await getCurrentUserId();

  const referenceDate =
    typeof startParam === "string" ? new Date(startParam) : new Date();
  const { start, end } = getWeekRange(referenceDate);

  const [
    events,
    affirmation,
    seasons,
    breakdown,
    projects,
    openQuickListCount,
    reviewStats,
    hiddenPanels,
  ] = await Promise.all([
    listCalendarEvents(db, { userId, start, end }),
    getTodayAffirmation(db, userId),
    listSeasons(db, userId),
    getWeeklyIntentionBreakdown(db, { userId, referenceDate }),
    listProjects(db, userId),
    countOpenQuickListItems(db, userId),
    getWeeklyReviewStats(db, { userId, referenceDate }),
    getHiddenPanels(db, userId),
  ]);

  const currentSeason = pickCurrentSeason(seasons);
  const activeProjectCount = projects.filter((project) => project.status === "ACTIVE").length;

  const allDayEvents = events.filter((event) => event.isAllDay);
  const timedEvents = events
    .filter((event) => !event.isAllDay && event.startAt)
    .map((event) => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt!,
      endAt: event.endAt,
    }));

  const prevWeekStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeekStart = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const panelComponents: Record<string, React.ReactNode> = {
    affirmation: <AffirmationPanel affirmation={affirmation} />,
    season: <SeasonPanel season={currentSeason} />,
    breakdown: <IntentionBreakdownPanel breakdown={breakdown} />,
    projects: <ProjectsPanel activeCount={activeProjectCount} />,
    quicklist: <QuickListPanel openCount={openQuickListCount} />,
    journal: <JournalPanel />,
    dopamine: <DopaminePanel />,
    review: <WeeklyReviewPanel stats={reviewStats} />,
  };
  const visiblePanelKeys = Object.keys(panelComponents).filter(
    (key) => !hiddenPanels.includes(key),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/intentions" className="underline">
            Intentions
          </Link>
          <Link href="/projects" className="underline">
            Projects
          </Link>
          <Link href="/seasons" className="underline">
            Seasons
          </Link>
          <Link href="/quicklists" className="underline">
            Quick Lists
          </Link>
          <Link href="/journals" className="underline">
            Journals
          </Link>
          <Link href="/dopamine-menu" className="underline">
            Dopamine Menu
          </Link>
          <Link href="/affirmations" className="underline">
            Affirmations
          </Link>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[16rem_1fr]">
        <div>
          <PanelCustomizer hiddenPanels={hiddenPanels}>
            {visiblePanelKeys.map((key) => (
              <div key={key}>{panelComponents[key]}</div>
            ))}
          </PanelCustomizer>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">This week</h1>
            <div className="flex gap-2">
              <Link href="/calendar/month" className={buttonVariants({ variant: "outline" })}>
                Month view
              </Link>
              <Link href="/calendar/new" className={buttonVariants()}>
                New event
              </Link>
            </div>
          </div>

          <form action={quickAddEventAction} className="flex gap-2">
            <Input name="title" placeholder="Quick add: type a title and press Enter" required />
            <Button type="submit">Add</Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link href={`/dashboard?start=${toDateParam(prevWeekStart)}`} className="underline">
              ← Previous week
            </Link>
            <Link href={`/dashboard?start=${toDateParam(nextWeekStart)}`} className="underline">
              Next week →
            </Link>
          </div>

          {allDayEvents.length > 0 && (
            <div className="rounded border p-2">
              <h2 className="text-xs font-medium text-zinc-500">All day</h2>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {allDayEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/calendar/${event.id}/edit`}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-xs hover:bg-zinc-200"
                    >
                      {event.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded border p-2">
            <TimeGrid weekStart={start} events={timedEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
