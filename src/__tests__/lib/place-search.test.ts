import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPlaceSearchConfigured, searchPlaces } from "@/lib/place-search";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function placePrediction(mainText: string, secondaryText: string) {
  return {
    placePrediction: {
      placeId: `id-${mainText}`,
      text: { text: `${mainText}, ${secondaryText}` },
      structuredFormat: { mainText: { text: mainText }, secondaryText: { text: secondaryText } },
    },
  };
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-places-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("isPlaceSearchConfigured", () => {
  it("is true when the Places key is set", () => {
    expect(isPlaceSearchConfigured()).toBe(true);
  });

  it("is false without the Places key", () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");
    expect(isPlaceSearchConfigured()).toBe(false);
  });
});

describe("searchPlaces", () => {
  it("asks Google Places for suggestions, sending the key in a header", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ suggestions: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await searchPlaces("dentist boul");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Goog-Api-Key": "test-places-key" }),
        body: JSON.stringify({ input: "dentist boul" }),
      }),
    );
  });

  it("returns each place as the full text Google Calendar saves, plus its two parts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          suggestions: [
            placePrediction("Boulder Dental Arts", "Pearl Street, Boulder, CO, USA"),
            placePrediction("Boulder Reservoir", "Boulder, CO, USA"),
          ],
        }),
      ),
    );

    expect(await searchPlaces("boulder")).toEqual([
      {
        label: "Boulder Dental Arts, Pearl Street, Boulder, CO, USA",
        name: "Boulder Dental Arts",
        address: "Pearl Street, Boulder, CO, USA",
      },
      { label: "Boulder Reservoir, Boulder, CO, USA", name: "Boulder Reservoir", address: "Boulder, CO, USA" },
    ]);
  });

  it("skips suggestions that aren't places, and copes with a missing address part", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          suggestions: [
            { queryPrediction: { text: { text: "pizza near me" } } },
            { placePrediction: { placeId: "x", text: { text: "Colorado, USA" } } },
          ],
        }),
      ),
    );

    expect(await searchPlaces("colorado")).toEqual([
      { label: "Colorado, USA", name: "Colorado, USA", address: "" },
    ]);
  });

  it("doesn't ask Google for very short searches", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchPlaces("  b ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when Google answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: {} }, 403)));

    await expect(searchPlaces("boulder")).rejects.toThrow("Google place search failed (403)");
  });

  it("throws when the Places key isn't set", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");

    await expect(searchPlaces("boulder")).rejects.toThrow("GOOGLE_PLACES_API_KEY");
  });
});
