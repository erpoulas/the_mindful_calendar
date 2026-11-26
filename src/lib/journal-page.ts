import { toWallClockDate } from "./wall-clock";

// A journal entry is one page of writing. Prompts sit on it as their own
// lines, each followed by what you wrote under it. In the database the page
// is plain text (the entry's `content`), with each prompt line wrapped in
// *asterisks*, the Markdown way of writing italics, so it still reads
// naturally anywhere else the text turns up.

export type JournalPageBlock = { kind: "prompt" | "text"; text: string };

const PROMPT_LINE = /^\*(.+)\*$/;

/**
 * Splits a page into prompt lines and the writing between them. Every
 * prompt gets a (maybe empty) block of writing after it, and an empty page
 * is one empty block, so there is always somewhere to type. `legacyPrompt`
 * is the separate prompt older entries kept; it goes at the top.
 */
export function parseJournalPage(
  content: string | null,
  legacyPrompt?: string | null,
): JournalPageBlock[] {
  const blocks: JournalPageBlock[] = legacyPrompt ? [{ kind: "prompt", text: legacyPrompt }] : [];
  let writing: string[] | null = null;

  // A form sends line breaks to the server as \r\n, so either kind counts.
  for (const line of content ? content.split(/\r?\n/) : []) {
    const prompt = line.match(PROMPT_LINE);
    if (prompt) {
      if (writing) blocks.push({ kind: "text", text: writing.join("\n") });
      writing = null;
      blocks.push({ kind: "prompt", text: prompt[1] });
    } else {
      writing = [...(writing ?? []), line];
    }
  }
  if (writing) blocks.push({ kind: "text", text: writing.join("\n") });

  // Somewhere to write after each prompt, and on an empty page.
  return blocks.flatMap((block, index) =>
    block.kind === "prompt" && blocks[index + 1]?.kind !== "text"
      ? [block, { kind: "text" as const, text: "" }]
      : [block],
  ).concat(blocks.length === 0 ? [{ kind: "text", text: "" }] : []);
}

/** The page as stored text. Prompts that were cleared away are dropped. */
export function serializeJournalPage(blocks: JournalPageBlock[]): string {
  return blocks
    .filter((block) => block.kind === "text" || block.text.trim() !== "")
    .map((block) => (block.kind === "prompt" ? `*${block.text.trim()}*` : block.text))
    .join("\n")
    .trimEnd();
}

/** The day (YYYY-MM-DD) a moment falls on in a time zone. */
function dayIn(moment: Date, timeZone: string) {
  return toWallClockDate(moment, timeZone).toISOString().slice(0, 10);
}

/** Today's page: the entry written today in the user's time zone, if any. */
export function findTodaysEntry<Entry extends { createdAt: Date }>(
  entries: Entry[],
  timeZone: string,
  now = new Date(),
): Entry | undefined {
  const today = dayIn(now, timeZone);
  return entries.find((entry) => dayIn(entry.createdAt, timeZone) === today);
}

/** A saved prompt not on the page yet, picked at random (for the shuffle button). */
export function pickPromptToAdd(
  saved: { text: string }[],
  onPage: string[],
  random = Math.random,
): string | undefined {
  const choices = saved.filter((prompt) => !onPage.includes(prompt.text));
  return choices[Math.floor(random() * choices.length)]?.text;
}

/**
 * A page's date for its header, like "Thursday, November 26", in the
 * user's time zone (an entry's createdAt is a real moment). Pages from
 * another year say the year too.
 */
export function formatPageDate(createdAt: Date, timeZone: string, now = new Date()) {
  const sameYear = dayIn(createdAt, timeZone).slice(0, 4) === dayIn(now, timeZone).slice(0, 4);
  return createdAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone,
  });
}

export type JournalSearchResult = {
  id: string;
  /** The words around the match, so a result can show it highlighted. */
  snippet: { before: string; match: string; after: string };
};

// How many letters of a page to show either side of a match.
const SNIPPET_REACH = 40;

/** A page as one line of plain text: prompts and writing, without the asterisks. */
function pageAsText(content: string | null, legacyPrompt?: string | null) {
  return parseJournalPage(content, legacyPrompt)
    .map((block) => block.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The pages whose writing, prompts or date contain the search (ignoring
 * case), newest first as given. A match in the writing comes with the
 * words around it; a page found by its date shows its opening words.
 */
export function searchJournalPages(
  pages: { id: string; date: string; content: string | null; promptText?: string | null }[],
  search: string,
): JournalSearchResult[] {
  const wanted = search.trim().replace(/\s+/g, " ").toLowerCase();
  if (!wanted) return [];

  return pages.flatMap((page) => {
    const text = pageAsText(page.content, page.promptText);
    const at = text.toLowerCase().indexOf(wanted);
    if (at >= 0) {
      const from = Math.max(0, at - SNIPPET_REACH);
      const to = Math.min(text.length, at + wanted.length + SNIPPET_REACH);
      return [
        {
          id: page.id,
          snippet: {
            before: (from > 0 ? "…" : "") + text.slice(from, at),
            match: text.slice(at, at + wanted.length),
            after: text.slice(at + wanted.length, to) + (to < text.length ? "…" : ""),
          },
        },
      ];
    }
    if (page.date.toLowerCase().includes(wanted)) {
      const opening = text.length > SNIPPET_REACH * 2 ? `${text.slice(0, SNIPPET_REACH * 2)}…` : text;
      return [{ id: page.id, snippet: { before: "", match: "", after: opening } }];
    }
    return [];
  });
}
