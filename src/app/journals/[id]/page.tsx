import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addJournalPromptAction,
  createJournalEntryAction,
  deleteJournalAction,
  deleteJournalPromptAction,
  pickJournalPromptAction,
} from "@/app/actions/journals";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournalDetail, getRandomJournalPrompt } from "@/lib/journals";

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
};

export default async function JournalDetailPage({
  params,
}: PageProps<"/journals/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [journal, suggestedPrompt] = await Promise.all([
    getJournalDetail(db, { userId, journalId: id }),
    getRandomJournalPrompt(db, { userId, journalId: id }),
  ]);
  if (!journal) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/journals" className="text-sm text-zinc-600 underline">
        ← Journals
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{journal.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/journals/${journal.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
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
        <h2 className="text-lg font-medium">New entry</h2>

        {suggestedPrompt && (
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-zinc-600">
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
        <h2 className="text-sm font-medium text-zinc-600">Prompt pool</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {journal.prompts.length === 0 && (
            <p className="text-sm text-zinc-600">No saved prompts yet.</p>
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
        <h2 className="text-sm font-medium text-zinc-600">Entries</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {journal.entries.length === 0 && (
            <p className="text-sm text-zinc-600">No entries yet.</p>
          )}
          {journal.entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/journals/${journal.id}/entries/${entry.id}/edit`}
                className="block rounded border px-3 py-2 hover:bg-zinc-50"
              >
                <p className="text-xs text-zinc-500">
                  {entry.createdAt.toLocaleString(undefined, DATETIME_FORMAT)}
                </p>
                {entry.promptText && (
                  <p className="text-sm font-medium">{entry.promptText}</p>
                )}
                <p className="text-sm text-zinc-600">
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
