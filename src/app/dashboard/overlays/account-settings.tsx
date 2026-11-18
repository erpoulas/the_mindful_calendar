import { disconnectGoogleCalendarAction } from "@/app/actions/google-calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { getGoogleConnection } from "@/lib/google-connections";
import { getUserTimezone } from "@/lib/user-settings";
import { ChangeEmailForm, ChangePasswordForm, TimezoneForm } from "./account-settings-forms";

export async function AccountSettingsView({ googleOutcome }: { googleOutcome?: string }) {
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const [timezone, { data }, googleConnection] = await Promise.all([
    getUserTimezone(db, userId),
    supabase.auth.getUser(),
    getGoogleConnection(db, userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <GoogleCalendarSection connected={googleConnection !== null} outcome={googleOutcome} />
      <TimezoneForm currentTimezone={timezone ?? "UTC"} />
      <ChangeEmailForm currentEmail={data.user?.email ?? ""} />
      <ChangePasswordForm />
    </div>
  );
}

// Shown once after returning from Google, keyed by the ?google= param the
// callback route adds.
const OUTCOME_MESSAGES: Record<string, { text: string; success: boolean }> = {
  connected: { text: "Connected. Your Google events now show on the calendar.", success: true },
  cancelled: { text: "Connecting was cancelled.", success: false },
  error: { text: "Couldn't connect to Google Calendar. Please try again.", success: false },
};

function GoogleCalendarSection({ connected, outcome }: { connected: boolean; outcome?: string }) {
  const message = outcome ? OUTCOME_MESSAGES[outcome] : undefined;

  return (
    <section className="flex flex-col gap-3 rounded border p-4">
      <h2 className="text-lg font-medium">Google Calendar</h2>
      <p className="text-sm text-muted-foreground">
        {connected
          ? "Your Google Calendar events show on the calendar, read-only. Edit them in Google Calendar."
          : "Show the events from your main Google Calendar here, read-only."}
      </p>

      {message && (
        <p className={`text-sm ${message.success ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {connected ? (
        <form action={disconnectGoogleCalendarAction}>
          <Button type="submit" variant="outline" className="w-full">
            Disconnect Google Calendar
          </Button>
        </form>
      ) : isGoogleCalendarConfigured() ? (
        // A plain <a>, not next/link: this leaves the app for Google's page,
        // so it must be a full page load rather than a client-side navigation.
        <a href="/auth/google" className={buttonVariants()}>
          Connect Google Calendar
        </a>
      ) : (
        <p className="text-sm text-red-600">
          Not set up yet: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are missing
          from .env.
        </p>
      )}
    </section>
  );
}
