"use client";

import { useId, useState, type FocusEvent } from "react";
import { Input } from "@/components/ui/input";
import type { PlaceSuggestion } from "@/lib/place-search";
import { useSearchResults } from "./use-search-results";

/** Asks /api/place-suggestions. Any failure just means no suggestions. */
async function requestPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  try {
    const response = await fetch(`/api/place-suggestions?${new URLSearchParams({ q: query })}`);
    if (!response.ok) return [];
    const { suggestions } = (await response.json()) as { suggestions?: PlaceSuggestion[] };
    return suggestions ?? [];
  } catch {
    return [];
  }
}

type LocationSearchProps = {
  id: string;
  name: string;
  defaultValue?: string;
  /** False when place search isn't set up (no GOOGLE_PLACES_API_KEY). */
  suggestPlaces: boolean;
};

/**
 * The event form's Location field. Free text, like before; when place search
 * is set up it also suggests real places as you type, like Google Calendar.
 * Picking one fills in "Name, full address", which Google Calendar shows
 * with a map link after sync.
 */
export function LocationSearch({ suggestPlaces, ...inputProps }: LocationSearchProps) {
  if (!suggestPlaces) return <Input {...inputProps} />;
  return <PlaceSuggestingInput {...inputProps} />;
}

function PlaceSuggestingInput({ id, name, defaultValue }: Omit<LocationSearchProps, "suggestPlaces">) {
  const [value, setValue] = useState(defaultValue ?? "");
  // Only typing opens the list, so it stays shut after a pick or on load.
  const [open, setOpen] = useState(false);
  const suggestions = useSearchResults(open ? value : "", requestPlaceSuggestions);
  const listId = useId();
  const showList = open && value.trim() !== "" && suggestions.length > 0;

  function pick(suggestion: PlaceSuggestion) {
    setValue(suggestion.label);
    setOpen(false);
  }

  // Close when focus leaves both the box and the list (tabbing into the list keeps it open).
  function closeOnLeave(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }

  return (
    <div className="relative" onBlur={closeOnLeave}>
      <Input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Add a place or address"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col overflow-hidden rounded-lg border bg-popover shadow-md"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.label} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => pick(suggestion)}
                className="flex w-full flex-col items-start px-2.5 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <span>{suggestion.name}</span>
                {suggestion.address && (
                  <span className="text-xs text-muted-foreground">{suggestion.address}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
