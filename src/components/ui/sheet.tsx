"use client";

import Image from "next/image";
import { Drawer } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

const VIEWPORT_CLASSES = {
  side: "items-stretch justify-end",
  wide: "items-stretch justify-end",
  center: "items-center justify-center p-4",
};

const POPUP_CLASSES = {
  side: "h-full w-full sm:max-w-sm border-l transition-transform duration-300 data-ending-style:translate-x-full data-starting-style:translate-x-full",
  wide: "h-full w-full sm:max-w-3xl border-l transition-transform duration-300 data-ending-style:translate-x-full data-starting-style:translate-x-full",
  center:
    "w-full sm:max-w-lg max-h-[90vh] rounded-lg border transition-all duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
};

// A background photo becomes the popup's own shape — its rendered size (not
// a separately-computed CSS box) determines the panel's size, so there's a
// single source of truth and no rounding seam between "the box" and "the
// photo". No border either: the photo's own edge (with its baked-in drop
// shadow) is the panel's visual boundary, so an extra border line would just
// cut across it.
const IMAGE_POPUP_CLASSES = {
  side: "h-full transition-transform duration-300 data-ending-style:translate-x-full data-starting-style:translate-x-full",
  center:
    "transition-all duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
};

const IMAGE_CLASSES = {
  side: "block h-full w-auto max-w-none select-none",
  // As big as the screen allows, less the viewport's 1rem padding each side.
  center: "block h-auto max-h-[calc(100dvh-2rem)] w-auto max-w-[calc(100vw-2rem)] select-none",
};

/**
 * A photo used as a popup's background. `paperArea` says where its writable
 * paper sits, as percentages of the photo's size measured in from each
 * edge, leaving out see-through margins, shadows, the binding and clips.
 * The popup's scrolling content and scrollbar are kept inside that area.
 *
 * For lined paper, `ruledLines` gives the gap between two ruled lines, as a
 * percentage of the photo's height. The content then fills the paper from
 * the top (not centred) and gets a --paper-line CSS variable holding that
 * gap at the photo's current size, so rows sized with it (the checklist's)
 * sit on the lines. Set `paperArea.top` on a ruled line (or one gap above
 * the first) so the first row starts on one.
 */
export type PanelArt = {
  src: string;
  width: number;
  height: number;
  paperArea: { top: number; right: number; bottom: number; left: number };
  ruledLines?: { spacing: number };
};

/**
 * The --paper-line variable for lined art. The paper area is a size
 * container, so 100cqh is its height, which is a known share of the photo's.
 */
function paperLineStyle(art: PanelArt): React.CSSProperties {
  if (!art.ruledLines) return {};
  const paperHeight = 100 - art.paperArea.top - art.paperArea.bottom;
  return {
    containerType: "size",
    paddingBlock: 0,
    ["--paper-line" as string]: `calc(100cqh * ${art.ruledLines.spacing / paperHeight})`,
  };
}

export function Sheet({
  open,
  onOpenChange,
  title,
  hideVisibleTitle,
  size = "side",
  backgroundImage,
  headerStart,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hideVisibleTitle?: boolean;
  size?: "side" | "wide" | "center";
  backgroundImage?: PanelArt;
  /** Shown at the left of the header, before the title (e.g. back/forward buttons). */
  headerStart?: React.ReactNode;
  children: React.ReactNode;
}) {
  const imageBacked =
    (size === "side" || size === "center") && backgroundImage;

  // The projects/journal side popups are just a photo of a folder/notebook —
  // a "✕" floating on top of the art looked out of place, and the drawer can
  // already be dismissed via the backdrop, swipe, or Escape. Other popups
  // (including the quick-lists center popup) keep the visible close button.
  const showCloseButton = !(imageBacked && size === "side");
  const lined = Boolean(imageBacked && backgroundImage.ruledLines);

  // The photo already carries its own visual identity (folder, notebook,
  // clipboard), so photo-backed popups skip the redundant heading text.
  // Some popups also render their own heading in their content (e.g. the
  // event form) — those pass hideVisibleTitle to avoid a duplicate. Either
  // way the Drawer.Title stays in the DOM (sr-only) so the popup still has
  // an accessible name.
  const titleRow = (
    <div
      className={cn(
        "relative z-10 flex justify-end gap-4",
        // On lined paper the header takes exactly one line.
        lined ? "h-(--paper-line) shrink-0 items-center" : "items-start",
      )}
    >
      <div className="mr-auto flex items-center gap-3">
        {headerStart}
        <Drawer.Title
          className={
            imageBacked || hideVisibleTitle
              ? "sr-only"
              : "font-heading text-2xl tracking-wide uppercase"
          }
        >
          {title}
        </Drawer.Title>
      </div>
      {showCloseButton && (
        <Drawer.Close
          aria-label="Close"
          className="text-lg text-muted-foreground hover:text-foreground"
        >
          ✕
        </Drawer.Close>
      )}
    </div>
  );

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      swipeDirection="right"
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Drawer.Viewport
          className={cn("fixed inset-0 z-50 flex", VIEWPORT_CLASSES[size])}
        >
          {imageBacked ? (
            <Drawer.Popup
              className={cn("isolate relative", IMAGE_POPUP_CLASSES[size])}
            >
              <Image
                src={backgroundImage.src}
                alt=""
                width={backgroundImage.width}
                height={backgroundImage.height}
                aria-hidden
                // The art is the popup's shape, so load it the moment the
                // popup opens instead of lazily, or it pops in afterwards.
                loading="eager"
                fetchPriority="high"
                className={cn("pointer-events-none", IMAGE_CLASSES[size])}
              />
              {/* The popup is exactly the photo's size, so percentages
                  here line up with the photo's pixels at any screen size. */}
              <div
                className={cn(
                  "absolute z-10 flex flex-col overflow-y-auto p-6 text-popover-foreground",
                  // Lined paper only scrolls up and down; long text wraps instead.
                  lined ? "overflow-x-hidden px-2" : "gap-4",
                )}
                style={{
                  top: `${backgroundImage.paperArea.top}%`,
                  right: `${backgroundImage.paperArea.right}%`,
                  bottom: `${backgroundImage.paperArea.bottom}%`,
                  left: `${backgroundImage.paperArea.left}%`,
                  ...paperLineStyle(backgroundImage),
                }}
              >
                {titleRow}
                <div
                  className={cn(
                    "flex w-full flex-1 flex-col",
                    lined ? "" : "mx-auto max-w-[75%] justify-center",
                  )}
                >
                  <Drawer.Content className="flex flex-col gap-4">{children}</Drawer.Content>
                </div>
              </div>
            </Drawer.Popup>
          ) : (
            <Drawer.Popup
              className={cn(
                "isolate relative flex flex-col gap-4 overflow-y-auto border-border bg-popover p-6 text-popover-foreground shadow-lg outline-none",
                POPUP_CLASSES[size],
              )}
            >
              {titleRow}
              <Drawer.Content className="relative z-10 flex flex-1 flex-col">
                {children}
              </Drawer.Content>
            </Drawer.Popup>
          )}
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
