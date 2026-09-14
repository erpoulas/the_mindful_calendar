import { notFound } from "next/navigation";
import {
  deleteCalendarEventAction,
  updateCalendarEventAction,
  createCalendarEventAction,
} from "@/app/actions/calendar-events";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/auth";
import { getCalendarEvent } from "@/lib/calendar-events";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { listProjects } from "@/lib/projects";
import { EventForm } from "./event-form";

export async function NewEventView({
  date,
  title,
  postItId,
}: {
  date?: string;
  title?: string;
  postItId?: string;
}) {
  const userId = await getCurrentUserId();
  const [projects, intentions] = await Promise.all([
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  const initialValues = date
    ? {
        title: title ?? "",
        startAt: new Date(`${date}T00:00:00Z`),
        endAt: null,
        isAllDay: true,
        location: null,
        notes: null,
        projectId: null,
        intentionIds: [],
      }
    : title
      ? {
          title,
          startAt: null,
          endAt: null,
          isAllDay: false,
          location: null,
          notes: null,
          projectId: null,
          intentionIds: [],
        }
      : undefined;

  return (
    <EventForm
      action={createCalendarEventAction}
      heading="New event"
      submitLabel="Add event"
      pendingLabel="Adding..."
      projects={projects}
      intentions={intentions}
      initialValues={initialValues}
      postItId={postItId}
    />
  );
}

export async function EditEventView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [event, projects, intentions] = await Promise.all([
    getCalendarEvent(db, { userId, eventId: id }),
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  if (!event) notFound();

  return (
    <div className="flex flex-col gap-4">
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
