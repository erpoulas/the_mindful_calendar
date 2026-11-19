import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { logout } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { getTodayAffirmation } from "@/lib/affirmations";
import { listCalendarEvents } from "@/lib/calendar-events";
import { getWeekRange } from "@/lib/calendar-week";
import { getWeeklyReviewStats } from "@/lib/dashboard";
import { getHiddenPanels, getPanelOrder, sortPanelKeys } from "@/lib/dashboard-preferences";
import { db } from "@/lib/db";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { getGoogleConnection } from "@/lib/google-connections";
import { listPostIts } from "@/lib/post-its";
import { getMonthGrid } from "@/lib/calendar-month";
import { getCalendarDisplaySettings, getUserTimezone } from "@/lib/user-settings";
import { buildHourLabelColumns } from "@/lib/hour-labels";
import { toWallClockDate } from "@/lib/wall-clock";
import { AccountSettingsView } from "./overlays/account-settings";
import { AffirmationsView } from "./overlays/affirmations";
import { IntentionDetailView, IntentionEditView, IntentionsListView } from "./overlays/intentions";
import {
  ProjectCreateView,
  ProjectDetailView,
  ProjectEditView,
  ProjectsListView,
} from "./overlays/projects";
import { CalendarDndProvider } from "./calendar-dnd";
import { DashboardShell } from "./dashboard-shell";
import { GoogleCalendarSync } from "./google-calendar-sync";
import { GOOGLE_BANNER_DISMISSED_COOKIE, GoogleConnectBanner } from "./google-connect-banner";
import { MonthGrid } from "./month-grid";
import { PanelCustomizerControls, PanelList, SortablePanel } from "./panel-customizer";
import { PanelSheet } from "./panel-sheet";
import { PostItColumn } from "./post-it-column";
import { SaveBrowserTimezone } from "./save-browser-timezone";
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
    google: googleParam,
  } = await searchParams;
  const userId = await getCurrentUserId();
  const panel = typeof panelParam === "string" ? panelParam : null;
  const view = typeof viewParam === "string" ? viewParam : null;
  const id = typeof idParam === "string" ? idParam : null;
  const mode = modeParam === "month" ? "month" : "week";

  // Events are stored as wall-clock times, so "today" must be today in the
  // user's saved timezone, not in UTC. With none saved yet, the browser's
  // zone is saved on first load (SaveBrowserTimezone) and the page re-renders.
  const savedTimeZone = await getUserTimezone(db, userId);
  const timeZone = savedTimeZone ?? "UTC";
  const referenceDate =
    typeof startParam === "string"
      ? new Date(startParam)
      : toWallClockDate(new Date(), timeZone);

  const { gridStart, gridEnd } = getMonthGrid(referenceDate);
  const visibleRange =
    mode === "month" ? { start: gridStart, end: gridEnd } : getWeekRange(referenceDate);

  // Every query at once: this page re-renders on every popup click, so each
  // query waited on in turn would add its own trip to the database.
  const [
    affirmation,
    reviewStats,
    hiddenPanels,
    panelOrder,
    postIts,
    googleConnection,
    cookieStore,
    events,
    displaySettings,
  ] = await Promise.all([
    getTodayAffirmation(db, userId, timeZone),
    // Also holds the intention breakdown, so it isn't fetched a second time.
    getWeeklyReviewStats(db, { userId, referenceDate }),
    getHiddenPanels(db, userId),
    getPanelOrder(db, userId),
    listPostIts(db, userId),
    getGoogleConnection(db, userId),
    cookies(),
    listCalendarEvents(db, { userId, ...visibleRange }),
    getCalendarDisplaySettings(db, userId),
  ]);

  // Changes whenever an event on screen is added, edited or deleted, which
  // tells GoogleCalendarSync to send the change to Google.
  const eventsVersion = `${events.length}-${Math.max(0, ...events.map((event) => event.updatedAt.getTime()))}`;

  // Only nudge when connecting would actually work (the Google env vars are
  // set) and the user hasn't already closed the banner.
  const showGoogleBanner =
    googleConnection === null &&
    isGoogleCalendarConfigured() &&
    !cookieStore.has(GOOGLE_BANNER_DISMISSED_COOKIE);

  let headerLabel: string;
  let prevHref: string;
  let nextHref: string;
  let calendarBody: React.ReactNode;
  let calendarBodyPadded = false;
  let dndEvents: TimeGridEvent[] = [];

  if (mode === "month") {
    const { monthStart } = getMonthGrid(referenceDate);

    const prevMonthRef = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
    );
    const nextMonthRef = new Date(
      Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
    );

    headerLabel = monthStart.toLocaleDateString(undefined, MONTH_FORMAT);
    prevHref = `/dashboard?mode=month&start=${toDateParam(prevMonthRef)}`;
    nextHref = `/dashboard?mode=month&start=${toDateParam(nextMonthRef)}`;
    calendarBody = <MonthGrid referenceDate={referenceDate} events={events} />;
  } else {
    const { start } = visibleRange;
    const toTimeGridEvent = (event: (typeof events)[number]): TimeGridEvent => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt!,
      endAt: event.endAt,
    });
    const datedEvents = events.filter((event) => event.startAt);
    const allDayEvents = datedEvents.filter((event) => event.isAllDay).map(toTimeGridEvent);
    const timedEvents = datedEvents.filter((event) => !event.isAllDay).map(toTimeGridEvent);

    const prevWeekStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeekStart = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    headerLabel = start.toLocaleDateString(undefined, MONTH_FORMAT);
    prevHref = `/dashboard?start=${toDateParam(prevWeekStart)}`;
    nextHref = `/dashboard?start=${toDateParam(nextWeekStart)}`;
    dndEvents = timedEvents;
    calendarBodyPadded = true;
    const { extraTimezones, use24HourClock } = displaySettings;
    const hourLabelColumns = buildHourLabelColumns({
      day: start,
      timeZone,
      extraTimeZones: extraTimezones,
      use24HourClock,
    });
    calendarBody = (
      <TimeGrid
        weekStart={start}
        events={timedEvents}
        allDayEvents={allDayEvents}
        hourLabelColumns={hourLabelColumns}
      />
    );
  }

  const panelComponents: Record<string, React.ReactNode> = {
    affirmation: <AffirmationPanel affirmation={affirmation} />,
    breakdown: <IntentionBreakdownPanel breakdown={reviewStats.intentionBreakdown} />,
    projects: <ProjectsPanel />,
    quicklist: <QuickListPanel />,
    journal: <JournalPanel />,
    dopamine: <DopaminePanel />,
    review: <WeeklyReviewPanel stats={reviewStats} />,
  };
  const orderedPanelKeys = sortPanelKeys(Object.keys(panelComponents), panelOrder);
  const visiblePanelKeys = orderedPanelKeys.filter((key) => !hiddenPanels.includes(key));

  let panelTitle = "";
  let panelContent: React.ReactNode = null;
  let panelSize: "side" | "wide" | "center" = "side";
  let panelBackground:
    | { src: string; width: number; height: number; contentInsetClassName?: string }
    | undefined;
  if (panel === "account") {
    panelTitle = "Account settings";
    panelContent = (
      <AccountSettingsView
        googleOutcome={typeof googleParam === "string" ? googleParam : undefined}
      />
    );
  } else if (panel === "affirmations") {
    panelTitle = "Affirmations";
    panelContent = <AffirmationsView />;
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
  } else if (panel === "postits") {
    panelTitle = "Post-its";
    panelSize = "wide";
    panelContent = <PostItColumn postIts={postIts} />;
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-clip">
      {savedTimeZone === null && <SaveBrowserTimezone />}
      {googleConnection && (
        <GoogleCalendarSync
          start={visibleRange.start.toISOString()}
          end={visibleRange.end.toISOString()}
          eventsVersion={eventsVersion}
        />
      )}
      {showGoogleBanner && <GoogleConnectBanner />}
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

      <CalendarDndProvider
        events={dndEvents}
        postItIds={postIts.map((postIt) => postIt.id)}
        panelKeys={visiblePanelKeys}
        hiddenPanels={hiddenPanels}
      >
        <DashboardShell
          sidebar={
            <PanelList panelKeys={visiblePanelKeys}>
              {visiblePanelKeys.map((key) => (
                <SortablePanel key={key} panelKey={key}>
                  {panelComponents[key]}
                </SortablePanel>
              ))}
            </PanelList>
          }
          postIts={<PostItColumn postIts={postIts} capped />}
        >
          <div className="isolate relative flex min-h-0 flex-1 flex-col overflow-clip rounded">
            <Image
              src="/panel-art/gradient-wash.png"
              alt=""
              fill
              priority
              aria-hidden
              sizes="40rem"
              className="pointer-events-none z-0 translate-y-[7%] object-cover object-center opacity-70 [mask-image:radial-gradient(circle_at_50%_50%,black_0%,transparent_85%)]"
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
                <Link href={dashboardRoutes.newEvent()} className={buttonVariants()}>
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

            <div
              data-calendar-scroll
              className={`relative z-10 mx-4 mb-2 min-h-0 flex-1 overflow-auto rounded border border-border ${calendarBodyPadded ? "px-2 pb-2" : ""}`}
            >
              {calendarBody}
            </div>

            <div className="relative z-10 mx-4 mb-2 shrink-0">
              <PanelCustomizerControls hiddenPanels={hiddenPanels} />
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
