import Link from "next/link";
import { createSeasonAction } from "@/app/actions/seasons";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listSeasons } from "@/lib/seasons";
import { SeasonForm } from "./season-form";

export default async function SeasonsPage() {
  const userId = await getCurrentUserId();
  const seasons = await listSeasons(db, userId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Seasons</h1>

      <ul className="flex flex-col gap-2">
        {seasons.length === 0 && (
          <p className="text-sm text-zinc-600">No seasons yet — add one below.</p>
        )}
        {seasons.map((season) => (
          <li key={season.id}>
            <Link
              href={`/seasons/${season.id}`}
              className="flex items-center rounded border px-3 py-2 hover:bg-zinc-50"
            >
              {season.name}
            </Link>
          </li>
        ))}
      </ul>

      <SeasonForm
        action={createSeasonAction}
        heading="New season"
        submitLabel="Add season"
        pendingLabel="Adding..."
      />
    </div>
  );
}
