import {
  addDopamineMenuItemAction,
  deleteDopamineMenuItemAction,
  setDopamineMenuItemIntentionAction,
  updateDopamineMenuItemTextAction,
} from "@/app/actions/dopamine-menu";
import { createPostItAction } from "@/app/actions/post-its";
import { scheduleDopamineItemNowAction } from "@/app/actions/schedule-now";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRandomDopamineMenuItem } from "@/lib/dopamine-menu";
import { findIntentionColor } from "@/lib/intention-colors";
import { storedDopamineMenuItems, storedIntentions } from "@/lib/stored-reads";
import { DopamineMenuList, DopaminePick } from "./dopamine-menu-list";

export async function DopamineMenuView() {
  const userId = await getCurrentUserId();
  const [pick, items, intentions] = await Promise.all([
    getRandomDopamineMenuItem(db, userId),
    storedDopamineMenuItems(userId),
    storedIntentions(userId),
  ]);

  const menuItems = items.map(({ id, text, intentionId }) => ({ id, text, intentionId }));

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-center font-handwritten text-3xl">Dopamine Menu</h2>

      <DopaminePick
        items={menuItems}
        initialPickId={pick?.id ?? null}
        startNowAction={scheduleDopamineItemNowAction}
        createPostItAction={createPostItAction}
      />

      <section>
        <h3 className="font-handwritten text-lg">Your menu</h3>
        <DopamineMenuList
          items={menuItems}
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
