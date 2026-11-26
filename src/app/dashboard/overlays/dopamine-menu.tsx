import {
  addDopamineMenuItemAction,
  deleteDopamineMenuItemAction,
  pickDopamineMenuItemAction,
  setDopamineMenuItemIntentionAction,
  updateDopamineMenuItemTextAction,
} from "@/app/actions/dopamine-menu";
import { createPostItAction } from "@/app/actions/post-its";
import { scheduleDopamineItemNowAction } from "@/app/actions/schedule-now";
import { getCurrentUserId } from "@/lib/auth";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { db } from "@/lib/db";
import { getRandomDopamineMenuItem } from "@/lib/dopamine-menu";
import { findIntentionColor } from "@/lib/intention-colors";
import { storedDopamineMenuItems, storedIntentions } from "@/lib/stored-reads";
import { DopamineMenuList, RollAgainButton } from "./dopamine-menu-list";
import { CopyToPostItButton, ScheduleIconLink, StartNowButton } from "./item-actions";
import { pageHeadingClassName } from "./photo-page-styles";

// Small text on one ruled line of the paper (--paper-line, set by the popup
// frame), nudged down so the letters stand on the line, like list items.
const RULED_LINE_TEXT_CLASSES =
  "relative top-[calc(var(--paper-line,2.25rem)/2-0.6em)] text-[length:var(--paper-text,15px)] leading-(--paper-line) text-muted-foreground";

export async function DopamineMenuView() {
  const userId = await getCurrentUserId();
  const [pick, items, intentions] = await Promise.all([
    getRandomDopamineMenuItem(db, userId),
    storedDopamineMenuItems(userId),
    storedIntentions(userId),
  ]);

  return (
    // Each row is one line of the ruled paper, like Quick Lists.
    <div className="flex flex-col">
      <p className={RULED_LINE_TEXT_CLASSES}>
        {pick ? "Need a lift? Try this:" : "Little things that feel good. Jot a few down, then roll for one."}
      </p>

      {/* Today's random pick, as big as a list's name. A long one wraps
          onto the next ruled line. Its icons sit at the end of the line. */}
      {pick && (
        <div className="flex min-h-(--paper-line) items-start justify-between gap-3">
          <h2
            className={`${pageHeadingClassName} text-[length:calc(var(--paper-text,15px)*2)]! relative top-[calc(var(--paper-line)/2-0.45em)] leading-(--paper-line) wrap-anywhere`}
          >
            {pick.text}
          </h2>
          <div className="flex h-(--paper-line) shrink-0 items-end gap-0.5">
            <RollAgainButton rollAction={pickDopamineMenuItemAction} />
            <ScheduleIconLink
              href={dashboardRoutes.newEvent({
                title: pick.text,
                intentionId: pick.intentionId ?? undefined,
              })}
            />
            <StartNowButton itemId={pick.id} startNowAction={scheduleDopamineItemNowAction} />
            <CopyToPostItButton text={pick.text} createPostItAction={createPostItAction} />
          </div>
        </div>
      )}

      {/* One blank ruled line between the pick and the menu. */}
      <div className="h-(--paper-line)" />

      <DopamineMenuList
        items={items.map(({ id, text, intentionId }) => ({ id, text, intentionId }))}
        intentions={intentions.map(({ id, name, color }) => ({
          id,
          name,
          colorHex: findIntentionColor(color)?.hex ?? null,
        }))}
        addAction={addDopamineMenuItemAction}
        editTextAction={updateDopamineMenuItemTextAction}
        deleteAction={deleteDopamineMenuItemAction}
        startNowAction={scheduleDopamineItemNowAction}
        createPostItAction={createPostItAction}
        setIntentionAction={setDopamineMenuItemIntentionAction}
      />
    </div>
  );
}
