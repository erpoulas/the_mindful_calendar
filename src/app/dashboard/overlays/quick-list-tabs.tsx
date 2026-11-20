import Link from "next/link";
import { dashboardRoutes } from "@/lib/dashboard-routes";

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
          href={dashboardRoutes.quickLists(list.id)}
          // Loads each list while the popup is open, so switching tabs is instant.
          prefetch
          className={`rounded px-3 py-1 text-sm ${
            list.id === activeId
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-foreground hover:bg-secondary"
          }`}
        >
          {list.name}
        </Link>
      ))}
    </div>
  );
}
