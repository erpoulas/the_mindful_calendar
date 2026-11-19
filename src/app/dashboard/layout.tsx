import { Suspense } from "react";
import { NavigationProgress } from "./navigation-progress";

// `children` is the calendar (page.tsx) and `panel` is the open popup, if
// any (the @panel folder). They render side by side, so opening a popup
// only renders the popup.
export default function DashboardLayout({ children, panel }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex h-dvh flex-col overflow-clip">
      {/* Suspense because NavigationProgress reads the URL's search params. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
      {panel}
    </div>
  );
}
