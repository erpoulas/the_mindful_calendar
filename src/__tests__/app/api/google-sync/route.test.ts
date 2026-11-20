// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/google-sync/route";
import { syncGoogleCalendar } from "@/lib/google-sync";

vi.mock("@/lib/auth", () => ({ getCurrentUserId: vi.fn(async () => "user-1") }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/user-settings", () => ({
  getUserTimezoneWithFallback: vi.fn(async () => "America/Denver"),
}));
vi.mock("@/lib/google-sync", () => ({ syncGoogleCalendar: vi.fn(async () => true) }));

const sync = vi.mocked(syncGoogleCalendar);

function postJson(body: unknown) {
  return new Request("http://localhost/api/google-sync", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/google-sync", () => {
  it("syncs the given range in the user's time zone and says whether anything changed", async () => {
    const response = await POST(
      postJson({ start: "2026-11-16T00:00:00.000Z", end: "2026-11-23T00:00:00.000Z" }),
    );

    expect(await response.json()).toEqual({ changed: true });
    expect(sync).toHaveBeenCalledWith(
      {},
      {
        userId: "user-1",
        start: new Date("2026-11-16T00:00:00.000Z"),
        end: new Date("2026-11-23T00:00:00.000Z"),
        timeZone: "America/Denver",
      },
    );
  });

  it("rejects a range that isn't made of dates, without syncing", async () => {
    const response = await POST(postJson({ start: "soon", end: "later" }));

    expect(response.status).toBe(400);
    expect(sync).not.toHaveBeenCalled();
  });
});
