"use client";

import { useActionState } from "react";
import type { ReflectionFormState } from "@/app/actions/seasons";
import { Button } from "@/components/ui/button";

export function ReflectionForm({
  action,
  initialText,
}: {
  action: (
    state: ReflectionFormState,
    formData: FormData,
  ) => Promise<ReflectionFormState>;
  initialText: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="reflectionText"
        rows={4}
        placeholder="Did you do what you set out to? How did it actually go?"
        defaultValue={initialText ?? undefined}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
      />
      {state?.errors?.reflectionText && (
        <p className="text-sm text-red-600">{state.errors.reflectionText[0]}</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save reflection"}
      </Button>
    </form>
  );
}
