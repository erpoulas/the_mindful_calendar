import { describe, expect, it } from "vitest";
import { withRollback } from "../test/withRollback";
import { getOrCreateJournalIntention } from "./intentions";
import {
  addJournalPrompt,
  createJournal,
  createJournalEntry,
  deleteJournal,
  deleteJournalEntry,
  deleteJournalPrompt,
  getJournalDetail,
  getRandomJournalPrompt,
  listJournals,
  updateJournal,
  updateJournalEntry,
} from "./journals";

describe("createJournal", () => {
  it("creates a journal with the given name", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      expect(journal.name).toBe("Gratitude");
    });
  });
});

describe("listJournals", () => {
  it("never returns another user's journals", async () => {
    await withRollback(async (tx) => {
      await createJournal(tx, { userId: "test-user-1", name: "Mine" });
      await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await listJournals(tx, "test-user-1");

      expect(result.map((j) => j.name)).toEqual(["Mine"]);
    });
  });
});

describe("getJournalDetail", () => {
  it("returns null when the journal doesn't exist", async () => {
    await withRollback(async (tx) => {
      const result = await getJournalDetail(tx, {
        userId: "test-user-1",
        journalId: "does-not-exist",
      });
      expect(result).toBeNull();
    });
  });

  it("returns null when the journal belongs to another user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await getJournalDetail(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });

      expect(result).toBeNull();
    });
  });

  it("returns the journal with its prompts and entries", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      await addJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        text: "What went well today?",
      });
      await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        content: "The weather was nice.",
      });

      const result = await getJournalDetail(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });

      expect(result?.prompts.map((p) => p.text)).toEqual(["What went well today?"]);
      expect(result?.entries.map((e) => e.content)).toEqual(["The weather was nice."]);
    });
  });
});

describe("updateJournal", () => {
  it("renames the journal", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const updated = await updateJournal(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        name: "Daily Gratitude",
      });

      expect(updated?.name).toBe("Daily Gratitude");
    });
  });

  it("returns null when the journal doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await updateJournal(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        name: "Hijacked",
      });

      expect(result).toBeNull();
    });
  });
});

describe("deleteJournal", () => {
  it("deletes the journal and its prompts", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      await addJournalPrompt(tx, { userId: "test-user-1", journalId: journal.id, text: "Prompt" });

      await deleteJournal(tx, { userId: "test-user-1", journalId: journal.id });

      const result = await getJournalDetail(tx, { userId: "test-user-1", journalId: journal.id });
      expect(result).toBeNull();

      const prompts = await tx.journalPrompt.findMany({ where: { journalId: journal.id } });
      expect(prompts).toEqual([]);
    });
  });

  it("returns null when the journal doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await deleteJournal(tx, { userId: "test-user-1", journalId: journal.id });

      expect(result).toBeNull();
    });
  });
});

describe("addJournalPrompt", () => {
  it("adds a prompt to the journal's pool", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const prompt = await addJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        text: "What made you smile today?",
      });

      expect(prompt?.text).toBe("What made you smile today?");
    });
  });

  it("returns null when the journal doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await addJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        text: "Sneaky prompt",
      });

      expect(result).toBeNull();
    });
  });
});

describe("deleteJournalPrompt", () => {
  it("deletes the prompt", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const prompt = await addJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        text: "Prompt",
      });

      await deleteJournalPrompt(tx, { userId: "test-user-1", promptId: prompt!.id });

      const detail = await getJournalDetail(tx, { userId: "test-user-1", journalId: journal.id });
      expect(detail?.prompts).toEqual([]);
    });
  });

  it("returns null when the prompt's journal doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });
      const prompt = await addJournalPrompt(tx, {
        userId: "test-user-2",
        journalId: journal.id,
        text: "Sneaky prompt",
      });

      const result = await deleteJournalPrompt(tx, {
        userId: "test-user-1",
        promptId: prompt!.id,
      });

      expect(result).toBeNull();
    });
  });
});

describe("getRandomJournalPrompt", () => {
  it("returns null when the pool is empty", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const result = await getRandomJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });

      expect(result).toBeNull();
    });
  });

  it("returns one of the journal's own prompts", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      await addJournalPrompt(tx, { userId: "test-user-1", journalId: journal.id, text: "A" });
      await addJournalPrompt(tx, { userId: "test-user-1", journalId: journal.id, text: "B" });

      const result = await getRandomJournalPrompt(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });

      expect(["A", "B"]).toContain(result?.text);
    });
  });
});

describe("createJournalEntry", () => {
  it("creates an entry with its own linked calendar event", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        promptText: "What went well today?",
        content: "Got outside for a walk.",
      });

      expect(entry?.promptText).toBe("What went well today?");
      expect(entry?.content).toBe("Got outside for a walk.");

      const event = await tx.calendarEvent.findUnique({
        where: { id: entry!.calendarEventId },
      });
      expect(event?.title).toBe("What went well today?");
    });
  });

  it("tags the linked event to the automatic Journal intention with no setup", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        content: "Spontaneous entry",
      });

      const journalIntention = await getOrCreateJournalIntention(tx, "test-user-1");
      const event = await tx.calendarEvent.findUnique({
        where: { id: entry!.calendarEventId },
        include: { intentions: true },
      });

      expect(event?.intentions.map((ei) => ei.intentionId)).toContain(journalIntention.id);
    });
  });

  it("can also tag additional intentions", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Food Diary" });
      const health = await tx.intention.create({
        data: { userId: "test-user-1", name: "Health" },
      });

      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        content: "Ate well today",
        intentionIds: [health.id],
      });

      const event = await tx.calendarEvent.findUnique({
        where: { id: entry!.calendarEventId },
        include: { intentions: true },
      });

      expect(event?.intentions.map((ei) => ei.intentionId)).toContain(health.id);
    });
  });

  it("supports pre-scheduling a future entry time", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const startAt = new Date("2026-12-01T08:00:00Z");

      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        startAt,
      });

      const event = await tx.calendarEvent.findUnique({
        where: { id: entry!.calendarEventId },
      });
      expect(event?.startAt).toEqual(startAt);
    });
  });

  it("returns null when the journal doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        content: "Sneaky entry",
      });

      expect(result).toBeNull();
    });
  });
});

describe("updateJournalEntry", () => {
  it("updates the entry's content", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });

      const updated = await updateJournalEntry(tx, {
        userId: "test-user-1",
        entryId: entry!.id,
        content: "Filled in later",
      });

      expect(updated?.content).toBe("Filled in later");
    });
  });

  it("returns null when the entry doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });
      const entry = await createJournalEntry(tx, {
        userId: "test-user-2",
        journalId: journal.id,
      });

      const result = await updateJournalEntry(tx, {
        userId: "test-user-1",
        entryId: entry!.id,
        content: "Sneaky edit",
      });

      expect(result).toBeNull();
    });
  });
});

describe("deleteJournalEntry", () => {
  it("deletes the entry and its linked calendar event", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const entry = await createJournalEntry(tx, {
        userId: "test-user-1",
        journalId: journal.id,
      });
      const eventId = entry!.calendarEventId;

      await deleteJournalEntry(tx, { userId: "test-user-1", entryId: entry!.id });

      const event = await tx.calendarEvent.findUnique({ where: { id: eventId } });
      expect(event).toBeNull();
    });
  });

  it("returns null when the entry doesn't belong to the user", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });
      const entry = await createJournalEntry(tx, {
        userId: "test-user-2",
        journalId: journal.id,
      });

      const result = await deleteJournalEntry(tx, {
        userId: "test-user-1",
        entryId: entry!.id,
      });

      expect(result).toBeNull();
    });
  });
});
