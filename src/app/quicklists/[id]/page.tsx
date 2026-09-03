import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addQuickListItemAction,
  deleteQuickListAction,
  toggleQuickListItemAction,
} from "@/app/actions/quick-lists";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQuickListDetail, listQuickLists } from "@/lib/quick-lists";
import { QuickListTabs } from "../quick-list-tabs";

export default async function QuickListDetailPage({
  params,
}: PageProps<"/quicklists/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [list, lists] = await Promise.all([
    getQuickListDetail(db, { userId, quickListId: id }),
    listQuickLists(db, userId),
  ]);

  if (!list) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <QuickListTabs lists={lists} activeId={list.id} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{list.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/quicklists/${list.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Edit
          </Link>
          <form action={deleteQuickListAction.bind(null, list.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this list and all its items? This can't be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {list.items.length === 0 && (
          <p className="text-sm text-zinc-600">No items yet — add one below.</p>
        )}
        {list.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <form action={toggleQuickListItemAction.bind(null, item.id, list.id)}>
              <button
                type="submit"
                aria-label={item.done ? "Mark not done" : "Mark done"}
                className={`h-5 w-5 rounded border ${
                  item.done ? "border-zinc-800 bg-zinc-800" : "border-zinc-400 bg-white"
                }`}
              />
            </form>
            <span className={`flex-1 ${item.done ? "text-zinc-500 line-through" : ""}`}>
              {item.text}
            </span>
            <Link
              href={`/calendar/new?title=${encodeURIComponent(item.text)}`}
              className="text-sm text-zinc-600 underline"
            >
              Schedule
            </Link>
          </li>
        ))}
      </ul>

      <form action={addQuickListItemAction.bind(null, list.id)} className="flex gap-2">
        <Input name="text" placeholder="Add an item" required />
        <Button type="submit">Add</Button>
      </form>
    </div>
  );
}
