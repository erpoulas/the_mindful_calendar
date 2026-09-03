"use client";

import { useActionState } from "react";
import type { ProjectFormState } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectForm({
  action,
  heading,
  submitLabel,
  pendingLabel,
  intentions,
  initialValues,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  intentions: { id: string; name: string }[];
  initialValues?: {
    title: string;
    endGoal: string;
    dueDate: Date | null;
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
          placeholder="e.g. Train for a 5k"
          defaultValue={initialValues?.title}
          required
        />
        {state?.errors?.title && (
          <p className="text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="endGoal">End goal</Label>
        <Input
          id="endGoal"
          name="endGoal"
          placeholder="e.g. Run the Cedar Falls 5k on Oct 12"
          defaultValue={initialValues?.endGoal}
          required
        />
        {state?.errors?.endGoal && (
          <p className="text-sm text-red-600">{state.errors.endGoal[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dueDate">Due date (optional)</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={initialValues?.dueDate?.toISOString().slice(0, 10)}
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium">Intentions</legend>
        {intentions.length === 0 && (
          <p className="text-sm text-zinc-600">
            No intentions yet — create one first, then come back here.
          </p>
        )}
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
        {state?.errors?.intentionIds && (
          <p className="text-sm text-red-600">{state.errors.intentionIds[0]}</p>
        )}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
