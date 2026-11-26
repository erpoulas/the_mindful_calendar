// Shared styling for form fields laid directly on a photo-backed popup
// (journal/project side popups) — no boxed input, just a ruled underline
// so it reads as writing on the page instead of a floating UI card.
export const pageInputClassName =
  "rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary";

// The soft look shared by the photo-backed popups (Journals, Quick Lists,
// Projects): slightly lifted paper cards, big League Gothic headings and a
// rounded pill switch for tabs.
export const softCardClassName = "rounded-2xl border border-amber-900/10 bg-white/70 shadow-sm";
export const softCardLinkClassName = `${softCardClassName} block transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md`;
export const pageHeadingClassName = "font-heading text-3xl tracking-wide uppercase";

export const pillTabsClassName =
  "flex flex-wrap gap-1 self-start rounded-full border border-amber-900/10 bg-white/60 p-1";
export function pillTabClassName(active: boolean) {
  return `flex items-center gap-1.5 rounded-full px-4 py-1 text-sm transition ${
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-white hover:text-foreground"
  }`;
}
