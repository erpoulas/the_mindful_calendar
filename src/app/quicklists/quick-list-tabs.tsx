import Link from "next/link";

export function QuickListTabs({
  lists,
  activeId,
}: {
  lists: { id: string; name: string }[];
  activeId?: string;
}) {
  if (lists.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      {lists.map((list) => (
        <Link
          key={list.id}
          href={`/quicklists/${list.id}`}
          className={`rounded px-3 py-1 text-sm ${
            list.id === activeId
              ? "bg-zinc-800 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {list.name}
        </Link>
      ))}
    </div>
  );
}
