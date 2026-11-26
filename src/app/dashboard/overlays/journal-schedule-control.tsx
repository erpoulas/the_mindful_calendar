"use client";

import { useState, useTransition } from "react";
import { AlarmClock } from "lucide-react";
import { describeJournalSchedule } from "@/lib/journal-time";
import { saveInBackground } from "./use-optimistic-list";

type Schedule = { weekdays: number[]; startMinutes: number; durationMinutes: number };

// Days 1 = Monday ... 7 = Sunday, as the schedule stores them.
const DAYS = [
  { day: 1, letter: "M", name: "Monday" },
  { day: 2, letter: "T", name: "Tuesday" },
  { day: 3, letter: "W", name: "Wednesday" },
  { day: 4, letter: "T", name: "Thursday" },
  { day: 5, letter: "F", name: "Friday" },
  { day: 6, letter: "S", name: "Saturday" },
  { day: 7, letter: "S", name: "Sunday" },
];
const LENGTHS = [10, 15, 20, 30, 45, 60];
// What a new journal time starts from: 9:00pm for 15 minutes.
const NEW_TIME: Schedule = { weekdays: [], startMinutes: 21 * 60, durationMinutes: 15 };

function toTimeValue(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function fromTimeValue(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * A journal's repeating writing time, shown as one line ("Mon, Wed, Fri at
 * 9:00 PM · 20 min"). Clicking it opens the days, time and length right
 * there; every change saves at once, and the calendar shows it as
 * "<journal> journal time".
 */
export function JournalScheduleControl({
  schedule,
  saveAction,
}: {
  schedule: Schedule | null;
  saveAction: (formData: FormData) => Promise<void>;
}) {
  const [shown, setShown] = useState<Schedule>(schedule ?? NEW_TIME);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const isSet = shown.weekdays.length > 0;

  function save(next: Schedule) {
    setShown(next);
    const formData = new FormData();
    for (const day of next.weekdays) formData.append("weekdays", String(day));
    formData.set("startMinutes", String(next.startMinutes));
    formData.set("durationMinutes", String(next.durationMinutes));
    startTransition(async () => {
      await saveInBackground(() => saveAction(formData));
    });
  }

  function toggleDay(day: number) {
    const weekdays = shown.weekdays.includes(day)
      ? shown.weekdays.filter((picked) => picked !== day)
      : [...shown.weekdays, day].sort((a, b) => a - b);
    save({ ...shown, weekdays });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 self-start rounded-full text-sm text-muted-foreground hover:text-foreground"
      >
        <AlarmClock className="size-4 shrink-0" aria-hidden />
        {isSet ? `Journal time: ${describeJournalSchedule(shown)}` : "Set a journal time"}
      </button>

      {open && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-900/10 bg-white/55 px-3 py-2">
          <div role="group" aria-label="Days" className="flex gap-1">
            {DAYS.map(({ day, letter, name }) => {
              const picked = shown.weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-label={name}
                  title={name}
                  aria-pressed={picked}
                  onClick={() => toggleDay(day)}
                  className={`size-7 rounded-full text-xs transition ${
                    picked
                      ? "bg-primary text-primary-foreground"
                      : "border border-amber-900/15 text-muted-foreground hover:bg-white"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Time
            <input
              type="time"
              value={toTimeValue(shown.startMinutes)}
              onChange={(event) => {
                if (event.target.value) save({ ...shown, startMinutes: fromTimeValue(event.target.value) });
              }}
              className="rounded-md border border-input bg-white/60 px-2 py-1 text-xs text-foreground"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Length
            <select
              value={shown.durationMinutes}
              onChange={(event) => save({ ...shown, durationMinutes: Number(event.target.value) })}
              className="rounded-md border border-input bg-white/60 px-2 py-1 text-xs text-foreground"
            >
              {/* A length set some other way still shows. */}
              {[...new Set([...LENGTHS, shown.durationMinutes])]
                .sort((a, b) => a - b)
                .map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
            </select>
          </label>
          {isSet && (
            <button
              type="button"
              onClick={() => {
                save({ ...shown, weekdays: [] });
                setOpen(false);
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Turn off
            </button>
          )}
        </div>
      )}
    </div>
  );
}
