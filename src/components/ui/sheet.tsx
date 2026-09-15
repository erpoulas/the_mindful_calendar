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
  backgroundImage?: { src: string };
  children: React.ReactNode;
}) {
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
            <div className="relative z-10 flex items-start justify-between gap-4">
              <Drawer.Title className="font-heading text-2xl tracking-wide uppercase">
                {title}
              </Drawer.Title>
              <Drawer.Close
                aria-label="Close"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ✕
              </Drawer.Close>
            </div>
            <Drawer.Content className="relative z-10 flex flex-1 flex-col">
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
