import { describe, expect, it } from "vitest";
import {
  findTodaysEntry,
  formatPageDate,
  parseJournalPage,
  pickPromptToAdd,
  searchJournalPages,
  serializeJournalPage,
} from "@/lib/journal-page";

describe("parseJournalPage", () => {
  it("reads prompt lines (in *asterisks*) and the writing under each", () => {
    expect(parseJournalPage("*What went well?*\nA long walk.\n*What made you smile?*\nTea.")).toEqual([
      { kind: "prompt", text: "What went well?" },
      { kind: "text", text: "A long walk." },
      { kind: "prompt", text: "What made you smile?" },
      { kind: "text", text: "Tea." },
    ]);
  });

  it("reads a page whose lines end in \\r\\n, as a form sends them to the server", () => {
    expect(parseJournalPage("*What went well?*\r\nA long walk.\r\nThen tea.")).toEqual([
      { kind: "prompt", text: "What went well?" },
      { kind: "text", text: "A long walk.\nThen tea." },
    ]);
  });

  it("keeps several lines of writing together, blank lines included", () => {
    expect(parseJournalPage("First line\n\nThird line")).toEqual([
      { kind: "text", text: "First line\n\nThird line" },
    ]);
  });

  it("gives each prompt a place to answer, and an empty page one blank spot", () => {
    expect(parseJournalPage("*Only a prompt*")).toEqual([
      { kind: "prompt", text: "Only a prompt" },
      { kind: "text", text: "" },
    ]);
    expect(parseJournalPage(null)).toEqual([{ kind: "text", text: "" }]);
  });

  it("puts an older entry's separate prompt at the top of its page", () => {
    expect(parseJournalPage("The walk", "What went well?")).toEqual([
      { kind: "prompt", text: "What went well?" },
      { kind: "text", text: "The walk" },
    ]);
  });
});

describe("serializeJournalPage", () => {
  it("writes prompts as *lines* and drops emptied prompts and trailing space", () => {
    expect(
      serializeJournalPage([
        { kind: "prompt", text: "What went well?" },
        { kind: "text", text: "A long walk." },
        { kind: "prompt", text: "  " },
        { kind: "text", text: "" },
      ]),
    ).toBe("*What went well?*\nA long walk.");
  });

  it("round-trips a page", () => {
    const content = "Morning notes\n\n*What went well?*\nA long walk.\n*Why?*\nSun.";
    expect(serializeJournalPage(parseJournalPage(content))).toBe(content);
  });

  it("writes an empty page as nothing", () => {
    expect(serializeJournalPage([{ kind: "text", text: "  \n" }])).toBe("");
  });
});

describe("findTodaysEntry", () => {
  const entries = [
    { id: "late-yesterday", createdAt: new Date("2026-11-26T04:30:00Z") },
    { id: "this-morning", createdAt: new Date("2026-11-26T14:00:00Z") },
  ];

  it("finds the entry written today in the user's time zone", () => {
    // 8pm on Nov 26 in New York (UTC-5).
    const now = new Date("2026-11-27T01:00:00Z");
    expect(findTodaysEntry([...entries].reverse(), "America/New_York", now)?.id).toBe("this-morning");
  });

  it("treats an entry from 11:30pm the day before as yesterday's", () => {
    // 04:30Z on Nov 26 is 11:30pm Nov 25 in New York.
    const now = new Date("2026-11-26T12:00:00Z");
    expect(findTodaysEntry([entries[0]], "America/New_York", now)).toBeUndefined();
  });
});

describe("pickPromptToAdd", () => {
  const saved = [{ text: "A" }, { text: "B" }, { text: "C" }];

  it("picks a saved prompt that isn't on the page yet", () => {
    expect(pickPromptToAdd(saved, ["A", "C"])).toBe("B");
  });

  it("picks at random among those left", () => {
    expect(pickPromptToAdd(saved, ["A"], () => 0.99)).toBe("C");
  });

  it("gives nothing once every prompt is on the page", () => {
    expect(pickPromptToAdd(saved, ["A", "B", "C"])).toBeUndefined();
  });
});

describe("formatPageDate", () => {
  const now = new Date("2026-11-26T15:00:00Z");

  it("names the day in the user's time zone", () => {
    // 1:50am on 27 Nov in UTC is still the evening of the 26th in New York.
    expect(formatPageDate(new Date("2026-11-27T01:50:00Z"), "America/New_York", now)).toBe(
      "Thursday, November 26",
    );
  });

  it("adds the year for a page from another year", () => {
    expect(formatPageDate(new Date("2025-03-02T12:00:00Z"), "UTC", now)).toBe("Sunday, March 2, 2025");
  });
});

describe("searchJournalPages", () => {
  const pages = [
    { id: "a", date: "Thursday, November 26", content: "*What went well?*\nA long walk by the river with Sam." },
    { id: "b", date: "Monday, November 23", content: "Rainy day. Stayed in." },
  ];

  it("finds the pages with the words, ignoring case, with the match in a snippet", () => {
    expect(searchJournalPages(pages, "RIVER")).toEqual([
      { id: "a", snippet: { before: "What went well? A long walk by the ", match: "river", after: " with Sam." } },
    ]);
  });

  it("finds words in a prompt, and pages by their date", () => {
    expect(searchJournalPages(pages, "went well").map((result) => result.id)).toEqual(["a"]);
    expect(searchJournalPages(pages, "november 23")).toEqual([
      { id: "b", snippet: { before: "", match: "", after: "Rainy day. Stayed in." } },
    ]);
  });

  it("cuts a long page down to the words around the match", () => {
    const long = { id: "c", date: "Friday", content: `${"word ".repeat(30)}found it${" more".repeat(30)}` };
    const [{ snippet }] = searchJournalPages([long], "found");

    expect(snippet.before.startsWith("…")).toBe(true);
    expect(snippet.before.length).toBeLessThan(50);
    expect(snippet.after.endsWith("…")).toBe(true);
  });

  it("finds nothing for a blank search", () => {
    expect(searchJournalPages(pages, "  ")).toEqual([]);
  });
});
