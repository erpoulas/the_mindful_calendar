import { listAffirmations } from "./affirmations";
import { getCalendarEvent, listCalendarEvents } from "./calendar-events";
import { getWeeklyReviewStats } from "./dashboard";
import { getDashboardPreferences } from "./dashboard-preferences";
import { db } from "./db";
import { listDopamineMenuItems } from "./dopamine-menu";
import { listIntentions } from "./intentions";
import { getJournalDetail, listJournals } from "./journals";
import { listPostIts } from "./post-its";
import { getProjectDetail, listProjects } from "./projects";
import { getQuickListDetail, listQuickLists } from "./quick-lists";
import { storedRead } from "./stored-results";
import { getUserSettings, getUserTimezoneWithFallback } from "./user-settings";

// The reads the dashboard and its popups repeat on every visit, each stored
// per user (see stored-results.ts). The second argument lists every area of
// data the read uses, so a save to any of them throws the copy away.
//
// Left out on purpose:
// - Random picks (today's affirmation, a journal prompt, a dopamine-menu
//   item): storing them would freeze the pick.
// - The Google connection: it holds sign-in tokens, which shouldn't be
//   copied into a cache.
// - An intention's streak chart: it counts back from this exact moment.

export const storedSettings = storedRead("userSettings", ["settings"], (userId) =>
  getUserSettings(db, userId),
);

export const storedTimezone = storedRead("timezone", ["settings"], (userId) =>
  getUserTimezoneWithFallback(db, userId),
);

export const storedDashboardPreferences = storedRead("dashboardPreferences", ["preferences"], (userId) =>
  getDashboardPreferences(db, userId),
);

export const storedPostIts = storedRead("postIts", ["postIts"], (userId) => listPostIts(db, userId));

/** Events between two moments, with their intentions' colors. */
export const storedCalendarEvents = storedRead(
  "calendarEvents",
  ["events", "intentions"],
  (userId, start: Date, end: Date) => listCalendarEvents(db, { userId, start, end }),
);

export const storedCalendarEvent = storedRead("calendarEvent", ["events"], (userId, eventId: string) =>
  getCalendarEvent(db, { userId, eventId }),
);

/** Pass the week's first day, so every moment of the week shares one copy. */
export const storedWeeklyReviewStats = storedRead(
  "weeklyReviewStats",
  ["events", "intentions", "projects", "quickLists"],
  (userId, weekStart: Date) => getWeeklyReviewStats(db, { userId, referenceDate: weekStart }),
);

export const storedIntentions = storedRead("intentions", ["intentions"], (userId) =>
  listIntentions(db, userId),
);

export const storedProjects = storedRead("projects", ["projects"], (userId) => listProjects(db, userId));

export const storedProjectDetail = storedRead(
  "projectDetail",
  ["projects", "intentions"],
  (userId, projectId: string) => getProjectDetail(db, { userId, projectId }),
);

export const storedQuickLists = storedRead("quickLists", ["quickLists"], (userId) =>
  listQuickLists(db, userId),
);

export const storedQuickListDetail = storedRead(
  "quickListDetail",
  ["quickLists"],
  (userId, quickListId: string) => getQuickListDetail(db, { userId, quickListId }),
);

export const storedJournals = storedRead("journals", ["journals"], (userId) => listJournals(db, userId));

export const storedJournalDetail = storedRead("journalDetail", ["journals"], (userId, journalId: string) =>
  getJournalDetail(db, { userId, journalId }),
);

export const storedAffirmations = storedRead("affirmations", ["affirmations"], (userId) =>
  listAffirmations(db, userId),
);

export const storedDopamineMenuItems = storedRead("dopamineMenuItems", ["dopamineMenu"], (userId) =>
  listDopamineMenuItems(db, userId),
);
