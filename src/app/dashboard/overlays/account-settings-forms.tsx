"use client";

import { useActionState } from "react";
import {
  updateEmailAction,
  updatePasswordAction,
  type UpdateEmailFormState,
  type UpdatePasswordFormState,
} from "@/app/actions/auth";
import { updateTimezoneAction, type TimezoneFormState } from "@/app/actions/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
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
      <p className="text-sm text-zinc-600">Current: {currentEmail}</p>

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
