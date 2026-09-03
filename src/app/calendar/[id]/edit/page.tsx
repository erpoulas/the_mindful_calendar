import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/app/actions/calendar-events";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/auth";
import { getCalendarEvent } from "@/lib/calendar-events";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { listProjects } from "@/lib/projects";
import { EventForm } from "../../event-form";

export default async function EditEventPage({
  params,
}: PageProps<"/calendar/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [event, projects, intentions] = await Promise.all([
    getCalendarEvent(db, { userId, eventId: id }),
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  if (!event) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <Link href="/calendar" className="text-sm text-zinc-600 underline">
        ← Calendar
      </Link>

      <EventForm
        action={updateCalendarEventAction.bind(null, id)}
        heading="Edit event"
        submitLabel="Save"
        pendingLabel="Saving..."
        projects={projects}
        intentions={intentions}
        initialValues={{
          title: event.title,
          startAt: event.startAt,
          endAt: event.endAt,
          isAllDay: event.isAllDay,
          location: event.location,
          notes: event.notes,
          projectId: event.projectId,
          intentionIds: event.intentions.map((ei) => ei.intentionId),
        }}
      />

      <form action={deleteCalendarEventAction.bind(null, id)}>
        <ConfirmSubmitButton confirmMessage="Delete this event? This can't be undone.">
          Delete event
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
