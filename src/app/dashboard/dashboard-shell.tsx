"use client";

import { createContext, useContext, useState } from "react";

type DashboardCustomization = {
  isCustomizing: boolean;
  toggleCustomizing: () => void;
  sidebarHidden: boolean;
  hideSidebar: () => void;
  showSidebar: () => void;
};

const DashboardCustomizationContext = createContext<DashboardCustomization | null>(null);

export function useDashboardCustomization() {
  const context = useContext(DashboardCustomizationContext);
  if (!context) {
    throw new Error("useDashboardCustomization must be used within DashboardShell");
  }
  return context;
}

export function DashboardShell({
  sidebar,
  postIts,
  children,
}: {
  sidebar: React.ReactNode;
  postIts: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  return (
    <DashboardCustomizationContext.Provider
      value={{
        isCustomizing,
        toggleCustomizing: () => setIsCustomizing((value) => !value),
        sidebarHidden,
        hideSidebar: () => setSidebarHidden(true),
        showSidebar: () => setSidebarHidden(false),
      }}
    >
      <div className="flex min-h-0 flex-1 gap-6 px-6 pb-6">
        {!sidebarHidden && (
          <div className="w-52 shrink-0 overflow-y-auto pt-4">{sidebar}</div>
        )}

        <div className="flex min-h-0 flex-1 flex-col pt-8">{children}</div>

        <div className="w-72 shrink-0 overflow-hidden pt-4">{postIts}</div>
      </div>
    </DashboardCustomizationContext.Provider>
  );
}
