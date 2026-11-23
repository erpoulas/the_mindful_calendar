import Link from "next/link";
import { notFound } from "next/navigation";
import { BookHeart, BookOpen, Feather, Pencil, PenLine, Plus, Sparkles } from "lucide-react";
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
  "w-full rounded-xl border border-input bg-white/60 px-3 py-2 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

// The journal's look: soft, slightly lifted paper cards on the notebook art,
// big League Gothic page headings and Finger Paint for prompts.
const SOFT_CARD = "rounded-2xl border border-amber-900/10 bg-white/70 shadow-sm";
const SOFT_CARD_LINK = `${SOFT_CARD} block transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md`;
const PAGE_HEADING = "font-heading text-3xl tracking-wide uppercase";

// A friendly "nothing here yet" note, with an optional next step.
function JournalEmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className={`${SOFT_CARD} flex flex-col items-center gap-3 px-4 py-8 text-center`}>
      <Feather className="size-7 text-amber-700/60" aria-hidden />
      <p className="font-handwritten text-base">{message}</p>
      {action && (
        <Link href={action.href} prefetch className={buttonVariants({ size: "sm" })}>
          <PenLine aria-hidden />
          {action.label}
        </Link>
      )}
    </div>
  );
}

export async function JournalsListView() {
  const userId = await getCurrentUserId();
  const journals = await storedJournals(userId);

  return (
    <div className="flex flex-col gap-5">
      <h2 className={PAGE_HEADING}>My journals</h2>
      {journals.length === 0 ? (
        <JournalEmptyState
          message="No journals yet. Start one for anything you'd like to reflect on."
          action={{ href: dashboardRoutes.newJournal(), label: "Start a journal" }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {journals.map((journal) => (
            <li key={journal.id}>
              {/* prefetch: loads each journal's screen while the list is open. */}
              <Link
                href={dashboardRoutes.journal(journal.id)}
                prefetch
                className={`${SOFT_CARD_LINK} flex items-center gap-3 px-4 py-3`}
              >
                <BookHeart className="size-5 shrink-0 text-amber-700/70" aria-hidden />
                <span className="font-medium">{journal.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {journals.length > 0 && (
        <Link
          href={dashboardRoutes.newJournal()}
          className={`${buttonVariants({ variant: "outline", size: "sm" })} self-start rounded-full`}
        >
          <Plus aria-hidden />
          New journal
        </Link>
      )}
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
  const tabs = [
    { tab: "read", label: "Read", Icon: BookOpen },
    { tab: "write", label: "Write", Icon: PenLine },
  ] as const;
  return (
    <nav
      aria-label="Journal tabs"
      className="flex gap-1 self-start rounded-full border border-amber-900/10 bg-white/60 p-1"
    >
      {tabs.map(({ tab, label, Icon }) => (
        <Link
          key={tab}
          href={dashboardRoutes.journal(journalId, tab)}
          prefetch
          aria-current={tab === activeTab ? "page" : undefined}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1 text-sm transition ${
            tab === activeTab
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-white hover:text-foreground"
          }`}
        >
          <Icon className="size-4" aria-hidden />
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
    <div className="flex flex-col gap-5">
      <PopupListNavigation
        back={{ href: dashboardRoutes.journals(), label: "All journals" }}
        previous={previous && { href: dashboardRoutes.journal(previous.id), label: previous.name }}
        next={next && { href: dashboardRoutes.journal(next.id), label: next.name }}
      />
      <div className="flex items-start justify-between gap-3">
        <h2 className={PAGE_HEADING}>{journal.name}</h2>
        {/* Quiet buttons: renaming or deleting a journal is rare. */}
        <div className="flex shrink-0 gap-1">
          <Link
            href={dashboardRoutes.editJournal(journal.id)}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Rename
          </Link>
          <form action={deleteJournalAction.bind(null, journal.id)}>
            <ConfirmSubmitButton
              variant="ghost"
              size="sm"
              className="text-destructive"
              confirmMessage="Delete this journal and all its entries? This can't be undone."
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <JournalTabs journalId={journal.id} activeTab={activeTab} />

      {activeTab === "read" ? (
        journal.entries.length === 0 ? (
          <JournalEmptyState
            message="This page is still blank."
            action={{ href: dashboardRoutes.journal(journal.id, "write"), label: "Write the first entry" }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {journal.entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={dashboardRoutes.journalEntry(journal.id, entry.id)}
                  prefetch
                  className={`${SOFT_CARD_LINK} flex flex-col gap-1 px-4 py-3`}
                >
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
                  </p>
                  {entry.promptText && (
                    <p className="font-handwritten text-sm">{entry.promptText}</p>
                  )}
                  <p className="line-clamp-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {entry.content || "Not written yet. Tap to fill it in."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {suggestedPrompt && (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-100/70 px-4 py-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs tracking-wide text-amber-900/70 uppercase">
                    Need a nudge?
                  </span>
                  <span className="font-handwritten text-sm">{suggestedPrompt.text}</span>
                </div>
                <form action={pickJournalPromptAction}>
                  <Button type="submit" variant="ghost" size="sm">
                    Another
                  </Button>
                </form>
              </div>
            )}

            <form
              action={createJournalEntryAction.bind(null, journal.id)}
              className={`${SOFT_CARD} flex flex-col gap-3 p-4`}
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
                  Dear journal...
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

              <Button type="submit" className="self-end rounded-full px-5">
                Save entry
              </Button>
            </form>
          </div>

          {/* Folded away: it's set up once and rarely touched afterwards. */}
          <details className={`${SOFT_CARD} px-4 py-3`}>
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              My saved prompts ({journal.prompts.length})
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

// An entry's date and prompt, the same on its reading and editing screens.
function JournalEntryHeader({ title, createdAt }: { title: string; createdAt: Date }) {
  return (
    <header className="flex flex-col gap-1.5">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
      </p>
      <h2 className="font-handwritten text-xl leading-snug">{title}</h2>
    </header>
  );
}

// Reading one entry in full. Editing is a separate step behind the Edit
// button, so you can't change an entry by accident while reading it.
export async function JournalEntryView({ id, entryId }: { id: string; entryId: string }) {
  const { journal, entry } = await findJournalEntry(id, entryId);
  // Entries are listed newest first, so the one before is newer.
  const { previous: newer, next: older } = findListNeighbors(journal.entries, entry.id);

  return (
    <article className="flex flex-col gap-5">
      <PopupListNavigation
        back={{ href: dashboardRoutes.journal(id, "read"), label: journal.name }}
        previous={newer && { href: dashboardRoutes.journalEntry(id, newer.id), label: "Newer" }}
        next={older && { href: dashboardRoutes.journalEntry(id, older.id), label: "Older" }}
      />
      <JournalEntryHeader title={entry.promptText ?? journal.name} createdAt={entry.createdAt} />

      {entry.content ? (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      ) : (
        <JournalEmptyState message="Not written yet." />
      )}

      <Link
        href={dashboardRoutes.editJournalEntry(id, entry.id)}
        className={`${buttonVariants({ variant: "outline", size: "sm" })} self-end rounded-full`}
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
    <div className="flex flex-col gap-4">
      <PopupListNavigation back={{ href: entryHref, label: "Back to entry" }} />
      <JournalEntryHeader title={entry.promptText ?? journal.name} createdAt={entry.createdAt} />

      <form
        action={updateJournalEntryAction.bind(null, entry.id, id)}
        className="flex flex-col gap-3"
      >
        <textarea
          name="content"
          rows={14}
          defaultValue={entry.content ?? undefined}
          placeholder="Dear journal..."
          aria-label="Entry"
          className={TEXTAREA_CLASSES}
        />
        <div className="flex justify-end gap-2">
          <Link href={entryHref} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </Link>
          <Button type="submit" className="rounded-full px-5">
            Save
          </Button>
        </div>
      </form>

      <form action={deleteJournalEntryAction.bind(null, entry.id, id)} className="self-start">
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          className="text-destructive"
          confirmMessage="Delete this entry? This can't be undone."
        >
          Delete entry
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
