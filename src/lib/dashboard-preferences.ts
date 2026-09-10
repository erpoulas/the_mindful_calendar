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
