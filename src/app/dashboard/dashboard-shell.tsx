"use client";

import { useState } from "react";

export function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div
      className={`grid grid-cols-1 gap-6 ${sidebarHidden ? "" : "md:grid-cols-[16rem_1fr]"}`}
    >
      {!sidebarHidden && <div>{sidebar}</div>}

      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
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
    </div>
  );
}
