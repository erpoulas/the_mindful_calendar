"use client";

import { useActionState } from "react";
import type { QuickListFormState } from "@/app/actions/quick-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuickListForm({
  action,
  heading,
  submitLabel,
  pendingLabel,
  initialValues,
}: {
  action: (state: QuickListFormState, formData: FormData) => Promise<QuickListFormState>;
  heading: string;
  submitLabel: string;
  pendingLabel: string;
  initialValues?: { name: string };
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
          placeholder="e.g. Groceries"
          defaultValue={initialValues?.name}
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
