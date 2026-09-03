"use client";

import { useActionState } from "react";
import type { SeasonFormState } from "@/app/actions/seasons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SeasonForm({
  action,
  heading,
  submitLabel,
  pendingLabel,
  initialValues,
}: {
  action: (state: SeasonFormState, formData: FormData) => Promise<SeasonFormState>;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  initialValues?: {
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    note: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">{heading}</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Fall 2026"
          defaultValue={initialValues?.name}
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startDate">Start date (optional)</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={initialValues?.startDate?.toISOString().slice(0, 10)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="endDate">End date (optional)</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={initialValues?.endDate?.toISOString().slice(0, 10)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Goals, reminders, how you're feeling about this season"
          defaultValue={initialValues?.note ?? undefined}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
