import { Trash2 } from "lucide-react";
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
import { Checklist } from "./checklist";
import { NewQuickListButton } from "./new-quick-list-button";
import { pageHeadingClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";
import { QuickListName } from "./quick-list-name";
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
      <div className="flex">
        <QuickListTabs lists={lists} activeId={list?.id} />
      </div>

      {lists.length === 0 && (
        <PopupEmptyState message="No lists yet. Groceries, packing, ideas: jot anything down.">
          <NewQuickListButton
            createAction={createQuickListAction}
            className={`${buttonVariants({ size: "sm" })} rounded-full`}
            inputClassName="text-center"
          >
            Start a list
          </NewQuickListButton>
        </PopupEmptyState>
      )}

      {list && (
        <>
          {/* Click the name to rename it in place. A long name wraps onto the
              next ruled line rather than being cut off. Each of its lines is
              one ruled line tall, nudged down so the letters stand on the line. */}
          <div className="flex min-h-(--paper-line) items-start justify-between gap-3">
            <QuickListName
              // A fresh box for each list, so switching tabs drops a half-typed name.
              key={list.id}
              listId={list.id}
              name={list.name}
              renameAction={updateQuickListAction}
              className={`${pageHeadingClassName} relative top-[calc(var(--paper-line)/2-0.45em)] leading-(--paper-line) wrap-break-word`}
            />
            {/* A small icon: deleting a list is rare, and the page is
                narrow, so the list's name gets the room. */}
            <div className="flex h-(--paper-line) shrink-0 items-end gap-1">
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
            // An empty list (such as one just made) is ready to type into.
            focusNewItem={list.items.length === 0}
          />
        </>
      )}
    </div>
  );
}
