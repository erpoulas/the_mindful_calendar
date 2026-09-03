import Link from "next/link";
import { createCalendarEventAction } from "@/app/actions/calendar-events";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { listProjects } from "@/lib/projects";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  const userId = await getCurrentUserId();
  const [projects, intentions] = await Promise.all([
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/calendar" className="text-sm text-zinc-600 underline">
        ← Calendar
      </Link>

      <EventForm
        action={createCalendarEventAction}
        heading="New event"
        submitLabel="Add event"
        pendingLabel="Adding..."
        projects={projects}
        intentions={intentions}
      />
    </div>
  );
}
