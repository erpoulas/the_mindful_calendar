import Link from "next/link";
import { notFound } from "next/navigation";
import { updateIntentionAction } from "@/app/actions/intentions";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getIntentionDetail } from "@/lib/intentions";
import { IntentionForm } from "../../intention-form";

export default async function EditIntentionPage({
  params,
}: PageProps<"/intentions/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const detail = await getIntentionDetail(db, {
    userId,
    intentionId: id,
    referenceDate: new Date(),
  });

  if (!detail || detail.intention.isSystem) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/intentions/${id}`} className="text-sm text-zinc-600 underline">
        ← {detail.intention.name}
      </Link>

      <IntentionForm
        action={updateIntentionAction.bind(null, id)}
        heading="Edit intention"
        submitLabel="Save"
        pendingLabel="Saving..."
        initialValues={detail.intention}
      />
    </div>
  );
}
