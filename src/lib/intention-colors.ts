// The colors an intention can have. They are exactly Google Calendar's 11
// event colors, so an event synced to Google shows there in the same color
// as in the app. Google only accepts these, by number (its "colorId").
//
// An intention stores the color's key (for example "sage"). Events take the
// color of their intention when they are drawn, so changing an intention's
// color recolors all of its events at once.
//
// The hex values are the ones Google Calendar's own screens show. The order
// is the order of Google's color menu.

export type IntentionColor = {
  key: string;
  name: string;
  hex: string;
  /** Text color that stays readable on top of `hex`. */
  textHex: string;
  googleColorId: string;
};

const WHITE = "#ffffff";
const DARK = "#343434";

export const INTENTION_COLORS: readonly IntentionColor[] = [
  { key: "tomato", name: "Tomato", hex: "#d50000", textHex: WHITE, googleColorId: "11" },
  { key: "flamingo", name: "Flamingo", hex: "#e67c73", textHex: WHITE, googleColorId: "4" },
  { key: "tangerine", name: "Tangerine", hex: "#f4511e", textHex: WHITE, googleColorId: "6" },
  { key: "banana", name: "Banana", hex: "#f6bf26", textHex: DARK, googleColorId: "5" },
  { key: "sage", name: "Sage", hex: "#33b679", textHex: WHITE, googleColorId: "2" },
  { key: "basil", name: "Basil", hex: "#0b8043", textHex: WHITE, googleColorId: "10" },
  { key: "peacock", name: "Peacock", hex: "#039be5", textHex: WHITE, googleColorId: "7" },
  { key: "blueberry", name: "Blueberry", hex: "#3f51b5", textHex: WHITE, googleColorId: "9" },
  { key: "lavender", name: "Lavender", hex: "#7986cb", textHex: WHITE, googleColorId: "1" },
  { key: "grape", name: "Grape", hex: "#8e24aa", textHex: WHITE, googleColorId: "3" },
  { key: "graphite", name: "Graphite", hex: "#616161", textHex: WHITE, googleColorId: "8" },
];

export const INTENTION_COLOR_KEYS = INTENTION_COLORS.map((color) => color.key) as [
  string,
  ...string[],
];

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

/**
 * The palette color an intention has stored, or null for none. Intentions
 * saved before the palette existed hold any hex value ("#4a6a99"); those
 * read as the nearest palette color, and become that key when next saved.
 */
export function findIntentionColor(stored: string | null): IntentionColor | null {
  if (!stored) return null;

  const byKey = INTENTION_COLORS.find((color) => color.key === stored);
  if (byKey) return byKey;

  if (!HEX_PATTERN.test(stored)) return null;
  const target = toRgb(stored);
  let nearest = INTENTION_COLORS[0];
  let nearestDistance = Infinity;
  for (const color of INTENTION_COLORS) {
    const distance = squaredDistance(target, toRgb(color.hex));
    if (distance < nearestDistance) {
      nearest = color;
      nearestDistance = distance;
    }
  }
  return nearest;
}

/**
 * An event's color: that of its oldest intention that has a color (the
 * same order the intentions list uses), or null to use the plain look.
 */
export function eventColor(
  links: { intention: { color: string | null; createdAt: Date } }[],
): IntentionColor | null {
  const oldestFirst = [...links].sort(
    (a, b) => a.intention.createdAt.getTime() - b.intention.createdAt.getTime(),
  );
  for (const { intention } of oldestFirst) {
    const color = findIntentionColor(intention.color);
    if (color) return color;
  }
  return null;
}

function toRgb(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function squaredDistance(a: number[], b: number[]) {
  return a.reduce((sum, channel, i) => sum + (channel - b[i]) ** 2, 0);
}
