import {
  addAffirmationAction,
  deleteAffirmationAction,
  pickAffirmationAction,
  setTodayAffirmationAction,
} from "@/app/actions/affirmations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemovableList } from "./removable-list";
import { getCurrentUserId } from "@/lib/auth";
import { storedAffirmations, storedTimezone } from "@/lib/stored-reads";
import { db } from "@/lib/db";
import { getTodayAffirmation } from "@/lib/affirmations";

export async function AffirmationsView() {
  const userId = await getCurrentUserId();
  // The list doesn't need the timezone, so it loads while the timezone does.
  const [today, affirmations] = await Promise.all([
    storedTimezone(userId).then((timeZone) =>
      getTodayAffirmation(db, userId, timeZone),
    ),
    storedAffirmations(userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded border p-4 text-center">
        <p className="text-lg">
          {today ? today.text : "Add an affirmation below to get started."}
        </p>
        {today?.isOverride && (
          <p className="mt-1 text-xs text-muted-foreground">Set just for today</p>
        )}
        {affirmations.length > 0 && (
          <form action={pickAffirmationAction} className="mt-3">
            <Button type="submit" variant="outline">
              Show a different one
            </Button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded border p-4">
        <h2 className="text-lg font-medium">Just for today</h2>
        <p className="text-sm text-muted-foreground">
          A one-off override — it won&apos;t be added to your permanent list.
        </p>
        <form action={setTodayAffirmationAction} className="flex gap-2">
          <Input name="text" placeholder="Today, I..." required />
          <Button type="submit">Save for today</Button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Your list</h2>
        <RemovableList
          items={affirmations.map(({ id, text }) => ({ id, text }))}
          emptyText="Nothing here yet — save one you found below."
          addPlaceholder="e.g. I am capable of hard things"
          addLabel="Add to my list"
          removeAction={deleteAffirmationAction}
          addAction={addAffirmationAction}
          listClassName="mt-2 flex flex-col gap-2"
        />
      </div>
    </div>
  );
}
