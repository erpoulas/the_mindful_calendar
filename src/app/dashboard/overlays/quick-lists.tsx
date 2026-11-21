import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addQuickListItemAction,
  createQuickListAction,
  deleteQuickListAction,
  toggleQuickListItemAction,
  updateQuickListAction,
  updateQuickListItemTextAction,
} from "@/app/actions/quick-lists";
import { promoteQuickListItemToPostItAction } from "@/app/actions/post-its";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { storedQuickListDetail, storedQuickLists } from "@/lib/stored-reads";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { Checklist } from "./checklist";
import { QuickListForm } from "./quick-list-form";
import { QuickListTabs } from "./quick-list-tabs";

export async function QuickListsView({ activeId }: { activeId?: string }) {
  const userId = await getCurrentUserId();
  // With a list picked in the URL, load it alongside the tabs. Otherwise the
  // first list is shown, which needs the tabs first to know which it is.
  const [lists, pickedList] = await Promise.all([
    storedQuickLists(userId),
    activeId ? storedQuickListDetail(userId, activeId) : null,
  ]);
  const firstId = lists[0]?.id;
  const list = activeId
    ? pickedList
    : firstId
      ? await storedQuickListDetail(userId, firstId)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <QuickListTabs lists={lists} activeId={list?.id} />

      {lists.length === 0 && (
        <p className="text-sm text-muted-foreground">No lists yet — create one to get started.</p>
      )}

      <Link href={dashboardRoutes.newQuickList()} className="text-sm hover:underline">
        + Create new list
      </Link>

      {list && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{list.name}</h2>
            <div className="flex gap-2">
              <Link
                href={dashboardRoutes.editQuickList(list.id)}
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

          <Checklist
            listId={list.id}
            items={list.items.map(({ id, text, done }) => ({ id, text, done }))}
            emptyText="No items yet — add one below."
            addPlaceholder="Add an item"
            toggleAction={toggleQuickListItemAction}
            addAction={addQuickListItemAction}
            promoteToPostItAction={promoteQuickListItemToPostItAction}
            editTextAction={updateQuickListItemTextAction}
            listClassName="flex flex-col gap-2"
            formClassName="flex gap-2"
          />
        </>
      )}
    </div>
  );
}

export function QuickListCreateView() {
  return (
    <QuickListForm
      action={createQuickListAction}
      heading="New list"
      submitLabel="Add list"
      pendingLabel="Adding..."
    />
  );
}

export async function QuickListEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();
  const list = await storedQuickListDetail(userId, id);
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
