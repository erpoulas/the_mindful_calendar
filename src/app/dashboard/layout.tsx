import { Suspense } from "react";
import { NavigationProgress } from "./navigation-progress";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex h-dvh flex-col overflow-clip">
      {/* Suspense because NavigationProgress reads the URL's search params. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </div>
  );
}
