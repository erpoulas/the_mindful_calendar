import type { DbClient } from "./db";

export async function getGoogleConnection(client: DbClient, userId: string) {
  return client.googleConnection.findUnique({ where: { userId } });
}

export async function saveGoogleConnection(
  client: DbClient,
  params: {
    userId: string;
    refreshToken: string;
    accessToken: string;
    accessTokenExpiresAt: Date;
  },
) {
  const { userId, ...tokens } = params;
  return client.googleConnection.upsert({
    where: { userId },
    create: { userId, ...tokens },
    update: tokens,
  });
}

export async function saveGoogleAccessToken(
  client: DbClient,
  params: { userId: string; accessToken: string; accessTokenExpiresAt: Date },
) {
  return client.googleConnection.update({
    where: { userId: params.userId },
    data: {
      accessToken: params.accessToken,
      accessTokenExpiresAt: params.accessTokenExpiresAt,
    },
  });
}

/** Deletes the connection and returns it, so the caller can revoke its token with Google. */
export async function deleteGoogleConnection(client: DbClient, userId: string) {
  const connection = await getGoogleConnection(client, userId);
  if (!connection) return null;

  await client.googleConnection.delete({ where: { userId } });
  return connection;
}
