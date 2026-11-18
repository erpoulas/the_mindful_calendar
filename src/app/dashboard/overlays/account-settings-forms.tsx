"use client";

import { startTransition, useActionState, useState } from "react";
import { X } from "lucide-react";
import {
  updateEmailAction,
  updatePasswordAction,
  type UpdateEmailFormState,
  type UpdatePasswordFormState,
} from "@/app/actions/auth";
import {
  updateCalendarDisplayAction,
  updateTimezoneAction,
  type CalendarDisplayFormState,
  type TimezoneFormState,
} from "@/app/actions/user-settings";
import { MAX_EXTRA_TIMEZONES } from "@/lib/user-settings-schemas";
import type { TimezoneMatch } from "@/lib/timezone-search";
import { TimezoneSearch } from "./timezone-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

/** Picking a search result saves it straight away. */
export function TimezoneForm({ currentTimezone }: { currentTimezone: string }) {
  const [state, action, pending] = useActionState<TimezoneFormState, FormData>(
    updateTimezoneAction,
    undefined,
  );
  const [picked, setPicked] = useState<TimezoneMatch | null>(null);

  function save(match: TimezoneMatch) {
    setPicked(match);
    const formData = new FormData();
    formData.set("timezone", match.timezone);
    startTransition(() => action(formData));
  }

  return (
    <section className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Timezone</h2>
      <p className="text-sm text-muted-foreground">
        Current: {picked ? `${picked.label} (${picked.timezone})` : currentTimezone}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Change timezone</Label>
        <TimezoneSearch id="timezone" onPick={save} disabled={pending} />
        {state?.errors?.timezone && (
          <p className="text-sm text-red-600">{state.errors.timezone[0]}</p>
        )}
        {pending && <p className="text-sm text-muted-foreground">Saving...</p>}
        {!pending && state?.saved && <p className="text-sm text-green-700">Saved.</p>}
      </div>
    </section>
  );
}

export function CalendarDisplayForm({
  extraTimezones,
  use24HourClock,
}: {
  extraTimezones: string[];
  use24HourClock: boolean;
}) {
  const [state, action, pending] = useActionState<CalendarDisplayFormState, FormData>(
    updateCalendarDisplayAction,
    undefined,
  );
  const [zones, setZones] = useState(extraTimezones);
  const atLimit = zones.length >= MAX_EXTRA_TIMEZONES;

  function addZone({ timezone }: TimezoneMatch) {
    if (!zones.includes(timezone) && !atLimit) setZones([...zones, timezone]);
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Calendar display</h2>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Time format</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="clockFormat" value="12" defaultChecked={!use24HourClock} />
          12-hour (9 AM, 2 PM)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="clockFormat" value="24" defaultChecked={use24HourClock} />
          24-hour (09:00, 14:00)
        </label>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="add-timezone">Extra time zones</Label>
        <p className="text-sm text-muted-foreground">
          Shown beside the hour labels in the week view, next to your main timezone. Up to{" "}
          {MAX_EXTRA_TIMEZONES}.
        </p>
        {zones.length > 0 && (
          <ul className="flex flex-col gap-1">
            {zones.map((zone) => (
              <li key={zone} className="flex items-center justify-between rounded bg-accent px-2 py-1 text-sm">
                <input type="hidden" name="extraTimezones" value={zone} />
                {zone}
                <button
                  type="button"
                  aria-label={`Remove ${zone}`}
                  onClick={() => setZones(zones.filter((z) => z !== zone))}
                  className="rounded p-0.5 hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <TimezoneSearch
          id="add-timezone"
          onPick={addZone}
          disabled={atLimit}
          placeholder={atLimit ? "Limit reached" : "Search a city to add, e.g. London"}
        />
        {state?.errors?.extraTimezones && (
          <p className="text-sm text-red-600">{state.errors.extraTimezones[0]}</p>
        )}
      </div>

      {state?.saved && <p className="text-sm text-green-700">Saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save calendar display"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<UpdatePasswordFormState, FormData>(
    updatePasswordAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Change password</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required />
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-red-600">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-green-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<UpdateEmailFormState, FormData>(
    updateEmailAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Change email</h2>
      <p className="text-sm text-muted-foreground">Current: {currentEmail}</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">New email</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && (
          <p className="text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-green-700" : "text-red-600"}`}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Update email"}
      </Button>
    </form>
  );
}
