"use client";

import { useState } from "react";

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

  return (
    <div className="flex min-h-0 flex-1 gap-6 px-6 pb-6">
      {!sidebarHidden && (
        <div className="w-52 shrink-0 overflow-y-auto">{sidebar}</div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setSidebarHidden((value) => !value)}
            className="text-xs text-muted-foreground underline"
          >
            {sidebarHidden ? "Show side panels" : "Hide side panels"}
          </button>
        </div>
        {children}
      </div>

      <div className="w-72 shrink-0 overflow-hidden">{postIts}</div>
    </div>
  );
}
