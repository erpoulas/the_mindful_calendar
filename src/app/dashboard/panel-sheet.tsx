"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { getCalendarReturnUrl } from "./calendar-location";
import { PopupHistoryButtons } from "./popup-history";

/**
 * The frame of a popup: its sheet, art, title and close button. Each popup
 * route renders it in its layout.tsx, so the frame stays on screen while you
 * move between that popup's screens, and Next can prefetch it before the
 * click (the content streams in behind the route's loading.tsx).
 */
export function PanelSheet({
  open,
  title,
  titlesByView,
  hideVisibleTitle,
  size,
  backgroundImage,
  children,
}: {
  open: boolean;
  /** The title on the popup's first screen. */
  title: string;
  /** Titles for other screens, keyed by the URL's ?view= (e.g. { edit: "Edit project" }). */
  titlesByView?: Record<string, string>;
  hideVisibleTitle?: boolean;
  size?: "side" | "wide" | "center";
  backgroundImage?: {
    src: string;
    width: number;
    height: number;
    contentInsetClassName?: string;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const shownTitle = (view && titlesByView?.[view]) || title;

  // Closing hides the popup at once, without waiting for the calendar's
  // address to load. It's remembered per address, so a popup that stays
  // mounted (the post-its pop-out) can open again on its next visit.
  const currentUrl = `${usePathname()}?${searchParams.toString()}`;
  const [closedAtUrl, setClosedAtUrl] = useState<string | null>(null);
  const closing = closedAtUrl === currentUrl;

  return (
    <Sheet
      open={open && !closing}
      onOpenChange={(next) => {
        if (next) return;
        setClosedAtUrl(currentUrl);
        // Back to the week or month that was on screen, not always today.
        router.push(getCalendarReturnUrl());
      }}
      title={shownTitle}
      hideVisibleTitle={hideVisibleTitle}
      size={size}
      backgroundImage={backgroundImage}
      headerStart={<PopupHistoryButtons />}
    >
      {children}
    </Sheet>
  );
}
