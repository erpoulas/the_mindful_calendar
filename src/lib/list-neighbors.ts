/**
 * Finds the items just before and after the one with `currentId`, so a
 * popup's detail screen can link straight to the previous or next item
 * (another journal, another entry) without going back to the list.
 * Either side is undefined at the ends of the list, or when the current
 * item isn't in it.
 */
export function findListNeighbors<Item extends { id: string }>(items: Item[], currentId: string) {
  const index = items.findIndex((item) => item.id === currentId);
  if (index === -1) return { previous: undefined, next: undefined };
  return { previous: items[index - 1], next: items[index + 1] };
}
