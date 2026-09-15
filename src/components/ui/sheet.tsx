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

// For a "side" popup with a background photo, the popup's own shape is the
// photo's aspect ratio (h-full, width derived) instead of a fixed max-width,
// so the photo fills the panel exactly with no letterboxing or empty margin.
// No border-l here — the photo's own edge (with its baked-in drop shadow)
// is the panel's visual boundary, so an extra border line would just cut
// across it.
const SIDE_WITH_IMAGE_CLASSES =
  "h-full transition-transform duration-300 data-ending-style:translate-x-full data-starting-style:translate-x-full";

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
  backgroundImage?: { src: string; width: number; height: number };
  children: React.ReactNode;
}) {
  const sideWithImage = size === "side" && backgroundImage;

  // The photo already carries its own visual identity (folder, notebook),
  // so photo-backed popups skip the redundant heading text — the Drawer.Title
  // stays in the DOM (sr-only) so the popup still has an accessible name.
  const titleRow = (
    <div className="relative z-10 flex items-start justify-end gap-4">
      <Drawer.Title
        className={
          sideWithImage
            ? "sr-only"
            : "mr-auto font-heading text-2xl tracking-wide uppercase"
        }
      >
        {title}
      </Drawer.Title>
      <Drawer.Close
        aria-label="Close"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ✕
      </Drawer.Close>
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
          {sideWithImage ? (
            // The photo (rendered at its natural size, scaled to the panel's
            // height) is what determines the panel's width here — not a
            // separately-computed CSS aspect-ratio — so there's a single
            // source of truth for the size and no rounding seam between them.
            <Drawer.Popup className={cn("isolate relative", SIDE_WITH_IMAGE_CLASSES)}>
              <Image
                src={backgroundImage.src}
                alt=""
                width={backgroundImage.width}
                height={backgroundImage.height}
                aria-hidden
                className="pointer-events-none block h-full w-auto max-w-none select-none"
              />
              <div className="absolute inset-0 z-10 flex flex-col gap-4 overflow-y-auto p-6 pl-[18%] text-popover-foreground">
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
              {backgroundImage && (
                <Image
                  src={backgroundImage.src}
                  alt=""
                  fill
                  aria-hidden
                  className="pointer-events-none z-0 object-contain object-right-top"
                />
              )}
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
