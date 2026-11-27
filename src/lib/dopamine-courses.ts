// The dopamine menu's courses, in menu order, sorted by how much time and
// energy each takes (from How to ADHD's dopamine menu). Kept apart from
// dopamine-menu.ts so the popup's client components can use it too; the
// values match the DopamineCourse enum in prisma/schema.prisma.

export const DOPAMINE_COURSES = ["APPETIZER", "ENTREE", "SIDE", "DESSERT", "SPECIAL"] as const;

export type DopamineCourse = (typeof DOPAMINE_COURSES)[number];

export const COURSE_INFO: Record<DopamineCourse, { heading: string; one: string; hint: string }> = {
  APPETIZER: { heading: "Appetizers", one: "an appetizer", hint: "quick boosts, a few minutes" },
  ENTREE: { heading: "Entrées", one: "an entrée", hint: "longer and more rewarding" },
  SIDE: { heading: "Sides", one: "a side", hint: "to pair with a boring task" },
  DESSERT: { heading: "Desserts", one: "a dessert", hint: "lovely, but easy to overdo" },
  SPECIAL: { heading: "Specials", one: "a special", hint: "bigger treats to plan for" },
};

export function isDopamineCourse(value: unknown): value is DopamineCourse {
  return typeof value === "string" && (DOPAMINE_COURSES as readonly string[]).includes(value);
}
