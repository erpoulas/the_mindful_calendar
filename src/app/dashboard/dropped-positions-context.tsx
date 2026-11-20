"use client";

import { createContext, useContext } from "react";
import { noDroppedPositions, type DroppedPositions } from "@/lib/dropped-positions";

export const DroppedPositionsContext = createContext<DroppedPositions>(noDroppedPositions);

/**
 * Where events, post-its and panels were just dropped (set by
 * CalendarDndProvider), so they stay there while the save is on its way
 * instead of snapping back until the server answers. Outside the provider
 * nothing has been dropped.
 */
export function useDroppedPositions() {
  return useContext(DroppedPositionsContext);
}
