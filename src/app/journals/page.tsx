import Link from "next/link";
import { createJournalAction } from "@/app/actions/journals";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listJournals } from "@/lib/journals";
import { JournalForm } from "./journal-form";

export default async function JournalsPage() {
  const userId = await getCurrentUserId();
  const journals = await listJournals(db, userId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Journals</h1>

      <ul className="flex flex-col gap-2">
        {journals.length === 0 && (
          <p className="text-sm text-zinc-600">No journals yet — add one below.</p>
        )}
        {journals.map((journal) => (
          <li key={journal.id}>
            <Link
              href={`/journals/${journal.id}`}
              className="flex items-center rounded border px-3 py-2 hover:bg-zinc-50"
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
