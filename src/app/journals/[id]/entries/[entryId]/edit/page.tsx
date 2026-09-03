import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteJournalEntryAction,
  updateJournalEntryAction,
} from "@/app/actions/journals";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournalDetail } from "@/lib/journals";

export default async function EditJournalEntryPage({
  params,
}: PageProps<"/journals/[id]/entries/[entryId]/edit">) {
  const { id, entryId } = await params;
  const userId = await getCurrentUserId();

  const journal = await getJournalDetail(db, { userId, journalId: id });
  if (!journal) notFound();

  const entry = journal.entries.find((e) => e.id === entryId);
  if (!entry) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/journals/${id}`} className="text-sm text-zinc-600 underline">
        ← {journal.name}
      </Link>

      <div className="flex flex-col gap-3 rounded border p-4">
        <h1 className="text-lg font-medium">
          {entry.promptText ?? "Entry"}
        </h1>
        <p className="text-xs text-zinc-500">
          {entry.createdAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}
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
    </div>
  );
}
