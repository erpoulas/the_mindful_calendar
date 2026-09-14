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
import { listPostIts } from "@/lib/post-its";
import { getMonthGrid } from "@/lib/calendar-month";
import { AffirmationsView } from "./overlays/affirmations";
import { EditEventView, NewEventView } from "./overlays/calendar-event";
import { DopamineMenuView } from "./overlays/dopamine-menu";
import { QuickListEditView, QuickListsView } from "./overlays/quick-lists";
import { IntentionDetailView, IntentionEditView, IntentionsListView } from "./overlays/intentions";
import { ProjectDetailView, ProjectEditView, ProjectsListView } from "./overlays/projects";
import { CalendarDndProvider } from "./calendar-dnd";
import { DashboardShell } from "./dashboard-shell";
import { MonthGrid } from "./month-grid";
import { PanelCustomizer } from "./panel-customizer";
import { PanelSheet } from "./panel-sheet";
import { PostItTray } from "./post-it-tray";
import {
  AffirmationPanel,
  DopaminePanel,
  IntentionBreakdownPanel,
  JournalPanel,
  ProjectsPanel,
  QuickListPanel,
  WeeklyReviewPanel,
} from "./panels";
import { TimeGrid, type TimeGridEvent } from "./time-grid";

const MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

const CALENDAR_HEIGHT_CLASS = "h-[37.5rem]";

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

  const [affirmation, breakdown, projects, openQuickListCount, reviewStats, hiddenPanels, postIts] =
    await Promise.all([
      getTodayAffirmation(db, userId),
      getWeeklyIntentionBreakdown(db, { userId, referenceDate }),
      listProjects(db, userId),
      countOpenQuickListItems(db, userId),
      getWeeklyReviewStats(db, { userId, referenceDate }),
      getHiddenPanels(db, userId),
      listPostIts(db, userId),
    ]);

  const activeProjectCount = projects.filter((project) => project.status === "ACTIVE").length;

  let headerLabel: string;
  let prevHref: string;
  let nextHref: string;
  let calendarBody: React.ReactNode;
  let dndEvents: TimeGridEvent[] = [];

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
    calendarBody = (
      <div className={`${CALENDAR_HEIGHT_CLASS} overflow-hidden rounded border`}>
        <MonthGrid referenceDate={referenceDate} events={monthEvents} />
      </div>
    );
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
    dndEvents = timedEvents;
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

        <div className={`${CALENDAR_HEIGHT_CLASS} overflow-auto rounded border p-2`}>
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
  let panelSize: "side" | "wide" | "center" = "side";
  if (panel === "dopamine-menu") {
    panelTitle = "Dopamine Menu";
    panelContent = <DopamineMenuView />;
  } else if (panel === "affirmations") {
    panelTitle = "Affirmations";
    panelContent = <AffirmationsView />;
  } else if (panel === "calendar-event") {
    panelSize = "center";
    if (view === "edit" && id) {
      panelTitle = "Edit event";
      panelContent = <EditEventView id={id} />;
    } else {
      panelTitle = "New event";
      panelContent = <NewEventView date={date} title={title} postItId={postItId} />;
    }
  } else if (panel === "quicklists") {
    if (view === "edit" && id) {
      panelTitle = "Edit list";
      panelContent = <QuickListEditView id={id} />;
    } else {
      panelTitle = "Quick Lists";
      panelContent = <QuickListsView activeId={id ?? undefined} />;
    }
  } else if (panel === "intentions") {
    if (view === "edit" && id) {
      panelTitle = "Edit intention";
      panelContent = <IntentionEditView id={id} />;
    } else if (view === "detail" && id) {
      panelTitle = "Intention";
      panelContent = <IntentionDetailView id={id} />;
    } else {
      panelTitle = "Intentions";
      panelContent = <IntentionsListView />;
    }
  } else if (panel === "projects") {
    if (view === "edit" && id) {
      panelTitle = "Edit project";
      panelContent = <ProjectEditView id={id} />;
    } else if (view === "detail" && id) {
      panelTitle = "Project";
      panelContent = <ProjectDetailView id={id} />;
    } else {
      panelTitle = "Projects";
      panelContent = <ProjectsListView />;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6 pb-40">
      <div className="flex items-center justify-end border-b pb-3">
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>

      <CalendarDndProvider events={dndEvents}>
        <DashboardShell
          sidebar={
            <PanelCustomizer hiddenPanels={hiddenPanels}>
              {visiblePanelKeys.map((key) => (
                <div key={key}>{panelComponents[key]}</div>
              ))}
            </PanelCustomizer>
          }
        >
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
        </DashboardShell>

        <PostItTray postIts={postIts} />
      </CalendarDndProvider>

      <PanelSheet open={panel !== null} title={panelTitle} size={panelSize}>
        {panelContent}
      </PanelSheet>
    </div>
  );
}
