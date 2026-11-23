// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/place-suggestions/route";
import { getCurrentUserId } from "@/lib/auth";
import { isPlaceSearchConfigured, searchPlaces } from "@/lib/place-search";

vi.mock("@/lib/auth", () => ({ getCurrentUserId: vi.fn(async () => "user-1") }));
vi.mock("@/lib/place-search", () => ({
  isPlaceSearchConfigured: vi.fn(() => true),
  searchPlaces: vi.fn(async () => [{ label: "Boulder Reservoir, Boulder, CO, USA", name: "Boulder Reservoir", address: "Boulder, CO, USA" }]),
}));

const search = vi.mocked(searchPlaces);

function getSuggestions(query: string) {
  const url = `http://localhost/api/place-suggestions?q=${encodeURIComponent(query)}`;
  return GET(new Request(url) as unknown as NextRequest);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/place-suggestions", () => {
  it("answers the places matching the search, for a signed-in user", async () => {
    const response = await getSuggestions("boulder res");

    expect(getCurrentUserId).toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith("boulder res");
    expect(await response.json()).toEqual({
      suggestions: [{ label: "Boulder Reservoir, Boulder, CO, USA", name: "Boulder Reservoir", address: "Boulder, CO, USA" }],
    });
  });

  it("answers 404 without asking Google when place search isn't set up", async () => {
    vi.mocked(isPlaceSearchConfigured).mockReturnValueOnce(false);

    const response = await getSuggestions("boulder");

    expect(response.status).toBe(404);
    expect(search).not.toHaveBeenCalled();
  });

  it("answers 502 when Google fails, so the field just stays plain text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    search.mockRejectedValueOnce(new Error("Google place search failed (403)"));

    const response = await getSuggestions("boulder");

    expect(response.status).toBe(502);
  });
});
