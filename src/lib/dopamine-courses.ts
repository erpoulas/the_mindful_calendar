// The dopamine menu's courses, in menu order, sorted by how much time and
// energy each takes (from How to ADHD's dopamine menu). Kept apart from
// dopamine-menu.ts so the popup's client components can use it too; the
// values match the DopamineCourse enum in prisma/schema.prisma.

export const DOPAMINE_COURSES = ["APPETIZER", "ENTREE", "SIDE", "DESSERT", "SPECIAL"] as const;

export type DopamineCourse = (typeof DOPAMINE_COURSES)[number];

// The hints follow How to ADHD's own wording, as quoted and paraphrased in
// ADDitude's "Your ADHD Dopamenu" article.
export const COURSE_INFO: Record<DopamineCourse, { heading: string; one: string; hint: string }> = {
  APPETIZER: { heading: "Appetizers", one: "an appetizer", hint: "quick boosts that don't suck you in" },
  ENTREE: { heading: "Entrées", one: "an entrée", hint: "things that excite you and make you feel alive" },
  SIDE: { heading: "Sides", one: "a side", hint: "to make boring tasks more stimulating" },
  DESSERT: { heading: "Desserts", one: "a dessert", hint: "fine sometimes, but easy to overdo" },
  SPECIAL: { heading: "Specials", one: "a special", hint: "now and then: they take planning or cost more" },
};

export function isDopamineCourse(value: unknown): value is DopamineCourse {
  return typeof value === "string" && (DOPAMINE_COURSES as readonly string[]).includes(value);
}
