import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type NavigationLink = { href: string; label: string };

// The strip at the top of a popup's detail screen: a link back to the list
// it came from, and links to the items either side of it, so you can move
// between items without closing the popup. Each link is prefetched, so the
// next screen is ready before the click.
export function PopupListNavigation({
  back,
  previous,
  next,
}: {
  back: NavigationLink;
  previous?: NavigationLink;
  next?: NavigationLink;
}) {
  return (
    <nav aria-label="Popup navigation" className="flex items-center justify-between gap-2 text-sm">
      <Link href={back.href} prefetch className="flex items-center text-muted-foreground hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        {back.label}
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        {previous && (
          <Link
            href={previous.href}
            prefetch
            className="flex min-w-0 items-center text-muted-foreground hover:underline"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{previous.label}</span>
          </Link>
        )}
        {next && (
          <Link
            href={next.href}
            prefetch
            className="flex min-w-0 items-center text-muted-foreground hover:underline"
          >
            <span className="truncate">{next.label}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        )}
      </div>
    </nav>
  );
}
