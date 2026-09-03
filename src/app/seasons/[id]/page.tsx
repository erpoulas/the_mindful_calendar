import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSeasonAction, reflectOnSeasonAction } from "@/app/actions/seasons";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSeasonDetail } from "@/lib/seasons";
import { ReflectionForm } from "../reflection-form";

export default async function SeasonDetailPage({
  params,
}: PageProps<"/seasons/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const detail = await getSeasonDetail(db, { userId, seasonId: id });
  if (!detail) notFound();

  const { season, intentionBreakdown } = detail;
  const maxCount = Math.max(1, ...intentionBreakdown.map((b) => b.count));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/seasons" className="text-sm text-zinc-600 underline">
        ← Seasons
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{season.name}</h1>
        {(season.startDate || season.endDate) && (
          <p className="mt-1 text-sm text-zinc-500">
            {season.startDate?.toLocaleDateString() ?? "…"} –{" "}
            {season.endDate?.toLocaleDateString() ?? "…"}
          </p>
        )}
        {season.note && <p className="mt-2 text-sm text-zinc-700">{season.note}</p>}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/seasons/${season.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
        <form action={deleteSeasonAction.bind(null, season.id)}>
          <ConfirmSubmitButton confirmMessage="Delete this season? This can't be undone.">
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-600">
          Time breakdown by intention{season.startDate && season.endDate ? "" : " (all time)"}
        </h2>
        {intentionBreakdown.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-600">No intentions yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {intentionBreakdown.map((b) => (
              <li key={b.intentionId} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate">{b.name}</span>
                <div className="h-3 flex-1 rounded bg-zinc-100">
                  <div
                    className="h-3 rounded bg-zinc-800"
                    style={{ width: `${(b.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-zinc-500">{b.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-600">Reflection</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Available any time — you don&apos;t have to wait for the season to end.
        </p>
        <div className="mt-2">
          <ReflectionForm
            action={reflectOnSeasonAction.bind(null, season.id)}
            initialText={season.reflectionText}
          />
        </div>
      </div>
    </div>
  );
}
