"use client";

import { useActionState, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function TimezoneForm({ currentTimezone }: { currentTimezone: string }) {
  const [state, action, pending] = useActionState<TimezoneFormState, FormData>(
    updateTimezoneAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Timezone</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={currentTimezone}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {state?.errors?.timezone && (
          <p className="text-sm text-red-600">{state.errors.timezone[0]}</p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save timezone"}
      </Button>
    </form>
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
  const [zoneToAdd, setZoneToAdd] = useState("");
  const atLimit = zones.length >= MAX_EXTRA_TIMEZONES;

  function addZone() {
    if (zoneToAdd && !zones.includes(zoneToAdd) && !atLimit) setZones([...zones, zoneToAdd]);
    setZoneToAdd("");
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
        <div className="flex gap-2">
          <select
            id="add-timezone"
            value={zoneToAdd}
            onChange={(event) => setZoneToAdd(event.target.value)}
            disabled={atLimit}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
          >
            <option value="">{atLimit ? "Limit reached" : "Choose a time zone…"}</option>
            {Intl.supportedValuesOf("timeZone")
              .filter((tz) => !zones.includes(tz))
              .map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
          </select>
          <Button type="button" variant="outline" onClick={addZone} disabled={!zoneToAdd || atLimit}>
            Add
          </Button>
        </div>
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
