import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getIntentionDetail } from "@/lib/intentions";

export default async function IntentionDetailPage({
  params,
}: PageProps<"/intentions/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const detail = await getIntentionDetail(db, {
    userId,
    intentionId: id,
    referenceDate: new Date(),
  });

  if (!detail) notFound();

  const maxCount = Math.max(1, ...detail.weeklyStreak);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/intentions" className="text-sm text-zinc-600 underline">
        ← Intentions
      </Link>

      <h1 className="text-2xl font-semibold">{detail.intention.name}</h1>

      <div>
        <h2 className="text-sm font-medium text-zinc-600">Last 8 weeks</h2>
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
