import Link from "next/link";
import Image from "next/image";
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
import { AccountSettingsView } from "./overlays/account-settings";
import { AffirmationsView } from "./overlays/affirmations";
import { EditEventView, NewEventView } from "./overlays/calendar-event";
import { DopamineMenuView } from "./overlays/dopamine-menu";
import { QuickListCreateView, QuickListEditView, QuickListsView } from "./overlays/quick-lists";
import { IntentionDetailView, IntentionEditView, IntentionsListView } from "./overlays/intentions";
import {
  JournalCreateView,
  JournalDetailView,
  JournalEditView,
  JournalEntryEditView,
  JournalsListView,
} from "./overlays/journals";
import {
  ProjectCreateView,
  ProjectDetailView,
  ProjectEditView,
  ProjectsListView,
} from "./overlays/projects";
import { CalendarDndProvider } from "./calendar-dnd";
import { DashboardShell } from "./dashboard-shell";
import { MonthGrid } from "./month-grid";
import { PanelCustomizer } from "./panel-customizer";
import { PanelSheet } from "./panel-sheet";
import { PostItColumn } from "./post-it-column";
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
    entryId: entryIdParam,
  } = await searchParams;
  const userId = await getCurrentUserId();
  const panel = typeof panelParam === "string" ? panelParam : null;
  const view = typeof viewParam === "string" ? viewParam : null;
  const id = typeof idParam === "string" ? idParam : null;
  const date = typeof dateParam === "string" ? dateParam : undefined;
  const title = typeof titleParam === "string" ? titleParam : undefined;
  const postItId = typeof postItIdParam === "string" ? postItIdParam : undefined;
  const entryId = typeof entryIdParam === "string" ? entryIdParam : null;
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
  let allDayRow: React.ReactNode = null;
  let calendarBody: React.ReactNode;
  let calendarBodyPadded = false;
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

    headerLabel = start.toLocaleDateString(undefined, MONTH_FORMAT);
    prevHref = `/dashboard?start=${toDateParam(prevWeekStart)}`;
    nextHref = `/dashboard?start=${toDateParam(nextWeekStart)}`;
    dndEvents = timedEvents;
    calendarBodyPadded = true;
    if (allDayEvents.length > 0) {
      allDayRow = (
        <div className="relative z-10 mx-4 shrink-0 rounded border border-border bg-background p-2">
          <h2 className="text-xs font-medium text-muted-foreground">All day</h2>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {allDayEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/dashboard?panel=calendar-event&view=edit&id=${event.id}`}
                  className="rounded bg-accent px-2 py-0.5 text-xs hover:bg-secondary"
                >
                  {event.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    calendarBody = <TimeGrid weekStart={start} events={timedEvents} />;
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
  let panelBackground:
    | { src: string; width: number; height: number; contentInsetClassName?: string }
    | undefined;
  if (panel === "account") {
    panelTitle = "Account settings";
    panelContent = <AccountSettingsView />;
  } else if (panel === "dopamine-menu") {
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
    panelSize = "center";
    panelBackground = {
      src: "/panel-art/quick-notes-pop-up.png",
      width: 614,
      height: 996,
      // This photo has a clip along the top edge and punch holes down the
      // left, instead of a plain left-edge binding like the journal/project
      // photos, so it needs clearance on both sides.
      contentInsetClassName: "pt-[20%] pl-[16%]",
    };
    if (view === "edit" && id) {
      panelTitle = "Edit list";
      panelContent = <QuickListEditView id={id} />;
    } else if (view === "create") {
      panelTitle = "New list";
      panelContent = <QuickListCreateView />;
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
    panelBackground = { src: "/panel-art/project-tracker-side-popup.png", width: 863, height: 1108 };
    if (view === "edit" && id) {
      panelTitle = "Edit project";
      panelContent = <ProjectEditView id={id} />;
    } else if (view === "detail" && id) {
      panelTitle = "Project";
      panelContent = <ProjectDetailView id={id} />;
    } else if (view === "create") {
      panelTitle = "New project";
      panelContent = <ProjectCreateView />;
    } else {
      panelTitle = "Projects";
      panelContent = <ProjectsListView />;
    }
  } else if (panel === "journals") {
    panelBackground = { src: "/panel-art/side-popup-journal.png", width: 818, height: 1099 };
    if (view === "entry-edit" && id && entryId) {
      panelTitle = "Entry";
      panelContent = <JournalEntryEditView id={id} entryId={entryId} />;
    } else if (view === "edit" && id) {
      panelTitle = "Edit journal";
      panelContent = <JournalEditView id={id} />;
    } else if (view === "detail" && id) {
      panelTitle = "Journal";
      panelContent = <JournalDetailView id={id} />;
    } else if (view === "create") {
      panelTitle = "New journal";
      panelContent = <JournalCreateView />;
    } else {
      panelTitle = "Journals";
      panelContent = <JournalsListView />;
    }
  } else if (panel === "postits") {
    panelTitle = "Post-its";
    panelSize = "wide";
    panelContent = <PostItColumn postIts={postIts} />;
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b p-4 pb-3">
        <Link href="/dashboard?panel=account" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Account settings
        </Link>
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
          postIts={<PostItColumn postIts={postIts} capped />}
        >
          <div className="isolate relative flex min-h-0 flex-1 flex-col overflow-hidden rounded">
            <Image
              src="/panel-art/gradient-wash.png"
              alt=""
              fill
              priority
              aria-hidden
              sizes="40rem"
              className="pointer-events-none z-0 object-cover object-left-top opacity-70 [mask-image:radial-gradient(circle_at_20%_20%,black_0%,transparent_85%)]"
            />

            <div className="relative z-10 flex shrink-0 items-center justify-between p-4 pb-2">
              <h1 className="flex items-center gap-2 font-heading text-4xl tracking-wide uppercase">
                {headerLabel}
                <Image src="/panel-art/decorative-star.png" alt="" width={20} height={20} />
                <Image src="/panel-art/decorative-star.png" alt="" width={20} height={20} />
              </h1>
              <div className="flex gap-2">
                <div className="flex overflow-hidden rounded border border-border text-sm">
                  <Link
                    href={`/dashboard?start=${toDateParam(referenceDate)}`}
                    className={`px-3 py-1 ${mode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    Week
                  </Link>
                  <Link
                    href={`/dashboard?mode=month&start=${toDateParam(referenceDate)}`}
                    className={`px-3 py-1 ${mode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    Month
                  </Link>
                </div>
                <Link href="/dashboard?panel=calendar-event&view=new" className={buttonVariants()}>
                  New event
                </Link>
              </div>
            </div>

            <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-3 text-sm">
              <Link href={prevHref} className="underline">
                ← Previous {mode === "month" ? "month" : "week"}
              </Link>
              <Link href={nextHref} className="underline">
                Next {mode === "month" ? "month" : "week"} →
              </Link>
            </div>

            {allDayRow}

            <div
              className={`relative z-10 mx-4 mb-4 min-h-0 flex-1 overflow-auto rounded border border-border ${calendarBodyPadded ? "p-2" : ""}`}
            >
              {calendarBody}
            </div>
          </div>
        </DashboardShell>

        {/* Inside CalendarDndProvider, not a sibling of it, so drag-and-drop
            still works for post-its rendered in the "+N more" pop-out
            (the panel=postits case above) — dnd-kit's DndContext is a React
            context, so it must be an ancestor in the element tree even
            though the Drawer's own content renders through a portal. */}
        <PanelSheet
          key={panel}
          open={panel !== null}
          title={panelTitle}
          size={panelSize}
          backgroundImage={panelBackground}
        >
          {panelContent}
        </PanelSheet>
      </CalendarDndProvider>
    </div>
  );
}
