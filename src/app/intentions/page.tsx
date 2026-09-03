import Link from "next/link";
import { createIntentionAction } from "@/app/actions/intentions";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { IntentionForm } from "./intention-form";

export default async function IntentionsPage() {
  const userId = await getCurrentUserId();
  const intentions = await listIntentions(db, userId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Intentions</h1>

      <ul className="flex flex-col gap-2">
        {intentions.length === 0 && (
          <p className="text-sm text-zinc-600">No intentions yet — add one below.</p>
        )}
        {intentions.map((intention) => (
          <li key={intention.id}>
            <Link
              href={`/intentions/${intention.id}`}
              className="flex items-center gap-2 rounded border px-3 py-2 hover:bg-zinc-50"
            >
              {intention.color && (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: intention.color }}
                />
              )}
              {intention.name}
            </Link>
          </li>
        ))}
      </ul>

      <IntentionForm
        action={createIntentionAction}
        heading="New intention"
        submitLabel="Add intention"
        pendingLabel="Adding..."
      />
    </div>
  );
}
