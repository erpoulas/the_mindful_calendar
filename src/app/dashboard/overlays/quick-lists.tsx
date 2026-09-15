import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addQuickListItemAction,
  createQuickListAction,
  deleteQuickListAction,
  toggleQuickListItemAction,
  updateQuickListAction,
} from "@/app/actions/quick-lists";
import { promoteQuickListItemToPostItAction } from "@/app/actions/post-its";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQuickListDetail, listQuickLists } from "@/lib/quick-lists";
import { QuickListForm } from "./quick-list-form";
import { QuickListTabs } from "./quick-list-tabs";

export async function QuickListsView({ activeId }: { activeId?: string }) {
  const userId = await getCurrentUserId();
  const lists = await listQuickLists(db, userId);

  const effectiveId = activeId ?? lists[0]?.id;
  const list = effectiveId
    ? await getQuickListDetail(db, { userId, quickListId: effectiveId })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <QuickListTabs lists={lists} activeId={list?.id} />

      {!list && (
        <>
          {lists.length === 0 && (
            <p className="text-sm text-muted-foreground">No lists yet — add one below.</p>
          )}
          <QuickListForm
            action={createQuickListAction}
            heading="New list"
            submitLabel="Add list"
            pendingLabel="Adding..."
          />
        </>
      )}

      {list && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{list.name}</h2>
            <div className="flex gap-2">
              <Link
                href={`/dashboard?panel=quicklists&view=edit&id=${list.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
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
              <p className="text-sm text-muted-foreground">No items yet — add one below.</p>
            )}
            {list.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <form action={toggleQuickListItemAction.bind(null, item.id, list.id)}>
                  <button
                    type="submit"
                    aria-label={item.done ? "Mark not done" : "Mark done"}
                    className={`h-5 w-5 rounded border ${
                      item.done ? "border-primary bg-primary" : "border-border bg-background"
                    }`}
                  />
                </form>
                <span className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}>
                  {item.text}
                </span>
                <Link
                  href={`/dashboard?panel=calendar-event&view=new&title=${encodeURIComponent(item.text)}`}
                  className="text-sm text-muted-foreground underline"
                >
                  Schedule
                </Link>
                <form action={promoteQuickListItemToPostItAction.bind(null, item.id)}>
                  <button type="submit" className="text-sm text-muted-foreground underline">
                    → Post-it
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <form action={addQuickListItemAction.bind(null, list.id)} className="flex gap-2">
            <Input name="text" placeholder="Add an item" required />
            <Button type="submit">Add</Button>
          </form>
        </>
      )}
    </div>
  );
}

export async function QuickListEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();
  const list = await getQuickListDetail(db, { userId, quickListId: id });
  if (!list) notFound();

  return (
    <QuickListForm
      action={updateQuickListAction.bind(null, id)}
      heading="Edit list"
      submitLabel="Save"
      pendingLabel="Saving..."
      initialValues={{ name: list.name }}
    />
  );
}
