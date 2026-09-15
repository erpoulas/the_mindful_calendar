import Link from "next/link";
import { notFound } from "next/navigation";
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
import { db } from "@/lib/db";
import { getJournalDetail, getRandomJournalPrompt, listJournals } from "@/lib/journals";
import { JournalForm } from "./journal-form";

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

export async function JournalsListView() {
  const userId = await getCurrentUserId();
  const journals = await listJournals(db, userId);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {journals.length === 0 && (
          <p className="text-sm text-muted-foreground">No journals yet — add one below.</p>
        )}
        {journals.map((journal) => (
          <li key={journal.id}>
            <Link
              href={`/dashboard?panel=journals&view=detail&id=${journal.id}`}
              className="flex items-center rounded border px-3 py-2 hover:bg-accent"
            >
              {journal.name}
            </Link>
          </li>
        ))}
      </ul>

      <JournalForm
        action={createJournalAction}
        heading="New journal"
        submitLabel="Add journal"
        pendingLabel="Adding..."
      />
    </div>
  );
}

export async function JournalDetailView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [journal, suggestedPrompt] = await Promise.all([
    getJournalDetail(db, { userId, journalId: id }),
    getRandomJournalPrompt(db, { userId, journalId: id }),
  ]);
  if (!journal) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{journal.name}</h2>
        <div className="flex gap-2">
          <Link
            href={`/dashboard?panel=journals&view=edit&id=${journal.id}`}
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

      <div className="rounded border p-4">
        <h3 className="text-lg font-medium">New entry</h3>

        {suggestedPrompt && (
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
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
          className="mt-3 flex flex-col gap-3"
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
              rows={4}
              placeholder="Write now, or leave blank and fill it in later"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
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

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Prompt pool</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {journal.prompts.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved prompts yet.</p>
          )}
          {journal.prompts.map((prompt) => (
            <li key={prompt.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{prompt.text}</span>
              <form action={deleteJournalPromptAction.bind(null, prompt.id, journal.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>

        <form
          action={addJournalPromptAction.bind(null, journal.id)}
          className="mt-3 flex gap-2"
        >
          <Input name="text" placeholder="Save a prompt you found elsewhere" required />
          <Button type="submit">Save</Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Entries</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {journal.entries.length === 0 && (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          )}
          {journal.entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/dashboard?panel=journals&view=entry-edit&id=${journal.id}&entryId=${entry.id}`}
                className="block rounded border px-3 py-2 hover:bg-accent"
              >
                <p className="text-xs text-muted-foreground">
                  {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
                </p>
                {entry.promptText && (
                  <p className="text-sm font-medium">{entry.promptText}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {entry.content ? entry.content.slice(0, 120) : "Not written yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function JournalEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const journal = await getJournalDetail(db, { userId, journalId: id });
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

export async function JournalEntryEditView({
  id,
  entryId,
}: {
  id: string;
  entryId: string;
}) {
  const userId = await getCurrentUserId();

  const journal = await getJournalDetail(db, { userId, journalId: id });
  if (!journal) notFound();

  const entry = journal.entries.find((e) => e.id === entryId);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{entry.promptText ?? "Entry"}</h2>
      <p className="text-xs text-muted-foreground">
        {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
      </p>

      <form
        action={updateJournalEntryAction.bind(null, entry.id, id)}
        className="flex flex-col gap-3"
      >
        <textarea
          name="content"
          rows={8}
          defaultValue={entry.content ?? undefined}
          placeholder="Write your entry..."
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <Button type="submit">Save</Button>
      </form>

      <form action={deleteJournalEntryAction.bind(null, entry.id, id)}>
        <ConfirmSubmitButton confirmMessage="Delete this entry? This can't be undone.">
          Delete entry
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
