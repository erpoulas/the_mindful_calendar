import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createIntentionAction,
  deleteIntentionAction,
  updateIntentionAction,
  updateIntentionColorAction,
} from "@/app/actions/intentions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { storedIntentions, storedTimezone } from "@/lib/stored-reads";
import { db } from "@/lib/db";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { getIntentionDetail } from "@/lib/intentions";
import { findListNeighbors } from "@/lib/list-neighbors";
import { toWallClockDate } from "@/lib/wall-clock";
import { IntentionForm } from "./intention-form";
import { IntentionRow } from "./intention-row";
import { PopupListNavigation } from "./popup-list-navigation";

export async function IntentionsListView() {
  const userId = await getCurrentUserId();
  const intentions = await storedIntentions(userId);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {intentions.length === 0 && (
          <p className="text-sm text-muted-foreground">No intentions yet — add one below.</p>
        )}
        {intentions.map(({ id, name, color, isSystem }) => (
          <IntentionRow
            key={id}
            intention={{ id, name, color, isSystem }}
            recolorAction={updateIntentionColorAction}
            deleteAction={deleteIntentionAction}
          />
        ))}
      </ul>

      <IntentionForm
        action={createIntentionAction}
        heading="New intention"
        submitLabel="Add intention"
        pendingLabel="Adding..."
      />
    </div>
  );
}

export async function IntentionDetailView({ id }: { id: string }) {
  const userId = await getCurrentUserId();
  const [timeZone, intentions] = await Promise.all([
    storedTimezone(userId),
    storedIntentions(userId),
  ]);

  const detail = await getIntentionDetail(db, {
    userId,
    intentionId: id,
    referenceDate: toWallClockDate(new Date(), timeZone),
  });

  if (!detail) notFound();

  const maxCount = Math.max(1, ...detail.weeklyStreak);
  const { previous, next } = findListNeighbors(intentions, detail.intention.id);

  return (
    <div className="flex flex-col gap-6">
      <PopupListNavigation
        back={{ href: dashboardRoutes.intentions(), label: "All intentions" }}
        previous={previous && { href: dashboardRoutes.intention(previous.id), label: previous.name }}
        next={next && { href: dashboardRoutes.intention(next.id), label: next.name }}
      />
      <h2 className="text-lg font-semibold">{detail.intention.name}</h2>

      {!detail.intention.isSystem && (
        <div className="flex gap-2">
          <Link
            href={dashboardRoutes.editIntention(detail.intention.id)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <form action={deleteIntentionAction.bind(null, detail.intention.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this intention? This can't be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Last 8 weeks</h3>
        <div className="mt-2 flex h-20 items-end gap-1.5">
          {detail.weeklyStreak.map((count, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary"
              style={{
                height: `${(count / maxCount) * 100}%`,
                minHeight: count > 0 ? 4 : 1,
              }}
              title={`${count} event${count === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export async function IntentionEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const detail = await getIntentionDetail(db, {
    userId,
    intentionId: id,
    referenceDate: new Date(),
  });

  if (!detail || detail.intention.isSystem) notFound();

  return (
    <IntentionForm
      action={updateIntentionAction.bind(null, id)}
      heading="Edit intention"
      submitLabel="Save"
      pendingLabel="Saving..."
      initialValues={detail.intention}
    />
  );
}
