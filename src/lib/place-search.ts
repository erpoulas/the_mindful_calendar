// Suggests real places for an event's location as the user types, through
// Google's Places API (New) Autocomplete. Optional like the other Google
// features: without GOOGLE_PLACES_API_KEY the location is plain text.
//
// The key stays on the server (no NEXT_PUBLIC_ prefix); the browser asks
// src/app/api/place-suggestions, which calls this.

const PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

// Shorter searches match too much to be useful, and each one costs a request.
const MIN_QUERY_LENGTH = 3;

export type PlaceSuggestion = {
  /**
   * "Boulder Dental Arts, Pearl Street, Boulder, CO, USA": what gets saved as
   * the location. It's the same text Google Calendar's own place picker
   * saves, so after sync Google shows it with a map link.
   */
  label: string;
  /** "Boulder Dental Arts" */
  name: string;
  /** "Pearl Street, Boulder, CO, USA", or "" when Google gives no second part. */
  address: string;
};

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      text?: { text?: string };
      structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
    };
  }[];
};

function placesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

export function isPlaceSearchConfigured(): boolean {
  return placesApiKey() !== null;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const apiKey = placesApiKey();
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY must be set");

  const input = query.trim();
  if (input.length < MIN_QUERY_LENGTH) return [];

  const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({ input }),
  });
  if (!response.ok) throw new Error(`Google place search failed (${response.status})`);

  const body: AutocompleteResponse = await response.json();
  return (body.suggestions ?? []).flatMap(({ placePrediction }) => {
    const label = placePrediction?.text?.text;
    // Suggestions without a placePrediction are search phrases, not places.
    if (!label) return [];
    const parts = placePrediction.structuredFormat;
    return [
      {
        label,
        name: parts?.mainText?.text ?? label,
        address: parts?.secondaryText?.text ?? "",
      },
    ];
  });
}
