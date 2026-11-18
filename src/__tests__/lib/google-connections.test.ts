import { describe, expect, it } from "vitest";
import { withRollback } from "@/test/withRollback";
import {
  deleteGoogleConnection,
  getGoogleConnection,
  saveGoogleAccessToken,
  saveGoogleConnection,
} from "@/lib/google-connections";

const EXPIRES_AT = new Date("2026-11-18T13:00:00Z");

describe("getGoogleConnection", () => {
  it("returns null when the user never connected Google", async () => {
    await withRollback(async (tx) => {
      expect(await getGoogleConnection(tx, "test-user-1")).toBeNull();
    });
  });

  it("never returns another user's connection", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-2",
        refreshToken: "refresh-2",
        accessToken: "access-2",
        accessTokenExpiresAt: EXPIRES_AT,
      });

      expect(await getGoogleConnection(tx, "test-user-1")).toBeNull();
    });
  });
});

describe("saveGoogleConnection", () => {
  it("stores the tokens", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-1",
        refreshToken: "refresh-1",
        accessToken: "access-1",
        accessTokenExpiresAt: EXPIRES_AT,
      });

      const connection = await getGoogleConnection(tx, "test-user-1");
      expect(connection).toMatchObject({
        refreshToken: "refresh-1",
        accessToken: "access-1",
        accessTokenExpiresAt: EXPIRES_AT,
      });
    });
  });

  it("replaces the tokens when the user connects again", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-1",
        refreshToken: "old-refresh",
        accessToken: "old-access",
        accessTokenExpiresAt: EXPIRES_AT,
      });
      await saveGoogleConnection(tx, {
        userId: "test-user-1",
        refreshToken: "new-refresh",
        accessToken: "new-access",
        accessTokenExpiresAt: EXPIRES_AT,
      });

      const connection = await getGoogleConnection(tx, "test-user-1");
      expect(connection?.refreshToken).toBe("new-refresh");
      expect(connection?.accessToken).toBe("new-access");
    });
  });
});

describe("saveGoogleAccessToken", () => {
  it("updates only the access token, keeping the refresh token", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-1",
        refreshToken: "refresh-1",
        accessToken: "old-access",
        accessTokenExpiresAt: EXPIRES_AT,
      });
      const newExpiry = new Date("2026-11-18T14:00:00Z");

      await saveGoogleAccessToken(tx, {
        userId: "test-user-1",
        accessToken: "new-access",
        accessTokenExpiresAt: newExpiry,
      });

      const connection = await getGoogleConnection(tx, "test-user-1");
      expect(connection).toMatchObject({
        refreshToken: "refresh-1",
        accessToken: "new-access",
        accessTokenExpiresAt: newExpiry,
      });
    });
  });
});

describe("deleteGoogleConnection", () => {
  it("removes the connection and returns it", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-1",
        refreshToken: "refresh-1",
        accessToken: "access-1",
        accessTokenExpiresAt: EXPIRES_AT,
      });

      const deleted = await deleteGoogleConnection(tx, "test-user-1");

      expect(deleted?.refreshToken).toBe("refresh-1");
      expect(await getGoogleConnection(tx, "test-user-1")).toBeNull();
    });
  });

  it("returns null when there was nothing to delete", async () => {
    await withRollback(async (tx) => {
      expect(await deleteGoogleConnection(tx, "test-user-1")).toBeNull();
    });
  });

  it("never touches another user's connection", async () => {
    await withRollback(async (tx) => {
      await saveGoogleConnection(tx, {
        userId: "test-user-2",
        refreshToken: "refresh-2",
        accessToken: "access-2",
        accessTokenExpiresAt: EXPIRES_AT,
      });

      await deleteGoogleConnection(tx, "test-user-1");

      expect(await getGoogleConnection(tx, "test-user-2")).not.toBeNull();
    });
  });
});
