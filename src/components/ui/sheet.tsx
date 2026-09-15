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
  center: "block h-auto max-h-[80vh] w-auto max-w-[85vw] select-none",
};

// Default clearance keeps content off a spiral/binding running down the
// photo's left edge. Individual photos with art elsewhere (e.g. a clip
// along the top) override this via backgroundImage.contentInsetClassName.
const DEFAULT_CONTENT_INSET = "pl-[18%]";

export function Sheet({
  open,
  onOpenChange,
  title,
  size = "side",
  backgroundImage,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: "side" | "wide" | "center";
  backgroundImage?: {
    src: string;
    width: number;
    height: number;
    contentInsetClassName?: string;
  };
  children: React.ReactNode;
}) {
  const imageBacked =
    (size === "side" || size === "center") && backgroundImage;

  // The projects/journal side popups are just a photo of a folder/notebook —
  // a "✕" floating on top of the art looked out of place, and the drawer can
  // already be dismissed via the backdrop, swipe, or Escape. Other popups
  // (including the quick-lists center popup) keep the visible close button.
  const showCloseButton = !(imageBacked && size === "side");

  // The photo already carries its own visual identity (folder, notebook,
  // clipboard), so photo-backed popups skip the redundant heading text — the
  // Drawer.Title stays in the DOM (sr-only) so the popup still has an
  // accessible name.
  const titleRow = (
    <div className="relative z-10 flex items-start justify-end gap-4">
      <Drawer.Title
        className={
          imageBacked
            ? "sr-only"
            : "mr-auto font-heading text-2xl tracking-wide uppercase"
        }
      >
        {title}
      </Drawer.Title>
      {showCloseButton && (
        <Drawer.Close
          aria-label="Close"
          className="text-sm text-muted-foreground hover:text-foreground"
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
                className={cn("pointer-events-none", IMAGE_CLASSES[size])}
              />
              <div
                className={cn(
                  "absolute inset-0 z-10 flex flex-col gap-4 overflow-y-auto p-6 text-popover-foreground",
                  backgroundImage.contentInsetClassName ?? DEFAULT_CONTENT_INSET,
                )}
              >
                {titleRow}
                <div className="mx-auto flex w-full max-w-[75%] flex-1 flex-col justify-center">
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
