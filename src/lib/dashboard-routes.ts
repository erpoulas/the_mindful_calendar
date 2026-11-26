// The address of every dashboard popup, in one place so links, redirects
// and the route folders can't drift apart.
//
// Each popup is its own route under /dashboard, rendered into the layout's
// @panel slot (src/app/dashboard/@panel/). Opening one renders only the
// popup: the calendar beside it stays as it is, with no queries re-run.
// Which screen a popup shows (a list, one item, an edit form) stays in the
// query string, for example /dashboard/event?view=edit&id=abc.

type Query = Record<string, string | undefined>;

export type JournalTab = "read" | "write";

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
    prefill: { date?: string; title?: string; postItId?: string; projectId?: string } = {},
  ) =>
    withQuery("/dashboard/event", { view: "new", ...prefill }),
  editEvent: (id: string) => withQuery("/dashboard/event", { view: "edit", id }),

  journals: () => "/dashboard/journals",
  newJournal: () => withQuery("/dashboard/journals", { view: "create" }),
  // tab picks the Read tab (the entries) or the Write tab (new entry form and
  // prompts). Left out, it opens on Write.
  journal: (id: string, tab?: JournalTab) =>
    withQuery("/dashboard/journals", { view: "detail", id, tab }),
  editJournal: (id: string) => withQuery("/dashboard/journals", { view: "edit", id }),
  // Reading one entry in full; editing it is a separate step.
  journalEntry: (id: string, entryId: string) =>
    withQuery("/dashboard/journals", { view: "entry", id, entryId }),
  editJournalEntry: (id: string, entryId: string) =>
    withQuery("/dashboard/journals", { view: "entry-edit", id, entryId }),

  quickLists: (activeId?: string) => withQuery("/dashboard/quick-lists", { id: activeId }),

  projects: () => "/dashboard/projects",
  newProject: () => withQuery("/dashboard/projects", { view: "create" }),
  project: (id: string) => withQuery("/dashboard/projects", { view: "detail", id }),
  editProject: (id: string) => withQuery("/dashboard/projects", { view: "edit", id }),

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
