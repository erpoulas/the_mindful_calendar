import Link from "next/link";
import { notFound } from "next/navigation";
import { updateQuickListAction } from "@/app/actions/quick-lists";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQuickListDetail } from "@/lib/quick-lists";
import { QuickListForm } from "../../quick-list-form";

export default async function EditQuickListPage({
  params,
}: PageProps<"/quicklists/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const list = await getQuickListDetail(db, { userId, quickListId: id });
  if (!list) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href={`/quicklists/${id}`} className="text-sm text-zinc-600 underline">
        ← {list.name}
      </Link>

      <QuickListForm
        action={updateQuickListAction.bind(null, id)}
        heading="Edit list"
        submitLabel="Save"
        pendingLabel="Saving..."
        initialValues={{ name: list.name }}
      />
    </div>
  );
}
