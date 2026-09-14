"use client";

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
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  size?: "side" | "wide" | "center";
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
              "flex flex-col gap-4 overflow-y-auto border-border bg-popover p-6 text-popover-foreground shadow-lg outline-none",
              POPUP_CLASSES[size],
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <Drawer.Title className="text-lg font-semibold">{title}</Drawer.Title>
              <Drawer.Close
                aria-label="Close"
                className="text-sm text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </Drawer.Close>
            </div>
            <Drawer.Content className="flex flex-1 flex-col">{children}</Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
