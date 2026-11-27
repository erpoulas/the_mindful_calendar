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

export async function DopamineMenuView() {
  const userId = await getCurrentUserId();
  const [pick, items, intentions] = await Promise.all([
    getRandomDopamineMenuItem(db, userId),
    storedDopamineMenuItems(userId),
    storedIntentions(userId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-center font-handwritten text-3xl">Dopamine Menu</h2>

      {/* Today's random pick, big, with quiet icons beside it. */}
      {pick ? (
        <section className="flex flex-col gap-1">
          <h3 className="font-handwritten text-lg">Need a lift? Try this:</h3>
          <div className="flex flex-col gap-1">
            <p className="text-xl leading-snug font-semibold wrap-anywhere">{pick.text}</p>
            <div className="-ml-1 flex items-center gap-0.5">
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
        </section>
      ) : (
        <p className="text-center text-sm opacity-80">
          Little things that feel good. Jot a few down, then roll for one.
        </p>
      )}

      <section>
        <h3 className="font-handwritten text-lg">Your menu</h3>
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
      </section>
    </div>
  );
}
