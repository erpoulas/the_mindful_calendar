import Link from "next/link";
import { notFound } from "next/navigation";
import { updateSeasonAction } from "@/app/actions/seasons";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSeasonDetail } from "@/lib/seasons";
import { SeasonForm } from "../../season-form";

export default async function EditSeasonPage({
  params,
}: PageProps<"/seasons/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const detail = await getSeasonDetail(db, { userId, seasonId: id });
  if (!detail) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/seasons/${id}`} className="text-sm text-zinc-600 underline">
        ← {detail.season.name}
      </Link>

      <SeasonForm
        action={updateSeasonAction.bind(null, id)}
        heading="Edit season"
        submitLabel="Save"
        pendingLabel="Saving..."
        initialValues={detail.season}
      />
    </div>
  );
}
