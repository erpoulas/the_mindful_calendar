import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import { createJournal, deleteJournal } from "@/lib/journals";
import {
  getJournalSchedule,
  listJournalSchedules,
  removeJournalSchedule,
  setJournalSchedule,
} from "@/lib/journal-schedules";

const EVENING = { weekdays: [5, 1, 3, 3], startMinutes: 21 * 60, durationMinutes: 20 };

describe("setJournalSchedule", () => {
  it("sets a journal's repeating time, with each day once and in order", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });

      const schedule = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });

      expect(schedule).toMatchObject({ weekdays: [1, 3, 5], startMinutes: 1260, durationMinutes: 20 });
    });
  });

  it("changes the same schedule when set again, keeping its Google link", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const first = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });
      await tx.journalSchedule.update({ where: { id: first!.id }, data: { googleEventId: "g1" } });

      const changed = await setJournalSchedule(tx, {
        userId: "test-user-1",
        journalId: journal.id,
        weekdays: [7],
        startMinutes: 8 * 60,
        durationMinutes: 15,
      });

      expect(changed).toMatchObject({ id: first!.id, weekdays: [7], startMinutes: 480, googleEventId: "g1" });
    });
  });

  it("turns the schedule off when no days are picked", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });

      const result = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING, weekdays: [] });

      expect(result).toBeNull();
      expect(await getJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id })).toBeNull();
    });
  });

  it("never schedules another user's journal", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });

      const result = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });

      expect(result).toBeNull();
      expect(await tx.journalSchedule.count({ where: { journalId: journal.id } })).toBe(0);
    });
  });
});

describe("removeJournalSchedule", () => {
  it("leaves a note so the next sync deletes the repeating event in Google too", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const schedule = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });
      await tx.journalSchedule.update({ where: { id: schedule!.id }, data: { googleEventId: "g1" } });

      await removeJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id });

      expect(await tx.journalSchedule.count({ where: { id: schedule!.id } })).toBe(0);
      expect(await tx.googleEventDeletion.findUnique({ where: { googleEventId: "g1" } })).toMatchObject({
        userId: "test-user-1",
      });
    });
  });
});

describe("listJournalSchedules", () => {
  it("lists only the user's schedules, with their journal's name", async () => {
    await withRollback(async (tx) => {
      const mine = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const theirs = await createJournal(tx, { userId: "test-user-2", name: "Theirs" });
      await setJournalSchedule(tx, { userId: "test-user-1", journalId: mine.id, ...EVENING });
      await setJournalSchedule(tx, { userId: "test-user-2", journalId: theirs.id, ...EVENING });

      const schedules = await listJournalSchedules(tx, "test-user-1");

      expect(schedules.map((schedule) => schedule.journal.name)).toEqual(["Gratitude"]);
    });
  });
});

describe("deleteJournal", () => {
  it("also deletes the journal's repeating event in Google", async () => {
    await withRollback(async (tx) => {
      const journal = await createJournal(tx, { userId: "test-user-1", name: "Gratitude" });
      const schedule = await setJournalSchedule(tx, { userId: "test-user-1", journalId: journal.id, ...EVENING });
      await tx.journalSchedule.update({ where: { id: schedule!.id }, data: { googleEventId: "g1" } });

      await deleteJournal(tx, { userId: "test-user-1", journalId: journal.id });

      expect(await tx.googleEventDeletion.count({ where: { googleEventId: "g1" } })).toBe(1);
    });
  });
});
