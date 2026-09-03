import Link from "next/link";
import { notFound } from "next/navigation";
import { updateJournalAction } from "@/app/actions/journals";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournalDetail } from "@/lib/journals";
import { JournalForm } from "../../journal-form";

export default async function EditJournalPage({
  params,
}: PageProps<"/journals/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const journal = await getJournalDetail(db, { userId, journalId: id });
  if (!journal) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/journals/${id}`} className="text-sm text-zinc-600 underline">
        ← {journal.name}
      </Link>

      <JournalForm
        action={updateJournalAction.bind(null, id)}
        heading="Edit journal"
        submitLabel="Save"
        pendingLabel="Saving..."
        initialValues={{ name: journal.name }}
      />
    </div>
  );
}
