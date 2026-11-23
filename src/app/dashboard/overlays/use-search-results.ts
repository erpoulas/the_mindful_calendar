"use client";

import { useEffect, useState } from "react";

// Wait for a pause in typing before asking the server.
const TYPING_PAUSE_MS = 200;

/**
 * Results for a search box: runs `search` once typing pauses, and drops
 * answers to older searches that arrive after a newer one. An empty query
 * gives no results without searching. Pass a `search` defined outside the
 * component, so it stays the same function between renders.
 */
export function useSearchResults<Result>(
  query: string,
  search: (query: string) => Promise<Result[]>,
): Result[] {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(async () => {
      const matches = query.trim() ? await search(query) : [];
      if (!stale) setResults(matches);
    }, TYPING_PAUSE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, search]);

  return results;
}
