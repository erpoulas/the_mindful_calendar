"use client";

import { useActionState } from "react";
import { createIntentionAction } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewIntentionForm() {
  const [state, action, pending] = useActionState(createIntentionAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">New intention</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="e.g. Health" required />
        {state?.errors?.name && (
          <p className="text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="color">Color (optional)</Label>
        <Input id="color" name="color" placeholder="#4a6a99" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add intention"}
      </Button>
    </form>
  );
}
