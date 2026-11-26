import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  addJournalPromptAction,
  createJournalAction,
  createJournalEntryAction,
  deleteJournalAction,
  deleteJournalEntryAction,
  deleteJournalPromptAction,
  updateJournalAction,
  updateJournalEntryAction,
} from "@/app/actions/journals";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { getRandomJournalPrompt } from "@/lib/journals";
import { storedJournalDetail, storedJournals } from "@/lib/stored-reads";
import { EditableEntryText } from "./editable-entry-text";
import { EditableName } from "./editable-name";
import { EntryComposer } from "./entry-composer";
import { NameTabs } from "./name-tabs";
import { NewNameButton } from "./new-name-button";
import { pageHeadingClassName, softCardClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";
import { RemovableList } from "./removable-list";

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

// A small trash icon: deleting is rare, so it stays out of the way.
function DeleteIconButton({ label, confirmMessage }: { label: string; confirmMessage: string }) {
  return (
    <ConfirmSubmitButton
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className="text-destructive"
      confirmMessage={confirmMessage}
    >
      <Trash2 aria-hidden />
    </ConfirmSubmitButton>
  );
}

/**
 * The whole Journals popup on one screen, like Quick Lists: a tab per
 * journal (with "+" to start one), the open journal's name (click to rename),
 * the writing box for a new entry, and its past entries in full below, each
 * edited by clicking its text. No separate list, entry or form screens.
 */
export async function JournalsView({ activeId }: { activeId?: string }) {
  const userId = await getCurrentUserId();
  // With a journal picked in the URL, load it alongside the tabs. Otherwise
  // the first journal is shown, which needs the tabs first to know which it is.
  const [journals, pickedJournal] = await Promise.all([
    storedJournals(userId),
    activeId ? storedJournalDetail(userId, activeId) : null,
  ]);
  const firstId = journals[0]?.id;
  const journal = activeId
    ? pickedJournal
    : firstId
      ? await storedJournalDetail(userId, firstId)
      : null;
  if (activeId && !journal) notFound();

  // A saved prompt to start from, picked fresh each time the journal opens
  // (a random pick, so it's never stored like the reads above).
  const suggestedPrompt = journal
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
            <form action={deleteJournalAction.bind(null, journal.id)} className="shrink-0">
              <DeleteIconButton
                label="Delete journal"
                confirmMessage="Delete this journal and all its entries? This can't be undone."
              />
            </form>
          </div>

          <EntryComposer
            // Starts fresh (with a new suggestion) for each journal.
            key={journal.id}
            prompts={journal.prompts.map(({ id, text }) => ({ id, text }))}
            suggestedPrompt={suggestedPrompt}
            createAction={createJournalEntryAction.bind(null, journal.id)}
          />

          {/* Folded away: it's set up once and rarely touched afterwards. */}
          <details className={`${softCardClassName} px-4 py-3`}>
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              Manage saved prompts ({journal.prompts.length})
            </summary>
            <RemovableList
              items={journal.prompts.map(({ id, text }) => ({ id, text }))}
              emptyText="No saved prompts yet."
              addPlaceholder="Save a prompt you like"
              addLabel="Save"
              removeAction={deleteJournalPromptAction}
              addAction={addJournalPromptAction.bind(null, journal.id)}
              listClassName="mt-2 flex flex-col gap-1.5"
            />
          </details>

          {journal.entries.length > 0 && (
            <section aria-label="Entries" className="flex flex-col gap-3">
              <h3 className="text-xs tracking-wide text-muted-foreground uppercase">Earlier entries</h3>
              <ul className="flex flex-col gap-3">
                {journal.entries.map((entry) => (
                  <li key={entry.id} className={`${softCardClassName} flex flex-col gap-1.5 px-4 py-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
                      </p>
                      <form action={deleteJournalEntryAction.bind(null, entry.id)}>
                        <DeleteIconButton
                          label="Delete entry"
                          confirmMessage="Delete this entry? This can't be undone."
                        />
                      </form>
                    </div>
                    <EditableEntryText
                      entryId={entry.id}
                      field="promptText"
                      text={entry.promptText}
                      saveAction={updateJournalEntryAction}
                      className="font-handwritten text-lg leading-snug"
                    />
                    <EditableEntryText
                      entryId={entry.id}
                      text={entry.content}
                      saveAction={updateJournalEntryAction}
                      className="text-[15px] leading-relaxed"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
