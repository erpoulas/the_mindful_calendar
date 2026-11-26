import { addAffirmationAction, deleteAffirmationAction } from "@/app/actions/affirmations";
import { AffirmationOfTheDay } from "./affirmation-of-the-day";
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
      <AffirmationOfTheDay
        text={today?.text ?? null}
        keptUntilLabel={today?.isOverride ? keptUntilLabel(today.keepUntil) : null}
        hasList={affirmations.length > 0}
      />

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

/** keepUntil is a calendar day stored as midnight UTC, so read it in UTC. */
function keptUntilLabel(keepUntil: Date | null) {
  if (!keepUntil) return "Until you change it";
  const day = keepUntil.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `Until ${day}`;
}
