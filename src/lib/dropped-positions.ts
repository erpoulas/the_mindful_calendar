// Where things were just dropped by drag-and-drop, shown on screen right
// away while the server saves the change. Once the server's fresh page
// arrives these are thrown away, so the saved data always wins.

export type EventMove = { startAt: Date; endAt: Date | null };

export type DroppedPositions = {
  /** Event id → its new start and end. */
  eventMoves: Record<string, EventMove>;
  /** Post-it ids in their new order, or null when none were reordered. */
  postItOrder: string[] | null;
  /** Visible panel keys in their new order, or null when none were reordered. */
  panelOrder: string[] | null;
};

export const noDroppedPositions: DroppedPositions = {
  eventMoves: {},
  postItOrder: null,
  panelOrder: null,
};

/** Gives each moved event its dropped start and end; others stay as they are. */
export function applyEventMoves<T extends { id: string; startAt: Date; endAt: Date | null }>(
  events: T[],
  moves: Record<string, EventMove>,
): T[] {
  return events.map((event) => (moves[event.id] ? { ...event, ...moves[event.id] } : event));
}

/**
 * Sorts items into `order` (a list of ids). Items missing from `order` keep
 * their place after the ordered ones, so a stale order never hides anything.
 */
export function sortByOrder<T>(items: T[], order: string[] | null, idOf: (item: T) => string): T[] {
  if (!order) return items;
  const position = new Map(order.map((id, index) => [id, index]));
  const rank = (item: T) => position.get(idOf(item)) ?? order.length;
  return [...items].sort((a, b) => rank(a) - rank(b));
}
