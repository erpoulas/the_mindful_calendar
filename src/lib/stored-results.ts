import { revalidateTag, unstable_cache, updateTag } from "next/cache";
import { fromStoredJson, toStoredJson } from "./stored-json";

// Stored results: the server keeps the answer to a database read (your
// projects list, this week's events...) and hands that copy back next time
// instead of asking the database again. On Vercel the copies live in its
// shared Data Cache, so every server instance sees the same ones.
//
// Each copy is labelled with the areas of data it was built from, per user
// (for example "projects:<userId>"). A save throws away only the areas it
// changed, so ticking a quick-list item re-reads quick lists but not your
// calendar. Every new kind of save must forget the areas it writes, or the
// screen keeps showing the old copy; see AGENTS.md.

/** The areas of data a stored result can be built from. */
export type StoredArea =
  | "settings"
  | "preferences"
  | "intentions"
  | "projects"
  | "quickLists"
  | "journals"
  | "affirmations"
  | "dopamineMenu"
  | "postIts"
  | "events";

export function storedAreaTag(area: StoredArea, userId: string) {
  return `${area}:${userId}`;
}

// A new deploy may change what a read returns, so it must never pick up a
// copy stored by the old code. Off Vercel, each server start counts as new.
const codeVersion = process.env.VERCEL_DEPLOYMENT_ID ?? `local-${Date.now()}`;

// A safety net: even if a save ever forgets to throw a copy away, no copy is
// trusted for longer than this.
const MAX_AGE_SECONDS = 10 * 60;

/**
 * Wraps a database read so its result is stored per user and per arguments.
 * `name` must be unique per read; `areas` lists every area the read uses.
 */
export function storedRead<Args extends unknown[], Result>(
  name: string,
  areas: StoredArea[],
  read: (userId: string, ...args: Args) => Promise<Result>,
) {
  return async (userId: string, ...args: Args): Promise<Result> => {
    const readAsJson = unstable_cache(
      async () => toStoredJson(await read(userId, ...args)),
      [name, codeVersion, userId, toStoredJson(args)],
      {
        tags: areas.map((area) => storedAreaTag(area, userId)),
        revalidate: MAX_AGE_SECONDS,
      },
    );
    return fromStoredJson<Result>(await readAsJson());
  };
}

/**
 * For server actions: throws away the user's stored copies for these areas,
 * so the page the action sends back is built from fresh data.
 */
export function forgetStoredAfterSave(userId: string, areas: StoredArea[]) {
  for (const area of areas) updateTag(storedAreaTag(area, userId));
}

/**
 * For route handlers, where updateTag isn't allowed: the same, expiring the
 * copies at once instead of serving them one last time.
 */
export function forgetStoredFromRoute(userId: string, areas: StoredArea[]) {
  for (const area of areas) revalidateTag(storedAreaTag(area, userId), { expire: 0 });
}
