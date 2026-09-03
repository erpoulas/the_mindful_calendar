import Link from "next/link";
import {
  addDopamineMenuItemAction,
  deleteDopamineMenuItemAction,
  pickDopamineMenuItemAction,
} from "@/app/actions/dopamine-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRandomDopamineMenuItem, listDopamineMenuItems } from "@/lib/dopamine-menu";

export default async function DopamineMenuPage() {
  const userId = await getCurrentUserId();
  const [pick, items] = await Promise.all([
    getRandomDopamineMenuItem(db, userId),
    listDopamineMenuItems(db, userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/dashboard" className="text-sm text-zinc-600 underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-semibold">Dopamine Menu</h1>

      <div className="rounded border p-4 text-center">
        <p className="text-lg">
          {pick ? pick.text : "Add something to your menu to get a pick."}
        </p>
        {items.length > 0 && (
          <form action={pickDopamineMenuItemAction} className="mt-3">
            <Button type="submit" variant="outline">
              Pick something else
            </Button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-600">Your menu</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {items.length === 0 && (
            <p className="text-sm text-zinc-600">
              Nothing here yet — save something you found below.
            </p>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{item.text}</span>
              <form action={deleteDopamineMenuItemAction.bind(null, item.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>

        <form action={addDopamineMenuItemAction} className="mt-3 flex gap-2">
          <Input name="text" placeholder="e.g. Take a 10 minute walk" required />
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  );
}
