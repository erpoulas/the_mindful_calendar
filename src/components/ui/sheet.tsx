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
  // Centred top to bottom: on a narrow phone the photo can be shorter than the screen.
  side: "self-center transition-transform duration-300 data-ending-style:translate-x-full data-starting-style:translate-x-full",
  center:
    "transition-all duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
};

const IMAGE_CLASSES = {
  // Widths are set by imageWidth below.
  side: "block h-auto max-w-none select-none",
  center: "block h-auto max-w-none select-none",
};

/**
 * How wide the photo is drawn; its height follows, keeping its shape, so it
 * fits phones and small laptops as well as big monitors, never cut off.
 * A side photo is as tall as the screen, unless that would make it wider
 * than the screen (a phone), when it shrinks to the screen's width.
 * A center photo is shown at `scale` times its own size, but never wider or
 * taller than the screen (less the viewport's 1rem padding each side).
 */
function imageWidth(art: PanelArt, size: "side" | "center") {
  const shape = art.width / art.height;
  if (size === "side") return `min(100vw, calc(100dvh * ${shape}))`;
  const scale = art.scale ?? 1;
  return `min(${art.width * scale}px, calc(100vw - 2rem), calc((100dvh - 2rem) * ${shape}))`;
}

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
 * the first) so the first row starts on one. It also gets --paper-text, a
 * font size that grows and shrinks with the lines, so the writing keeps the
 * same size on the paper whatever the photo's size on screen.
 *
 * `scale` (center popups) shows the photo bigger than its own pixel size
 * when the screen has room for it.
 *
 * `contentWidth` is how much of the paper's width the content may use, as a
 * percentage (75 by default, which leaves a calm margin; plain paper only).
 * Plain-paper content sits in the middle of the page top to bottom, unless
 * `alignTop` puts it at the top (for pages that fill up, like a journal's).
 */
export type PanelArt = {
  src: string;
  width: number;
  height: number;
  paperArea: { top: number; right: number; bottom: number; left: number };
  ruledLines?: { spacing: number };
  scale?: number;
  contentWidth?: number;
  alignTop?: boolean;
};

/** Body text is this share of a ruled line's height (18px on a 48px line). */
const PAPER_TEXT_PER_LINE = 0.375;

/**
 * The --paper-line and --paper-text variables for lined art. The paper area
 * is a size container, so 100cqh is its height, which is a known share of
 * the photo's. (Its children use them: an element's own cqh would measure
 * the container around it, not itself.) On a small screen the text stops
 * shrinking at 14px so it stays readable.
 */
function paperLineStyle(art: PanelArt): React.CSSProperties {
  if (!art.ruledLines) return {};
  const paperHeight = 100 - art.paperArea.top - art.paperArea.bottom;
  return {
    containerType: "size",
    paddingBlock: 0,
    ["--paper-line" as string]: `calc(100cqh * ${art.ruledLines.spacing / paperHeight})`,
    ["--paper-text" as string]: `max(14px, calc(var(--paper-line) * ${PAPER_TEXT_PER_LINE}))`,
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

  // No ✕: the header's Back button closes the popup from its first screen,
  // and the backdrop, a swipe or Escape still do too.
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
              // No outline when focus falls back to the popup (e.g. after an
              // edit box closes), like the plain popup below.
              className={cn("isolate relative outline-none", IMAGE_POPUP_CLASSES[size])}
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
                style={{ width: imageWidth(backgroundImage, size) }}
              />
              {/* The popup is exactly the photo's size, so percentages
                  here line up with the photo's pixels at any screen size. */}
              <div
                className={cn(
                  // Photo popups only ever scroll up and down; long text wraps instead.
                  "absolute z-10 flex flex-col overflow-x-hidden overflow-y-auto p-6 text-popover-foreground",
                  lined ? "px-2" : "gap-4",
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
                    "flex w-full min-w-0 flex-1 flex-col",
                    lined ? "" : "mx-auto",
                    !lined && !backgroundImage.alignTop && "justify-center",
                  )}
                  style={lined ? undefined : { maxWidth: `${backgroundImage.contentWidth ?? 75}%` }}
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
