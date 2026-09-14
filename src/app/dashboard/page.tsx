import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { getTodayAffirmation } from "@/lib/affirmations";
import { listCalendarEvents } from "@/lib/calendar-events";
import { getWeekRange } from "@/lib/calendar-week";
import { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "@/lib/dashboard";
import { getHiddenPanels } from "@/lib/dashboard-preferences";
import { db } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { countOpenQuickListItems } from "@/lib/quick-lists";
import { getMonthGrid } from "@/lib/calendar-month";
import { AffirmationsView } from "./overlays/affirmations";
import { EditEventView, NewEventView } from "./overlays/calendar-event";
import { DopamineMenuView } from "./overlays/dopamine-menu";
import { MonthGrid } from "./month-grid";
import { PanelCustomizer } from "./panel-customizer";
import { PanelSheet } from "./panel-sheet";
import {
  AffirmationPanel,
  DopaminePanel,
  IntentionBreakdownPanel,
  JournalPanel,
  ProjectsPanel,
  QuickListPanel,
  WeeklyReviewPanel,
} from "./panels";
import { TimeGrid } from "./time-grid";

const MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function toDateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const {
    start: startParam,
    mode: modeParam,
    panel: panelParam,
    view: viewParam,
    id: idParam,
    date: dateParam,
    title: titleParam,
    postItId: postItIdParam,
  } = await searchParams;
  const userId = await getCurrentUserId();
  const panel = typeof panelParam === "string" ? panelParam : null;
  const view = typeof viewParam === "string" ? viewParam : null;
  const id = typeof idParam === "string" ? idParam : null;
  const date = typeof dateParam === "string" ? dateParam : undefined;
  const title = typeof titleParam === "string" ? titleParam : undefined;
  const postItId = typeof postItIdParam === "string" ? postItIdParam : undefined;
  const mode = modeParam === "month" ? "month" : "week";

  const referenceDate =
    typeof startParam === "string" ? new Date(startParam) : new Date();

  const [affirmation, breakdown, projects, openQuickListCount, reviewStats, hiddenPanels] =
    await Promise.all([
      getTodayAffirmation(db, userId),
      getWeeklyIntentionBreakdown(db, { userId, referenceDate }),
      listProjects(db, userId),
      countOpenQuickListItems(db, userId),
      getWeeklyReviewStats(db, { userId, referenceDate }),
      getHiddenPanels(db, userId),
    ]);

  const activeProjectCount = projects.filter((project) => project.status === "ACTIVE").length;

  let headerLabel: string;
  let prevHref: string;
  let nextHref: string;
  let calendarBody: React.ReactNode;

  if (mode === "month") {
    const { monthStart, gridStart, gridEnd } = getMonthGrid(referenceDate);
    const monthEvents = await listCalendarEvents(db, { userId, start: gridStart, end: gridEnd });

    const prevMonthRef = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
    );
    const nextMonthRef = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );

    headerLabel = monthStart.toLocaleDateString(undefined, MONTH_FORMAT);
    prevHref = `/dashboard?mode=month&start=${toDateParam(prevMonthRef)}`;
    nextHref = `/dashboard?mode=month&start=${toDateParam(nextMonthRef)}`;
    calendarBody = <MonthGrid referenceDate={referenceDate} events={monthEvents} />;
  } else {
    const { start, end } = getWeekRange(referenceDate);
    const events = await listCalendarEvents(db, { userId, start, end });

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

    headerLabel = "This week";
    prevHref = `/dashboard?start=${toDateParam(prevWeekStart)}`;
    nextHref = `/dashboard?start=${toDateParam(nextWeekStart)}`;
    calendarBody = (
      <>
        {allDayEvents.length > 0 && (
          <div className="rounded border p-2">
            <h2 className="text-xs font-medium text-zinc-500">All day</h2>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {allDayEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard?panel=calendar-event&view=edit&id=${event.id}`}
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
      </>
    );
  }

  const panelComponents: Record<string, React.ReactNode> = {
    affirmation: <AffirmationPanel affirmation={affirmation} />,
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

  let panelTitle = "";
  let panelContent: React.ReactNode = null;
  if (panel === "dopamine-menu") {
    panelTitle = "Dopamine Menu";
    panelContent = <DopamineMenuView />;
  } else if (panel === "affirmations") {
    panelTitle = "Affirmations";
    panelContent = <AffirmationsView />;
  } else if (panel === "calendar-event") {
    if (view === "edit" && id) {
      panelTitle = "Edit event";
      panelContent = <EditEventView id={id} />;
    } else {
      panelTitle = "New event";
      panelContent = <NewEventView date={date} title={title} postItId={postItId} />;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex items-center justify-end border-b pb-3">
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
            <h1 className="text-2xl font-semibold">{headerLabel}</h1>
            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded border text-sm">
                <Link
                  href={`/dashboard?start=${toDateParam(referenceDate)}`}
                  className={`px-3 py-1 ${mode === "week" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"}`}
                >
                  Week
                </Link>
                <Link
                  href={`/dashboard?mode=month&start=${toDateParam(referenceDate)}`}
                  className={`px-3 py-1 ${mode === "month" ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"}`}
                >
                  Month
                </Link>
              </div>
              <Link href="/dashboard?panel=calendar-event&view=new" className={buttonVariants()}>
                New event
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href={prevHref} className="underline">
              ← Previous {mode === "month" ? "month" : "week"}
            </Link>
            <Link href={nextHref} className="underline">
              Next {mode === "month" ? "month" : "week"} →
            </Link>
          </div>

          {calendarBody}
        </div>
      </div>

      <PanelSheet open={panel !== null} title={panelTitle}>
        {panelContent}
      </PanelSheet>
    </div>
  );
}
