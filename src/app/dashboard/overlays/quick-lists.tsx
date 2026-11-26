import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  addQuickListItemAction,
  createQuickListAction,
  deleteQuickListAction,
  deleteQuickListItemAction,
  toggleQuickListItemAction,
  updateQuickListAction,
  updateQuickListItemTextAction,
} from "@/app/actions/quick-lists";
import { promoteQuickListItemToPostItAction } from "@/app/actions/post-its";
import { scheduleQuickListItemNowAction } from "@/app/actions/schedule-now";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { storedQuickListDetail, storedQuickLists } from "@/lib/stored-reads";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { Checklist } from "./checklist";
import { pageHeadingClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";
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
    // Each row is one line of the ruled paper (--paper-line, set by the
    // popup frame), so the items below sit on its lines.
    <div className="flex flex-col">
      <div className="flex h-(--paper-line) items-center">
        <QuickListTabs lists={lists} activeId={list?.id} />
      </div>

      {lists.length === 0 && (
        <PopupEmptyState
          message="No lists yet. Groceries, packing, ideas: jot anything down."
          action={{ href: dashboardRoutes.newQuickList(), label: "Start a list" }}
        />
      )}

      {list && (
        <>
          <div className="flex h-(--paper-line) items-end justify-between gap-3">
            <h2 className={`${pageHeadingClassName} truncate leading-none`}>{list.name}</h2>
            {/* Small icons: renaming or deleting a list is rare, and the
                page is narrow, so the list's name gets the room. */}
            <div className="flex shrink-0 gap-1">
              <Link
                href={dashboardRoutes.editQuickList(list.id)}
                aria-label="Rename list"
                title="Rename list"
                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              >
                <Pencil aria-hidden />
              </Link>
              <form action={deleteQuickListAction.bind(null, list.id)}>
                <ConfirmSubmitButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete list"
                  title="Delete list"
                  className="text-destructive"
                  confirmMessage="Delete this list and all its items? This can't be undone."
                >
                  <Trash2 aria-hidden />
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <Checklist
            listId={list.id}
            items={list.items.map(({ id, text, done }) => ({ id, text, done }))}
            addPlaceholder="New item"
            toggleAction={toggleQuickListItemAction}
            addAction={addQuickListItemAction}
            promoteToPostItAction={promoteQuickListItemToPostItAction}
            editTextAction={updateQuickListItemTextAction}
            deleteAction={deleteQuickListItemAction}
            startNowAction={scheduleQuickListItemNowAction}
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
