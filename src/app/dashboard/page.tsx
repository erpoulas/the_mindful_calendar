import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { logout } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { getTodayAffirmation } from "@/lib/affirmations";
import { getWeekRange } from "@/lib/calendar-week";
import { sortPanelKeys } from "@/lib/dashboard-preferences";
import { db } from "@/lib/db";
import { calendarEventHref, dashboardRoutes } from "@/lib/dashboard-routes";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { getGoogleConnection } from "@/lib/google-connections";
import { getMonthGrid } from "@/lib/calendar-month";
import {
  storedCalendarEvents,
  storedDashboardPreferences,
  storedJournalSchedules,
  storedPostIts,
  storedSettings,
  storedWeeklyReviewStats,
} from "@/lib/stored-reads";
import { buildHourLabelColumns } from "@/lib/hour-labels";
import { eventColor } from "@/lib/intention-colors";
import { journalTimeOccurrences, toJournalTimeSchedule } from "@/lib/journal-time";
import { toWallClockDate } from "@/lib/wall-clock";
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
  } = await searchParams;
  const userId = await getCurrentUserId();
  const showPostIts = panelParam === "postits";
  const mode = modeParam === "month" ? "month" : "week";

  // Started before waiting on the timezone below, since they don't need it,
  // so the timezone lookup doesn't add a trip to the database in front of
  // them. The empty catch only stops an early failure from counting as
  // "unhandled" while the timezone loads; awaiting it below still throws.
  const timezoneFreeQueries = Promise.all([
    storedDashboardPreferences(userId),
    storedPostIts(userId),
    getGoogleConnection(db, userId),
    cookies(),
    storedJournalSchedules(userId),
  ]);
  timezoneFreeQueries.catch(() => {});

  // Events are stored as wall-clock times, so "today" must be today in the
  // user's saved timezone, not in UTC. With none saved yet, the browser's
  // zone is saved on first load (SaveBrowserTimezone) and the page re-renders.
  // One read gives both the timezone and the calendar display settings.
  const { timezone: savedTimeZone, ...displaySettings } = await storedSettings(userId);
  const timeZone = savedTimeZone ?? "UTC";
  const referenceDate =
    typeof startParam === "string"
      ? new Date(startParam)
      : toWallClockDate(new Date(), timeZone);

  const { gridStart, gridEnd } = getMonthGrid(referenceDate);
  const visibleRange =
    mode === "month" ? { start: gridStart, end: gridEnd } : getWeekRange(referenceDate);

  // Every query at once: each query waited on in turn would add its own trip
  // to the database to every page load and week change.
  const [
    affirmation,
    reviewStats,
    events,
    [{ hiddenPanels, panelOrder }, postIts, googleConnection, cookieStore, journalSchedules],
  ] = await Promise.all([
    getTodayAffirmation(db, userId, timeZone),
    // Also holds the intention breakdown, so it isn't fetched a second time.
    // Keyed by the week's first day, so the whole week shares one stored copy.
    storedWeeklyReviewStats(userId, getWeekRange(referenceDate).start),
    storedCalendarEvents(userId, visibleRange.start, visibleRange.end),
    timezoneFreeQueries,
  ]);

  // Each journal's scheduled writing time in the range, worked out from its schedule.
  const journalTimes = journalTimeOccurrences(
    journalSchedules.map((schedule) => toJournalTimeSchedule(schedule, timeZone)),
    visibleRange,
  );

  // Changes whenever an event on screen is added, edited or deleted, or a
  // journal schedule changes, which tells GoogleCalendarSync to send the
  // change to Google.
  const latestEdit = Math.max(
    0,
    ...events.map((event) => event.updatedAt.getTime()),
    ...journalSchedules.map((schedule) => schedule.updatedAt.getTime()),
  );
  const eventsVersion = `${events.length}-${journalSchedules.length}-${latestEdit}`;

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
    const monthEvents = [
      ...events.map((event) => ({ ...event, href: calendarEventHref(event) })),
      ...journalTimes.map((time) => ({
        id: time.id,
        title: time.title,
        startAt: time.startAt,
        intentions: [],
        href: dashboardRoutes.journals(time.journalId),
      })),
    ].sort((a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0));
    calendarBody = <MonthGrid referenceDate={referenceDate} events={monthEvents} />;
  } else {
    const { start } = visibleRange;
    const toTimeGridEvent = (event: (typeof events)[number]): TimeGridEvent => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt!,
      endAt: event.endAt,
      color: eventColor(event.intentions),
      href: calendarEventHref(event),
    });
    const datedEvents = events.filter((event) => event.startAt);
    const allDayEvents = datedEvents.filter((event) => event.isAllDay).map(toTimeGridEvent);
    const timedEvents = datedEvents.filter((event) => !event.isAllDay).map(toTimeGridEvent);
    // Journal times open their journal and can't be dragged (see TimeGridEvent).
    const journalTimeEvents = journalTimes.map(
      (time): TimeGridEvent => ({
        id: time.id,
        title: time.title,
        startAt: time.startAt,
        endAt: time.endAt,
        color: null,
        href: dashboardRoutes.journals(time.journalId),
        movable: false,
      }),
    );

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
        events={[...timedEvents, ...journalTimeEvents]}
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
        <Link href={dashboardRoutes.account()} prefetch className={buttonVariants({ variant: "outline", size: "sm" })}>
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
                  {/* prefetch: switching between week and month shows at once. */}
                  <Link
                    href={`/dashboard?start=${toDateParam(referenceDate)}`}
                    prefetch
                    className={`px-3 py-1 ${mode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    Week
                  </Link>
                  <Link
                    href={`/dashboard?mode=month&start=${toDateParam(referenceDate)}`}
                    prefetch
                    className={`px-3 py-1 ${mode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    Month
                  </Link>
                </div>
                <Link href={dashboardRoutes.newEvent()} prefetch className={buttonVariants()}>
                  New event
                </Link>
              </div>
            </div>

            <div className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-3 text-sm">
              {/* prefetch={true} renders the neighbouring week or month in the
                  background (production only), so stepping through the
                  calendar shows it at once instead of waiting on the server. */}
              <Link href={prevHref} prefetch className="underline">
                ← Previous {mode === "month" ? "month" : "week"}
              </Link>
              {/* No start= in the link: without it the page shows the week or
                  month holding today in the user's saved time zone. */}
              <Link
                href={mode === "month" ? "/dashboard?mode=month" : dashboardRoutes.calendar()}
                prefetch
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Today
              </Link>
              <Link href={nextHref} prefetch className="underline">
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

        {/* The "+N more" post-its pop-out (?panel=postits) is the one popup
            that stays on this page instead of getting its own route under
            @panel: it must sit inside CalendarDndProvider so its post-its
            can still be dragged onto the calendar. dnd-kit's DndContext is
            a React context, so it must be an ancestor in the element tree
            even though the Drawer's own content renders through a portal. */}
        <PanelSheet open={showPostIts} title="Post-its" size="wide">
          {showPostIts && <PostItColumn postIts={postIts} />}
        </PanelSheet>
      </CalendarDndProvider>
    </div>
  );
}
