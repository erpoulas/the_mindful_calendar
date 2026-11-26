import { notFound } from "next/navigation";
import {
  addJournalPromptAction,
  createJournalAction,
  createJournalEntryAction,
  deleteJournalAction,
  deleteJournalEntryAction,
  deleteJournalPromptAction,
  setJournalScheduleAction,
  updateJournalAction,
  updateJournalEntryAction,
} from "@/app/actions/journals";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findTodaysEntry, formatPageDate } from "@/lib/journal-page";
import { getRandomJournalPrompt } from "@/lib/journals";
import { storedJournalDetail, storedJournals, storedTimezone } from "@/lib/stored-reads";
import { DeleteJournalButton } from "./delete-journal-button";
import { EditableName } from "./editable-name";
import { JournalLog } from "./journal-log";
import { JournalPage } from "./journal-page";
import { JournalScheduleControl } from "./journal-schedule-control";
import { NameTabs } from "./name-tabs";
import { NewNameButton } from "./new-name-button";
import { pageHeadingClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";

// Just what a page needs from an entry, so nothing else is sent to the browser.
function pickPage(entry: { id: string; content: string | null; promptText: string | null }) {
  return { id: entry.id, content: entry.content, promptText: entry.promptText };
}

/**
 * The whole Journals popup on one screen, like Quick Lists: a tab per
 * journal (with "+" to start one), the open journal's name (click to rename),
 * and its pages as an adventure log: today's page first (one per day, saving
 * as you write, with the saved prompts under it), then the earlier ones a
 * page at a time, searchable and editable the same way.
 */
export async function JournalsView({ activeId }: { activeId?: string }) {
  const userId = await getCurrentUserId();
  // With a journal picked in the URL, load it alongside the tabs. Otherwise
  // the first journal is shown, which needs the tabs first to know which it is.
  const [journals, pickedJournal, timeZone] = await Promise.all([
    storedJournals(userId),
    activeId ? storedJournalDetail(userId, activeId) : null,
    storedTimezone(userId),
  ]);
  const firstId = journals[0]?.id;
  const journal = activeId
    ? pickedJournal
    : firstId
      ? await storedJournalDetail(userId, firstId)
      : null;
  if (activeId && !journal) notFound();

  // Today's page carries on all day; the rest are earlier pages.
  const todaysEntry = journal && findTodaysEntry(journal.entries, timeZone);
  const earlierEntries = journal?.entries.filter((entry) => entry !== todaysEntry) ?? [];
  // A saved prompt to start a new page from, picked fresh each time the
  // journal opens (a random pick, so it's never stored like the reads above).
  const suggestedPrompt =
    journal && !todaysEntry
      ? (await getRandomJournalPrompt(db, { userId, journalId: journal.id }))?.text
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      <NameTabs
        label="Journals"
        noun="journal"
        items={journals}
        activeId={journal?.id}
        hrefFor={dashboardRoutes.journals}
        createAction={createJournalAction}
      />

      {!journal && (
        <PopupEmptyState message="No journals yet. Start one for anything you'd like to reflect on.">
          <NewNameButton
            noun="journal"
            createAction={createJournalAction}
            className={`${buttonVariants({ size: "sm" })} rounded-full`}
            inputClassName="text-center"
          >
            Start a journal
          </NewNameButton>
        </PopupEmptyState>
      )}

      {journal && (
        <>
          <div className="flex items-start justify-between gap-3">
            <EditableName
              // A fresh box for each journal, so switching tabs drops a half-typed name.
              key={journal.id}
              id={journal.id}
              name={journal.name}
              label="Journal name"
              renameAction={updateJournalAction}
              className={`${pageHeadingClassName} wrap-anywhere`}
            />
            <DeleteJournalButton
              key={`delete-${journal.id}`}
              journalName={journal.name}
              entryCount={journal.entries.length}
              deleteAction={deleteJournalAction.bind(null, journal.id)}
            />
          </div>

          <JournalScheduleControl
            key={`schedule-${journal.id}`}
            schedule={
              journal.schedule && {
                weekdays: journal.schedule.weekdays,
                startMinutes: journal.schedule.startMinutes,
                durationMinutes: journal.schedule.durationMinutes,
              }
            }
            saveAction={setJournalScheduleAction.bind(null, journal.id)}
          />

          <JournalLog
            // A fresh log for each journal, opening on today's page.
            key={`log-${journal.id}`}
            todayDate={formatPageDate(new Date(), timeZone)}
            pages={earlierEntries.map((entry) => ({
              ...pickPage(entry),
              date: formatPageDate(entry.createdAt, timeZone),
            }))}
            updateAction={updateJournalEntryAction}
            deleteAction={deleteJournalEntryAction}
            today={
              <JournalPage
                // One page per journal; it keeps its own text while it saves.
                key={journal.id}
                entry={todaysEntry ? pickPage(todaysEntry) : undefined}
                suggestedPrompt={suggestedPrompt}
                savedPrompts={journal.prompts.map(({ id, text }) => ({ id, text }))}
                createAction={createJournalEntryAction.bind(null, journal.id)}
                updateAction={updateJournalEntryAction}
                addPromptAction={addJournalPromptAction.bind(null, journal.id)}
                deletePromptAction={deleteJournalPromptAction}
                deleteAction={deleteJournalEntryAction}
              />
            }
          />
        </>
      )}
    </div>
  );
}
