"use client";

import { useActionState } from "react";
import type { IntentionFormState } from "@/app/actions/intentions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findIntentionColor, INTENTION_COLORS } from "@/lib/intention-colors";

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

      <ColorPicker defaultKey={findIntentionColor(initialValues?.color ?? null)?.key ?? ""} />
      {state?.errors?.color && (
        <p className="text-sm text-red-600">{state.errors.color[0]}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

const SWATCH_CLASSES =
  "flex h-7 w-7 items-center justify-center rounded-full border border-black/10 ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring";

/**
 * Google Calendar's event colors as round swatches (radio buttons under
 * the hood), plus "None". Events with this intention take the color, in
 * the app and in Google Calendar.
 */
function ColorPicker({ defaultKey }: { defaultKey: string }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Color (optional)</legend>
      <ColorSwatches defaultKey={defaultKey} />
      <p className="text-xs text-muted-foreground">
        Events with this intention show in this color, here and in Google Calendar.
      </p>
    </fieldset>
  );
}

/**
 * The round swatches themselves, as radio buttons named "color" ("" for
 * none). Used by the form above and by the color dot on the intentions list.
 */
export function ColorSwatches({ defaultKey }: { defaultKey: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <label title="None" className="cursor-pointer">
        <input
          type="radio"
          name="color"
          value=""
          defaultChecked={defaultKey === ""}
          className="peer sr-only"
        />
        <span className={`${SWATCH_CLASSES} bg-background text-xs text-muted-foreground`}>
          <span aria-hidden>/</span>
          <span className="sr-only">None</span>
        </span>
      </label>
      {INTENTION_COLORS.map((color) => (
        <label key={color.key} title={color.name} className="cursor-pointer">
          <input
            type="radio"
            name="color"
            value={color.key}
            defaultChecked={defaultKey === color.key}
            className="peer sr-only"
          />
          <span className={SWATCH_CLASSES} style={{ backgroundColor: color.hex }}>
            <span className="sr-only">{color.name}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
