"use client";

import { useActionState } from "react";
import type { IntentionFormState } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IntentionForm({
  action,
  heading,
  submitLabel,
  pendingLabel,
  initialValues,
}: {
  action: (state: IntentionFormState, formData: FormData) => Promise<IntentionFormState>;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  initialValues?: { name: string; color: string | null };
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
          placeholder="e.g. Health"
          defaultValue={initialValues?.name}
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="color">Color (optional)</Label>
        <Input
          id="color"
          name="color"
          placeholder="#4a6a99"
          defaultValue={initialValues?.color ?? undefined}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
