import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getUserTimezone } from "@/lib/user-settings";
import { ChangeEmailForm, ChangePasswordForm, TimezoneForm } from "./account-settings-forms";

export async function AccountSettingsView() {
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const [timezone, { data }] = await Promise.all([
    getUserTimezone(db, userId),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <TimezoneForm currentTimezone={timezone ?? "UTC"} />
      <ChangeEmailForm currentEmail={data.user?.email ?? ""} />
      <ChangePasswordForm />
    </div>
  );
}
