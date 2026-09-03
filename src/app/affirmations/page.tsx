import Link from "next/link";
import {
  addAffirmationAction,
  deleteAffirmationAction,
  pickAffirmationAction,
  setTodayAffirmationAction,
} from "@/app/actions/affirmations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodayAffirmation, listAffirmations } from "@/lib/affirmations";

export default async function AffirmationsPage() {
  const userId = await getCurrentUserId();
  const [today, affirmations] = await Promise.all([
    getTodayAffirmation(db, userId),
    listAffirmations(db, userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Affirmations</h1>

      <div className="rounded border p-4 text-center">
        <p className="text-lg">
          {today ? today.text : "Add an affirmation below to get started."}
        </p>
        {today?.isOverride && (
          <p className="mt-1 text-xs text-zinc-500">Set just for today</p>
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
        <p className="text-sm text-zinc-600">
          A one-off override — it won&apos;t be added to your permanent list.
        </p>
        <form action={setTodayAffirmationAction} className="flex gap-2">
          <Input name="text" placeholder="Today, I..." required />
          <Button type="submit">Save for today</Button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-600">Your list</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {affirmations.length === 0 && (
            <p className="text-sm text-zinc-600">
              Nothing here yet — save one you found below.
            </p>
          )}
          {affirmations.map((affirmation) => (
            <li
              key={affirmation.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{affirmation.text}</span>
              <form action={deleteAffirmationAction.bind(null, affirmation.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addAffirmationAction} className="mt-3 flex gap-2">
          <Input name="text" placeholder="e.g. I am capable of hard things" required />
          <Button type="submit">Add to my list</Button>
        </form>
      </div>
    </div>
  );
}
