"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonVariants } from "@/components/ui/button";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findIntentionColor } from "@/lib/intention-colors";
import { ColorSwatches } from "./intention-form";
import { saveInBackground } from "./use-optimistic-list";

/**
 * One intention on the intentions list. Its color dot opens the swatches and
 * recolors it with one click; Edit renames it and Delete removes it. Color
 * and delete show at once and save in the background. The built-in Journal
 * intention can only change color: journal entries depend on it.
 */
export function IntentionRow({
  intention,
  recolorAction,
  deleteAction,
}: {
  intention: { id: string; name: string; color: string | null; isSystem: boolean };
  /** colorKey is "" for no color. */
  recolorAction: (intentionId: string, colorKey: string) => Promise<void>;
  deleteAction: (intentionId: string) => Promise<void>;
}) {
  const { id, name, isSystem } = intention;
  const [shownColor, showColor] = useOptimistic(intention.color);
  const [isDeleted, markDeleted] = useOptimistic(false);
  const [pickingColor, setPickingColor] = useState(false);
  const color = findIntentionColor(shownColor);

  if (isDeleted) return null;

  async function recolor(formData: FormData) {
    const colorKey = String(formData.get("color") ?? "");
    showColor(colorKey || null);
    await saveInBackground(() => recolorAction(id, colorKey));
  }

  return (
    <li>
      <div className="flex items-center gap-2 rounded border px-3 py-2 hover:bg-accent">
        <button
          type="button"
          aria-label={`Change ${name}'s color`}
          aria-expanded={pickingColor}
          title={color?.name ?? "No color"}
          onClick={() => setPickingColor((open) => !open)}
          className={`h-3 w-3 shrink-0 rounded-full ${
            color ? "" : "border border-dashed border-muted-foreground"
          }`}
          style={color ? { backgroundColor: color.hex } : undefined}
        />
        {/* prefetch: loads each intention's screen while the list is open. */}
        <Link href={dashboardRoutes.intention(id)} prefetch className="flex-1">
          {name}
        </Link>
        {!isSystem && (
          <>
            <Link
              href={dashboardRoutes.editIntention(id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit
            </Link>
            <form
              action={async () => {
                markDeleted(true);
                await saveInBackground(() => deleteAction(id));
              }}
            >
              <ConfirmSubmitButton
                size="sm"
                confirmMessage="Delete this intention? This can't be undone."
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </div>
      {pickingColor && (
        // Picking a swatch saves straight away; there's no Save button. The
        // swatches close here rather than in recolor(): React holds back
        // plain state changes made during a save until the save finishes.
        <form
          action={recolor}
          onChange={(event) => {
            event.currentTarget.requestSubmit();
            setPickingColor(false);
          }}
          className="mt-2 rounded border p-3"
        >
          <ColorSwatches defaultKey={color?.key ?? ""} />
        </form>
      )}
    </li>
  );
}
