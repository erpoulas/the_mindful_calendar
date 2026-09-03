import Link from "next/link";
import { createQuickListAction } from "@/app/actions/quick-lists";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listQuickLists } from "@/lib/quick-lists";
import { QuickListForm } from "./quick-list-form";
import { QuickListTabs } from "./quick-list-tabs";

export default async function QuickListsPage() {
  const userId = await getCurrentUserId();
  const lists = await listQuickLists(db, userId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Quick Lists</h1>

      <QuickListTabs lists={lists} />

      {lists.length === 0 && (
        <p className="text-sm text-zinc-600">No lists yet — add one below.</p>
      )}

      <QuickListForm
        action={createQuickListAction}
        heading="New list"
        submitLabel="Add list"
        pendingLabel="Adding..."
      />
    </div>
  );
}
