"use client";

import { useActionState } from "react";
import type { CalendarEventFormState } from "@/app/actions/calendar-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EventForm({
  action,
  heading,
  submitLabel,
  pendingLabel,
  projects,
  intentions,
  initialValues,
}: {
  action: (
    state: CalendarEventFormState,
    formData: FormData,
  ) => Promise<CalendarEventFormState>;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  projects: { id: string; title: string }[];
  intentions: { id: string; name: string }[];
  initialValues?: {
    title: string;
    startAt: Date | null;
    endAt: Date | null;
    isAllDay: boolean;
    location: string | null;
    notes: string | null;
    projectId: string | null;
    intentionIds: string[];
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const selectedIntentionIds = new Set(initialValues?.intentionIds ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">{heading}</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Dentist appointment"
          defaultValue={initialValues?.title}
          required
        />
        {state?.errors?.title && (
          <p className="text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAllDay"
          defaultChecked={initialValues?.isAllDay}
        />
        All day
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startAt">Start (optional)</Label>
        <Input
          id="startAt"
          name="startAt"
          type="datetime-local"
          defaultValue={initialValues?.startAt?.toISOString().slice(0, 16)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="endAt">End (optional)</Label>
        <Input
          id="endAt"
          name="endAt"
          type="datetime-local"
          defaultValue={initialValues?.endAt?.toISOString().slice(0, 16)}
        />
        {state?.errors?.endAt && (
          <p className="text-sm text-red-600">{state.errors.endAt[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          name="location"
          defaultValue={initialValues?.location ?? undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialValues?.notes ?? undefined}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="projectId">Project (optional)</Label>
        <select
          id="projectId"
          name="projectId"
          defaultValue={initialValues?.projectId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          <option value="">— None —</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium">Intentions (optional)</legend>
        {intentions.map((intention) => (
          <label key={intention.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="intentionIds"
              value={intention.id}
              defaultChecked={selectedIntentionIds.has(intention.id)}
            />
            {intention.name}
          </label>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
