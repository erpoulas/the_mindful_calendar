import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  addJournalPromptAction,
  createJournalAction,
  createJournalEntryAction,
  deleteJournalAction,
  deleteJournalEntryAction,
  deleteJournalPromptAction,
  pickJournalPromptAction,
  updateJournalAction,
  updateJournalEntryAction,
} from "@/app/actions/journals";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { storedJournalDetail, storedJournals } from "@/lib/stored-reads";
import { db } from "@/lib/db";
import { dashboardRoutes, type JournalTab } from "@/lib/dashboard-routes";
import { getRandomJournalPrompt } from "@/lib/journals";
import { findListNeighbors } from "@/lib/list-neighbors";
import { JournalForm } from "./journal-form";
import { PopupListNavigation } from "./popup-list-navigation";
import { RemovableList } from "./removable-list";

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

const TEXTAREA_CLASSES =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export async function JournalsListView() {
  const userId = await getCurrentUserId();
  const journals = await storedJournals(userId);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {journals.length === 0 && (
          <p className="text-sm text-muted-foreground">No journals yet — add one below.</p>
        )}
        {journals.map((journal) => (
          <li key={journal.id}>
            {/* prefetch: loads each journal's screen while the list is open. */}
            <Link
              href={dashboardRoutes.journal(journal.id)}
              prefetch
              className="flex items-center px-1 py-1 hover:underline"
            >
              {journal.name}
            </Link>
          </li>
        ))}
      </ul>

      <Link href={dashboardRoutes.newJournal()} className="text-sm hover:underline">
        + Create new journal
      </Link>
    </div>
  );
}

export function JournalCreateView() {
  return (
    <JournalForm
      action={createJournalAction}
      heading="New journal"
      submitLabel="Add journal"
      pendingLabel="Adding..."
    />
  );
}

