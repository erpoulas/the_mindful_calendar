import Link from "next/link";
import { Plus } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { pillTabClassName, pillTabsClassName } from "./photo-page-styles";

// One pill per list, plus a "+" pill at the end that starts a new list.
export function QuickListTabs({
  lists,
  activeId,
}: {
  lists: { id: string; name: string }[];
  activeId?: string;
}) {
  if (lists.length === 0) return null;

  return (
    <nav aria-label="Lists" className={pillTabsClassName}>
      {lists.map((list) => (
        <Link
          key={list.id}
          href={dashboardRoutes.quickLists(list.id)}
          // Loads each list while the popup is open, so switching tabs is instant.
          prefetch
          aria-current={list.id === activeId ? "page" : undefined}
          className={pillTabClassName(list.id === activeId)}
        >
          {list.name}
        </Link>
      ))}
      <Link
        href={dashboardRoutes.newQuickList()}
        aria-label="New list"
        title="New list"
        className={pillTabClassName(false)}
      >
        <Plus className="size-4" aria-hidden />
      </Link>
    </nav>
  );
}
