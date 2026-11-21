import Image from "next/image";
import {
  addDopamineMenuItemAction,
  deleteDopamineMenuItemAction,
  pickDopamineMenuItemAction,
} from "@/app/actions/dopamine-menu";
import { createPostItAction } from "@/app/actions/post-its";
import { scheduleDopamineItemNowAction } from "@/app/actions/schedule-now";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { storedDopamineMenuItems } from "@/lib/stored-reads";
import { db } from "@/lib/db";
import { getRandomDopamineMenuItem } from "@/lib/dopamine-menu";
import { CopyToPostItButton, ScheduleIconLink, StartNowButton } from "./item-actions";
import { RemovableList } from "./removable-list";

export async function DopamineMenuView() {
  const userId = await getCurrentUserId();
  const [pick, items] = await Promise.all([
    getRandomDopamineMenuItem(db, userId),
    storedDopamineMenuItems(userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Image
          src="/panel-art/dopamine-tracker.png"
          alt=""
          width={144}
          height={100}
          className="h-24 w-auto"
        />
      </div>
      <div className="rounded border p-4 text-center">
        <p className="text-lg">
          {pick ? pick.text : "Add something to your menu to get a pick."}
        </p>
        {items.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <form action={pickDopamineMenuItemAction}>
              <Button type="submit" variant="outline">
                Pick something else
              </Button>
            </form>
            {/* Put the pick on the calendar or the post-its in one click. */}
            {pick && (
              <>
                <ScheduleIconLink href={dashboardRoutes.newEvent({ title: pick.text })} />
                <StartNowButton itemId={pick.id} startNowAction={scheduleDopamineItemNowAction} />
                <CopyToPostItButton text={pick.text} createPostItAction={createPostItAction} />
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Your menu</h2>
        <RemovableList
          items={items.map(({ id, text }) => ({ id, text }))}
          emptyText="Nothing here yet — save something you found below."
          addPlaceholder="e.g. Take a 10 minute walk"
          addLabel="Add"
          removeAction={deleteDopamineMenuItemAction}
          addAction={addDopamineMenuItemAction}
          listClassName="mt-2 flex flex-col gap-2"
          createPostItAction={createPostItAction}
          startNowAction={scheduleDopamineItemNowAction}
        />
      </div>
    </div>
  );
}
