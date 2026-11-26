"use client";

import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchJournalPages } from "@/lib/journal-page";
import { JournalPage } from "./journal-page";

type PastPage = {
  id: string;
  /** "Thursday, November 26", already in the user's time zone. */
  date: string;
  content: string | null;
  promptText: string | null;
};

/**
 * A journal read like a video game's adventure log: one page at a time,
 * opening on today's, with arrows (or the arrow keys, when you aren't
 * typing) to turn to older and newer pages, and a search that jumps
 * straight to a past page. Pages stay editable, saving as you write.
 *
 * `today` is today's page, already set up, and `todayDate` its date.
 * `pages` are the earlier ones,
 * newest first. Pages you have turned to stay mounted, only hidden, so one
 * still saving keeps its writing when you turn away and back.
 */
export function JournalLog({
  today,
  todayDate,
  pages,
  updateAction,
  deleteAction,
}: {
  today: ReactNode;
  todayDate: string;
  pages: PastPage[];
  updateAction: (entryId: string, formData: FormData) => Promise<void>;
  deleteAction: (entryId: string) => Promise<void>;
}) {
  // 0 is today's page; 1 is the page before it, and so on.
  const [turnedTo, setTurnedTo] = useState(0);
  const [turning, setTurning] = useState<"older" | "newer">("older");
  const [visited, setVisited] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState("");

  // A page deleted at the end of the journal leaves the oldest one showing.
  const at = Math.min(turnedTo, pages.length);
  const shown = at === 0 ? null : pages[at - 1];
  const results = searchJournalPages(pages, search);

  function turnTo(index: number) {
    const next = Math.max(0, Math.min(index, pages.length));
    if (next === at) return;
    setTurning(next > at ? "older" : "newer");
    setTurnedTo(next);
    const page = pages[next - 1];
    if (page && !visited.has(page.id)) setVisited(new Set(visited).add(page.id));
  }

  const turnWithArrowKeys = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // The arrow keys move the cursor while you write, so leave them be there.
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "ArrowLeft") turnTo(at + 1);
    else if (event.key === "ArrowRight") turnTo(at - 1);
  });
  useEffect(() => {
    window.addEventListener("keydown", turnWithArrowKeys);
    return () => window.removeEventListener("keydown", turnWithArrowKeys);
  }, []);

  function openResult(id: string) {
    turnTo(pages.findIndex((page) => page.id === id) + 1);
    setSearch("");
  }

  const animation = turning === "older" ? "motion-safe:animate-page-older" : "motion-safe:animate-page-newer";

  return (
    <div className="flex flex-col gap-3">
      {pages.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/55 px-3 py-1.5 text-sm focus-within:border-amber-900/30">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              type="search"
              aria-label="Search pages"
              placeholder="Search past pages"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearch("");
              }}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
            />
          </label>

          {search.trim() &&
            (results.length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">No pages mention “{search.trim()}”.</p>
            ) : (
              <ul aria-label="Search results" className="flex flex-col gap-1.5">
                {results.map((result) => {
                  const page = pages.find((candidate) => candidate.id === result.id)!;
                  return (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => openResult(result.id)}
                        className="block w-full rounded-xl border border-amber-900/10 bg-white/55 px-3 py-2 text-left transition hover:bg-white"
                      >
                        <span className="block text-xs tracking-wide text-amber-900/70 uppercase">
                          {page.date}
                        </span>
                        <span className="block text-sm wrap-anywhere">
                          {result.snippet.before}
                          {result.snippet.match && (
                            <mark className="rounded-sm bg-amber-200/80 px-0.5 text-foreground">
                              {result.snippet.match}
                            </mark>
                          )}
                          {result.snippet.after}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Older page"
          title="Older page (←)"
          disabled={at === pages.length}
          onClick={() => turnTo(at + 1)}
          className="rounded-full"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span aria-hidden className="h-px flex-1 bg-amber-900/20" />
          <h3 className="text-center font-heading text-xl tracking-wider text-amber-900/80 uppercase">
            {shown ? shown.date : `Today · ${todayDate}`}
          </h3>
          <span aria-hidden className="h-px flex-1 bg-amber-900/20" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Newer page"
          title="Newer page (→)"
          disabled={at === 0}
          onClick={() => turnTo(at - 1)}
          className="rounded-full"
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      {shown && (
        <button
          type="button"
          onClick={() => turnTo(0)}
          className="-mt-2 self-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Back to today
        </button>
      )}

      <div hidden={shown !== null} className={shown ? undefined : animation}>
        {today}
      </div>
      {pages
        .filter((page) => visited.has(page.id))
        .map((page) => (
          <div key={page.id} hidden={page !== shown} className={page === shown ? animation : undefined}>
            <JournalPage
              entry={{ id: page.id, content: page.content, promptText: page.promptText }}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          </div>
        ))}
    </div>
  );
}
