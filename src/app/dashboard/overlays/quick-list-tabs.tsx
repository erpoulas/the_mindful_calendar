import Link from "next/link";
import { Plus } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { pillTabClassName, pillTabsClassName } from "./photo-page-styles";

// One pill per list, plus a "+" pill at the end that starts a new list.
// The tabs sit on the popup's ruled paper, sized from its line spacing
// (--paper-line) so they never spill onto the list name below. With many
// lists they wrap onto the next line (never a sideways scroll): each row of
// pills is a line minus 6px, with 6px between rows and 3px of edge (1px
// border + 2px padding) above and below, so n rows are exactly n lines.
const FIT_TABS_CLASSES =
  "max-w-full gap-x-1! gap-y-1.5! rounded-[calc(var(--paper-line,2.25rem)/2)]! px-0.5! py-0.5!";
const FIT_TAB_CLASSES = "h-[calc(var(--paper-line,2.25rem)-6px)] min-w-0 py-0! whitespace-nowrap";
export function QuickListTabs({
  lists,
  activeId,
}: {
  lists: { id: string; name: string }[];
  activeId?: string;
}) {
  if (lists.length === 0) return null;

  return (
    <nav aria-label="Lists" className={`${pillTabsClassName} ${FIT_TABS_CLASSES}`}>
      {lists.map((list) => (
        <Link
          key={list.id}
          href={dashboardRoutes.quickLists(list.id)}
          // Loads each list while the popup is open, so switching tabs is instant.
          prefetch
          title={list.name}
          aria-current={list.id === activeId ? "page" : undefined}
          className={`${pillTabClassName(list.id === activeId)} ${FIT_TAB_CLASSES}`}
        >
          {/* Long names end in "…"; hovering shows the whole name. */}
          <span className="max-w-[10rem] truncate">{list.name}</span>
        </Link>
      ))}
      <Link
        href={dashboardRoutes.newQuickList()}
        aria-label="New list"
        title="New list"
        className={`${pillTabClassName(false)} ${FIT_TAB_CLASSES}`}
      >
        <Plus className="size-4" aria-hidden />
      </Link>
    </nav>
  );
}
