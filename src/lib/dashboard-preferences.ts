import type { DbClient } from "./db";

export async function getHiddenPanels(client: DbClient, userId: string): Promise<string[]> {
  const prefs = await client.dashboardPreferences.findUnique({ where: { userId } });
  return prefs?.hiddenPanels ?? [];
}

export async function togglePanelVisibility(
  client: DbClient,
  params: { userId: string; panelKey: string },
) {
  const existing = await client.dashboardPreferences.findUnique({
    where: { userId: params.userId },
  });
  const current = existing?.hiddenPanels ?? [];
  const hiddenPanels = current.includes(params.panelKey)
    ? current.filter((key) => key !== params.panelKey)
    : [...current, params.panelKey];

  return client.dashboardPreferences.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, hiddenPanels },
    update: { hiddenPanels },
  });
}

export async function getPanelOrder(client: DbClient, userId: string): Promise<string[]> {
  const prefs = await client.dashboardPreferences.findUnique({ where: { userId } });
  return prefs?.panelOrder ?? [];
}

export async function reorderPanels(
  client: DbClient,
  params: { userId: string; orderedKeys: string[] },
) {
  return client.dashboardPreferences.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, panelOrder: params.orderedKeys },
    update: { panelOrder: params.orderedKeys },
  });
}

// Applies a user's saved order to the current set of panel keys: known keys
// come first in their saved order, and any key the user has never reordered
// (new panel, or one they haven't touched yet) is appended in default order.
export function sortPanelKeys(defaultKeys: string[], storedOrder: string[]): string[] {
  const known = storedOrder.filter((key) => defaultKeys.includes(key));
  const missing = defaultKeys.filter((key) => !known.includes(key));
  return [...known, ...missing];
}
