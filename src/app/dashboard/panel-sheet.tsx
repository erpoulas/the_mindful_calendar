"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
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
  const view = useSearchParams().get("view");
  const shownTitle = (view && titlesByView?.[view]) || title;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) router.push("/dashboard");
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
