"use client";

import { useState } from "react";
import { Dices, Tag, Utensils } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { COURSE_INFO, DOPAMINE_COURSES, type DopamineCourse } from "@/lib/dopamine-courses";
import { Checklist } from "./checklist";
import type { IntentionChoice } from "./intention-chips";
import { CopyToPostItButton, iconButtonClass, ScheduleIconLink, StartNowButton } from "./item-actions";
import { saveInBackground } from "./use-optimistic-list";

type DopamineItem = { id: string; text: string; intentionId: string | null; course: DopamineCourse | null };
type MenuItem = DopamineItem & { done: boolean };

/**
 * The dopamine menu, laid out like a restaurant menu: a section per course
 * (Appetizers, Entrées, Sides, Desserts, Specials), each item centred under
 * its heading with no bullets, and items without a course under "Anytime".
 * Items are edited like a quick list (click to edit, backspace away to
 * delete, type on a course's blank line to add to it). Nothing gets ticked
 * off, since menu items are meant to be reused. The hover icons add "make a
 * post-it" (keeping the item), a course picker and an intention picker; a
 * tagged item's intention shows under it like a dish's description.
 * Schedule and Start now make events that count toward the item's intention.
 */
export function DopamineMenuList({
  items,
  intentions,
  addAction,
  editTextAction,
  deleteAction,
  startNowAction,
  createPostItAction,
  setIntentionAction,
  setCourseAction,
}: {
  items: DopamineItem[];
  intentions: IntentionChoice[];
  addAction: (formData: FormData) => Promise<void>;
  editTextAction: (itemId: string, formData: FormData) => Promise<void>;
  deleteAction: (itemId: string) => Promise<void>;
  startNowAction: (itemId: string) => Promise<void>;
  createPostItAction: (formData: FormData) => Promise<void>;
  /** Saves an item's intention; "" clears it. */
  setIntentionAction: (itemId: string, intentionId: string) => Promise<void>;
  /** Moves an item to a course; "" takes it off, to "Anytime". */
  setCourseAction: (itemId: string, course: string) => Promise<void>;
}) {
  const intentionById = new Map(intentions.map((intention) => [intention.id, intention]));
  const hasUntagged = items.some((item) => !item.course);

  const sections: { course: DopamineCourse | null; heading: string; hint: string; placeholder: string }[] = [
    ...DOPAMINE_COURSES.map((course) => ({
      course,
      heading: COURSE_INFO[course].heading,
      hint: COURSE_INFO[course].hint,
      placeholder: `Add ${COURSE_INFO[course].one}`,
    })),
    // Items from before there were courses, or taken off one. Only shown when there are some.
    ...(hasUntagged
      ? [{ course: null, heading: "Anytime", hint: "not on a course yet", placeholder: "Add something" }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {sections.map(({ course, heading, hint, placeholder }, index) => {
        const headingId = `dopamine-course-${course ?? "anytime"}`;
        return (
          <section key={headingId} aria-labelledby={headingId}>
            <h3 id={headingId} className="text-center font-handwritten text-xl">
              {heading}
            </h3>
            <p className="text-center text-xs italic opacity-70">{hint}</p>
            <Checklist<MenuItem>
              listId={headingId}
              look="menu"
              items={items.filter((item) => item.course === course).map((item) => ({ ...item, done: false }))}
              addPlaceholder={placeholder}
              addAction={(_listId, formData) => {
                formData.set("course", course ?? "");
                return addAction(formData);
              }}
              editTextAction={editTextAction}
              deleteAction={deleteAction}
              startNowAction={startNowAction}
              // An empty menu is ready to type its first appetizer into.
              focusNewItem={items.length === 0 && index === 0}
              scheduleHref={(item) =>
                dashboardRoutes.newEvent({ title: item.text, intentionId: item.intentionId ?? undefined })
              }
              renderNote={(item) => (
                <IntentionNote intention={item.intentionId ? intentionById.get(item.intentionId) : undefined} />
              )}
              renderExtraActions={(item) => (
                <>
                  <CopyToPostItButton text={item.text} createPostItAction={createPostItAction} />
                  <CoursePicker item={item} setCourseAction={setCourseAction} />
                  <IntentionPicker item={item} intentions={intentions} setIntentionAction={setIntentionAction} />
                </>
              )}
            />
          </section>
        );
      })}
    </div>
  );
}

/** "for Health", small and in the intention's color, under a tagged item. */
function IntentionNote({ intention }: { intention?: IntentionChoice }) {
  if (!intention) return null;
  return (
    <span
      className="-mt-2 mb-1 text-xs italic"
      title={`Counts toward ${intention.name}`}
      style={intention.colorHex ? { color: intention.colorHex } : undefined}
    >
      <span className="sr-only">Counts toward </span>
      <span aria-hidden>for </span>
      {intention.name}
    </span>
  );
}

/** A utensils icon over the browser's own list of courses (see IntentionPicker). */
function CoursePicker({
  item,
  setCourseAction,
}: {
  item: MenuItem;
  setCourseAction: (itemId: string, course: string) => Promise<void>;
}) {
  return (
    <span className={`relative ${iconButtonClass}`} title="Course">
      <Utensils className="size-4" aria-hidden />
      <select
        aria-label={`Course for ${item.text}`}
        defaultValue={item.course ?? ""}
        onChange={(event) => {
          const course = event.target.value;
          void saveInBackground(() => setCourseAction(item.id, course));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Anytime (no course)</option>
        {DOPAMINE_COURSES.map((course) => (
          <option key={course} value={course}>
            {COURSE_INFO[course].heading}
          </option>
        ))}
      </select>
    </span>
  );
}

/**
 * A tag icon that opens the browser's own list of intentions: the select
 * sits invisibly over the icon, so it looks like the other row icons but
 * still works with the keyboard and screen readers.
 */
function IntentionPicker({
  item,
  intentions,
  setIntentionAction,
}: {
  item: MenuItem;
  intentions: IntentionChoice[];
  setIntentionAction: (itemId: string, intentionId: string) => Promise<void>;
}) {
  return (
    <span className={`relative ${iconButtonClass}`} title="Intention">
      <Tag className="size-4" aria-hidden />
      <select
        aria-label={`Intention for ${item.text}`}
        defaultValue={item.intentionId ?? ""}
        onChange={(event) => {
          const intentionId = event.target.value;
          void saveInBackground(() => setIntentionAction(item.id, intentionId));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">No intention</option>
        {intentions.map((intention) => (
          <option key={intention.id} value={intention.id}>
            {intention.name}
          </option>
        ))}
      </select>
    </span>
  );
}

/** A random item, never the one with `excludeId` unless it's the only one. */
export function pickAnother<T extends { id: string }>(items: T[], excludeId: string | null) {
  const others = items.filter((item) => item.id !== excludeId);
  const pool = others.length > 0 ? others : items;
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

/**
 * Today's random pick, big, with quiet icons under it. The dice picks again
 * on the spot, always a different item (when there's more than one). The
 * course buttons under it roll from just that course (only five minutes?
 * an appetizer), and the dice keeps to that course until "Anything".
 */
export function DopaminePick({
  items,
  initialPickId,
  startNowAction,
  createPostItAction,
}: {
  items: DopamineItem[];
  initialPickId: string | null;
  startNowAction: (itemId: string) => Promise<void>;
  createPostItAction: (formData: FormData) => Promise<void>;
}) {
  const [pickId, setPickId] = useState(initialPickId);
  const [rollCourse, setRollCourse] = useState<DopamineCourse | null>(null);
  // The shown item; if it was deleted, any other one.
  const pick = items.find((item) => item.id === pickId) ?? items[0];

  if (!pick) {
    return (
      <p className="text-center text-sm opacity-80">
        Little things that feel good. Jot a few down, then roll for one.
      </p>
    );
  }

  const poolFor = (course: DopamineCourse | null) =>
    course ? items.filter((item) => item.course === course) : items;
  function roll(course: DopamineCourse | null) {
    setRollCourse(course);
    setPickId(pickAnother(poolFor(course), pick.id)?.id ?? pick.id);
  }
  const canRoll = poolFor(rollCourse).some((item) => item.id !== pick.id);
  const coursesWithItems = DOPAMINE_COURSES.filter((course) => items.some((item) => item.course === course));

  return (
    <section className="flex flex-col gap-1">
      <h3 className="font-handwritten text-lg">Need a lift? Try this:</h3>
      <p className="text-xl leading-snug font-semibold wrap-anywhere">{pick.text}</p>
      <div className="-ml-1 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => roll(rollCourse)}
          disabled={!canRoll}
          aria-label="Pick something else"
          title="Pick something else"
          className={`${iconButtonClass} disabled:opacity-40`}
        >
          <Dices className="size-4" aria-hidden />
        </button>
        <ScheduleIconLink
          href={dashboardRoutes.newEvent({ title: pick.text, intentionId: pick.intentionId ?? undefined })}
        />
        <StartNowButton itemId={pick.id} startNowAction={startNowAction} />
        <CopyToPostItButton text={pick.text} createPostItAction={createPostItAction} />
      </div>
      {coursesWithItems.length > 0 && (
        <div role="group" aria-label="Roll from" className="flex flex-wrap gap-1 pt-1 text-xs">
          {[null, ...coursesWithItems].map((course) => (
            <button
              key={course ?? "any"}
              type="button"
              onClick={() => roll(course)}
              aria-pressed={rollCourse === course}
              className={`rounded-full border border-current/40 px-2 py-0.5 hover:bg-current/10 ${
                rollCourse === course ? "bg-current/15" : ""
              }`}
            >
              {course ? COURSE_INFO[course].heading : "Anything"}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
