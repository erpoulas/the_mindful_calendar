// The address of every dashboard popup, in one place so links, redirects
// and the route folders can't drift apart.
//
// Each popup is its own route under /dashboard, rendered into the layout's
// @panel slot (src/app/dashboard/@panel/). Opening one renders only the
// popup: the calendar beside it stays as it is, with no queries re-run.
// Which screen a popup shows (a list, one item, an edit form) stays in the
// query string, for example /dashboard/event?view=edit&id=abc.

type Query = Record<string, string | undefined>;

function withQuery(path: string, query: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export const dashboardRoutes = {
  calendar: () => "/dashboard",
  dopamineMenu: () => "/dashboard/dopamine-menu",

  newEvent: (
    prefill: {
      date?: string;
      title?: string;
      postItId?: string;
      projectId?: string;
      intentionId?: string;
    } = {},
  ) =>
    withQuery("/dashboard/event", { view: "new", ...prefill }),
  editEvent: (id: string) => withQuery("/dashboard/event", { view: "edit", id }),

  // One screen: a tab per journal, opening the chosen one (or the first).
  journals: (activeId?: string) => withQuery("/dashboard/journals", { id: activeId }),

  quickLists: (activeId?: string) => withQuery("/dashboard/quick-lists", { id: activeId }),

  // One screen like Quick Lists: a tab per project, opening the chosen one
  // (or the first). A new project is a blank page under the tabs.
  projects: (activeId?: string) => withQuery("/dashboard/projects", { id: activeId }),
  newProject: () => withQuery("/dashboard/projects", { view: "new" }),

  intentions: () => "/dashboard/intentions",
  intention: (id: string) => withQuery("/dashboard/intentions", { view: "detail", id }),
  editIntention: (id: string) => withQuery("/dashboard/intentions", { view: "edit", id }),

  affirmations: () => "/dashboard/affirmations",
  // google is how connecting Google Calendar went, shown as a message.
  account: (result: { google?: string } = {}) => withQuery("/dashboard/account", result),
};

/**
 * Reads one query-string value as a plain string. Next.js gives an array
 * when a key appears twice (?id=a&id=b) and undefined when it's missing;
 * popups treat both as "not given".
 */
export function stringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

/**
 * Where clicking an event on the calendar leads: a journal entry's event
 * opens its journal; any other event opens its editor.
 */
export function calendarEventHref(event: { id: string; journalEntry?: { journalId: string } | null }) {
  return event.journalEntry
    ? dashboardRoutes.journals(event.journalEntry.journalId)
    : dashboardRoutes.editEvent(event.id);
}
