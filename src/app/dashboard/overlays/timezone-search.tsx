"use client";

import { useState } from "react";
import { searchTimezonesAction } from "@/app/actions/user-settings";
import type { TimezoneMatch } from "@/lib/timezone-search";
import { Input } from "@/components/ui/input";
import { useSearchResults } from "./use-search-results";

/** Type a city or zone name, then click a result to pick its time zone. */
export function TimezoneSearch({
  id,
  onPick,
  disabled = false,
  placeholder = "Search a city, e.g. Boulder",
}: {
  id: string;
  onPick: (match: TimezoneMatch) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const results = useSearchResults(query, searchTimezonesAction);

  function pick(match: TimezoneMatch) {
    onPick(match);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        id={id}
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
      {query.trim() && results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-lg border">
          {results.map((match) => (
            <li key={`${match.label}|${match.timezone}`}>
              <button
                type="button"
                onClick={() => pick(match)}
                className="flex w-full flex-col items-start px-2.5 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span>{match.label}</span>
                <span className="text-xs text-muted-foreground">
                  {match.zoneName} · {match.timezone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
