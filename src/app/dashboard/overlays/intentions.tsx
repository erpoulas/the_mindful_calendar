import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createIntentionAction,
  deleteIntentionAction,
  updateIntentionAction,
} from "@/app/actions/intentions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getIntentionDetail, listIntentions } from "@/lib/intentions";
import { IntentionForm } from "./intention-form";

export async function IntentionsListView() {
  const userId = await getCurrentUserId();
  const intentions = await listIntentions(db, userId);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {intentions.length === 0 && (
          <p className="text-sm text-zinc-600">No intentions yet — add one below.</p>
        )}
        {intentions.map((intention) => (
          <li key={intention.id}>
            <Link
              href={`/dashboard?panel=intentions&view=detail&id=${intention.id}`}
              className="flex items-center gap-2 rounded border px-3 py-2 hover:bg-zinc-50"
            >
              {intention.color && (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: intention.color }}
                />
              )}
              {intention.name}
            </Link>
          </li>
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

  const detail = await getIntentionDetail(db, {
    userId,
    intentionId: id,
    referenceDate: new Date(),
  });

  if (!detail) notFound();

  const maxCount = Math.max(1, ...detail.weeklyStreak);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{detail.intention.name}</h2>

      {!detail.intention.isSystem && (
        <div className="flex gap-2">
          <Link
            href={`/dashboard?panel=intentions&view=edit&id=${detail.intention.id}`}
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
        <h3 className="text-sm font-medium text-zinc-600">Last 8 weeks</h3>
        <div className="mt-2 flex h-20 items-end gap-1.5">
          {detail.weeklyStreak.map((count, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-zinc-800"
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
