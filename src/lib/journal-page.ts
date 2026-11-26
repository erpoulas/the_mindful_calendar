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
