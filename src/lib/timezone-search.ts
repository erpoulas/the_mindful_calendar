import { cityMapping } from "city-timezones";

// Finds time zones by city ("Boulder" → America/Denver) or by zone name
// ("Mountain", "UTC"). The city list is ~2 MB, so this runs on the server
// only (through a server action), never in the browser.

export type TimezoneMatch = {
  /** What the user sees, e.g. "Boulder, Colorado, US" or "America/Denver". */
  label: string;
  timezone: string;
  /** The zone's everyday name, e.g. "Mountain Time". */
  zoneName: string;
};

const MIN_QUERY_LENGTH = 2;

/** Lowercase, with accents removed, so "São" matches "Sao". */
function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function zoneNameOf(timezone: string) {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longGeneric" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? timezone
  );
}

const knownTimezones = new Set(Intl.supportedValuesOf("timeZone"));

// Built once, on first search: biggest cities first.
let cities: { searchName: string; label: string; timezone: string }[] | null = null;
let zones: { searchName: string; timezone: string; zoneName: string }[] | null = null;

function loadIndexes() {
  cities ??= cityMapping
    .filter((city) => knownTimezones.has(city.timezone))
    .sort((a, b) => b.pop - a.pop)
    .map((city) => ({
      searchName: normalize(city.city_ascii),
      label: [city.city, city.province, city.iso2].filter(Boolean).join(", "),
      timezone: city.timezone,
    }));
  zones ??= [...knownTimezones].map((timezone) => {
    const zoneName = zoneNameOf(timezone);
    return { searchName: normalize(`${timezone.replaceAll("_", " ")} ${zoneName}`), timezone, zoneName };
  });
  return { cities, zones };
}

export function searchTimezones(query: string, limit = 8): TimezoneMatch[] {
  const search = normalize(query);
  if (search.length < MIN_QUERY_LENGTH) return [];
  const { cities, zones } = loadIndexes();

  const cityMatches: TimezoneMatch[] = cities
    .filter((city) => city.searchName.startsWith(search))
    .slice(0, limit)
    .map(({ label, timezone }) => ({ label, timezone, zoneName: zoneNameOf(timezone) }));

  const shownZones = new Set(cityMatches.map((match) => match.timezone));
  const zoneMatches: TimezoneMatch[] = zones
    .filter((zone) => zone.searchName.includes(search) && !shownZones.has(zone.timezone))
    .map(({ timezone, zoneName }) => ({ label: timezone, timezone, zoneName }));

  return [...cityMatches, ...zoneMatches].slice(0, limit);
}
