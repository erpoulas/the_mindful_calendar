import Link from "next/link";
import { Plus } from "lucide-react";
import { NewNameButton } from "./new-name-button";
import { pillTabClassName, pillTabsClassName } from "./photo-page-styles";

// One pill per named thing (a quick list, a journal), plus a "+" pill at the
// end that turns into a name box right there to start a new one. Switching
// is one click, with no separate "all lists" screen in between.
// On ruled paper the tabs are sized from its line spacing (--paper-line) so
// they never spill onto the name below, and the text grows with the paper
// (--paper-text). With many tabs they wrap onto the next line (never a
// sideways scroll): each row of pills is a line minus 6px, with 6px between
// rows and 3px of edge (1px border + 2px padding) above and below, so n rows
// are exactly n lines. Off ruled paper the fallbacks give a normal size.
const FIT_TABS_CLASSES =
  "max-w-full gap-x-1! gap-y-1.5! rounded-[calc(var(--paper-line,2.25rem)/2)]! px-0.5! py-0.5!";
const FIT_TAB_CLASSES =
  "h-[calc(var(--paper-line,2.25rem)-6px)] min-w-0 py-0! whitespace-nowrap text-[length:calc(var(--paper-text,15px)*0.93)]!";

export function NameTabs({
  label,
  noun,
  items,
  activeId,
  hrefFor,
  createAction,
}: {
  /** The tab bar's label for screen readers, e.g. "Lists". */
  label: string;
  /** What the "+" makes, e.g. "list" (see NewNameButton). */
  noun: string;
  items: { id: string; name: string }[];
  activeId?: string;
  hrefFor: (id: string) => string;
  createAction: (formData: FormData) => Promise<void>;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={`${pillTabsClassName} ${FIT_TABS_CLASSES}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={hrefFor(item.id)}
          // Loads each tab while the popup is open, so switching is instant.
          prefetch
          title={item.name}
          aria-current={item.id === activeId ? "page" : undefined}
          className={`${pillTabClassName(item.id === activeId)} ${FIT_TAB_CLASSES}`}
        >
          {/* Long names end in "…"; hovering shows the whole name. */}
          <span className="max-w-[10rem] truncate">{item.name}</span>
        </Link>
      ))}
      <NewNameButton
        noun={noun}
        createAction={createAction}
        className={`${pillTabClassName(false)} ${FIT_TAB_CLASSES}`}
      >
        <Plus className="size-4" aria-hidden />
      </NewNameButton>
    </nav>
  );
}