// The Read / Write switch on a journal's screen. Both tabs are prefetched,
// so switching is instant.
function JournalTabs({ journalId, activeTab }: { journalId: string; activeTab: JournalTab }) {
  const tabs: { tab: JournalTab; label: string }[] = [
    { tab: "read", label: "Read" },
    { tab: "write", label: "Write" },
  ];
  return (
    <nav aria-label="Journal tabs" className="flex gap-2 border-b pb-2">
      {tabs.map(({ tab, label }) => (
        <Link
          key={tab}
          href={dashboardRoutes.journal(journalId, tab)}
          prefetch
          aria-current={tab === activeTab ? "page" : undefined}
          className={`rounded px-3 py-1 text-sm ${
            tab === activeTab
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-foreground hover:bg-secondary"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export async function JournalDetailView({ id, tab }: { id: string; tab?: JournalTab }) {
  const userId = await getCurrentUserId();

  const [journal, journals, suggestedPrompt] = await Promise.all([
    storedJournalDetail(userId, id),
    storedJournals(userId),
    getRandomJournalPrompt(db, { userId, journalId: id }),
  ]);
  if (!journal) notFound();
  const { previous, next } = findListNeighbors(journals, journal.id);
  // A new, empty journal opens on Write: there's nothing to read yet.
  const activeTab = tab ?? (journal.entries.length === 0 ? "write" : "read");

  return (
    <div className="flex flex-col gap-6">
      <PopupListNavigation
        back={{ href: dashboardRoutes.journals(), label: "All journals" }}
        previous={previous && { href: dashboardRoutes.journal(previous.id), label: previous.name }}
        next={next && { href: dashboardRoutes.journal(next.id), label: next.name }}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{journal.name}</h2>
        <div className="flex gap-2">
          <Link
            href={dashboardRoutes.editJournal(journal.id)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <form action={deleteJournalAction.bind(null, journal.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this journal and all its entries? This can't be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <JournalTabs journalId={journal.id} activeTab={activeTab} />

      {activeTab === "read" ? (
        <ul className="flex flex-col gap-3">
          {journal.entries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No entries yet.{" "}
              <Link href={dashboardRoutes.journal(journal.id, "write")} className="underline">
                Write the first one
              </Link>
            </p>
          )}
          {journal.entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={dashboardRoutes.journalEntry(journal.id, entry.id)}
                prefetch
                className="block rounded border px-3 py-2 hover:bg-accent"
              >
                <p className="text-xs text-muted-foreground">
                  {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
                </p>
                {entry.promptText && (
                  <p className="text-sm font-medium">{entry.promptText}</p>
                )}
                <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                  {entry.content || "Not written yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {suggestedPrompt && (
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>Try: &ldquo;{suggestedPrompt.text}&rdquo;</span>
                <form action={pickJournalPromptAction}>
                  <Button type="submit" variant="ghost" size="sm">
                    Another
                  </Button>
                </form>
              </div>
            )}

            <form
              action={createJournalEntryAction.bind(null, journal.id)}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="promptText" className="text-sm font-medium">
                  Prompt (optional)
                </label>
                <Input
                  id="promptText"
                  name="promptText"
                  list="journal-prompts"
                  placeholder="Pick from the list, or write your own"
                />
                <datalist id="journal-prompts">
                  {journal.prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.text} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="content" className="text-sm font-medium">
                  Entry
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={8}
                  placeholder="Write now, or leave blank and fill it in later"
                  className={TEXTAREA_CLASSES}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="startAt" className="text-sm font-medium">
                  Schedule for later (optional)
                </label>
                <Input id="startAt" name="startAt" type="datetime-local" />
              </div>

              <Button type="submit">Save entry</Button>
            </form>
          </div>

          {/* Folded away: it's set up once and rarely touched afterwards. */}
          <details>
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              Prompt pool ({journal.prompts.length})
            </summary>
            <RemovableList
              items={journal.prompts.map(({ id, text }) => ({ id, text }))}
              emptyText="No saved prompts yet."
              addPlaceholder="Save a prompt you found elsewhere"
              addLabel="Save"
              removeAction={deleteJournalPromptAction}
              addAction={addJournalPromptAction.bind(null, journal.id)}
              listClassName="mt-2 flex flex-col gap-1.5"
            />
          </details>
        </>
      )}
    </div>
  );
}

export async function JournalEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const journal = await storedJournalDetail(userId, id);
  if (!journal) notFound();

  return (
    <JournalForm
      action={updateJournalAction.bind(null, id)}
      heading="Edit journal"
      submitLabel="Save"
      pendingLabel="Saving..."
      initialValues={{ name: journal.name }}
    />
  );
}

// Finds one entry of a journal, or shows the not-found screen.
async function findJournalEntry(id: string, entryId: string) {
  const userId = await getCurrentUserId();

  const journal = await storedJournalDetail(userId, id);
  if (!journal) notFound();

  const entry = journal.entries.find((e) => e.id === entryId);
  if (!entry) notFound();
  return { journal, entry };
}

// Reading one entry in full. Editing is a separate step behind the Edit
// button, so you can't change an entry by accident while reading it.
export async function JournalEntryView({ id, entryId }: { id: string; entryId: string }) {
  const { journal, entry } = await findJournalEntry(id, entryId);
  // Entries are listed newest first, so the one before is newer.
  const { previous: newer, next: older } = findListNeighbors(journal.entries, entry.id);

  return (
    <article className="flex flex-col gap-4">
      <PopupListNavigation
        back={{ href: dashboardRoutes.journal(id, "read"), label: journal.name }}
        previous={newer && { href: dashboardRoutes.journalEntry(id, newer.id), label: "Newer" }}
        next={older && { href: dashboardRoutes.journalEntry(id, older.id), label: "Older" }}
      />
      <header className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
        </p>
        <h2 className="text-lg font-medium">{entry.promptText ?? journal.name}</h2>
      </header>

      {entry.content ? (
        <p className="leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Not written yet.</p>
      )}

      <Link
        href={dashboardRoutes.editJournalEntry(id, entry.id)}
        className={`${buttonVariants({ variant: "outline", size: "sm" })} self-end`}
      >
        <Pencil aria-hidden />
        {entry.content ? "Edit" : "Write it now"}
      </Link>
    </article>
  );
}

export async function JournalEntryEditView({ id, entryId }: { id: string; entryId: string }) {
  const { journal, entry } = await findJournalEntry(id, entryId);
  const entryHref = dashboardRoutes.journalEntry(id, entry.id);

  return (
    <div className="flex flex-col gap-3">
      <PopupListNavigation back={{ href: entryHref, label: "Back to entry" }} />
      <h2 className="text-lg font-medium">{entry.promptText ?? journal.name}</h2>
      <p className="text-xs text-muted-foreground">
        {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
      </p>

      <form
        action={updateJournalEntryAction.bind(null, entry.id, id)}
        className="flex flex-col gap-3"
      >
        <textarea
          name="content"
          rows={14}
          defaultValue={entry.content ?? undefined}
          placeholder="Write your entry..."
          className={TEXTAREA_CLASSES}
        />
        <div className="flex justify-end gap-2">
          <Link href={entryHref} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </Link>
          <Button type="submit">Save</Button>
        </div>
      </form>

      <form action={deleteJournalEntryAction.bind(null, entry.id, id)}>
        <ConfirmSubmitButton confirmMessage="Delete this entry? This can't be undone.">
          Delete entry
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
