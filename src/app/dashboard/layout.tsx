import { Suspense } from "react";
import { RememberCalendarUrl } from "./calendar-location";
import { PopupHistoryProvider } from "./popup-history";

// `children` is the calendar (page.tsx) and `panel` is the open popup, if
// any (the @panel folder). They render side by side, so opening a popup
// only renders the popup.
export default function DashboardLayout({ children, panel }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex h-dvh flex-col overflow-clip">
      {/* Suspense because this reads the URL's search params. */}
      <Suspense fallback={null}>
        <RememberCalendarUrl />
      </Suspense>
      {children}
      {/* Suspense because the popup history reads the URL's search params. */}
      <Suspense fallback={null}>
        <PopupHistoryProvider>{panel}</PopupHistoryProvider>
      </Suspense>
    </div>
  );
}
