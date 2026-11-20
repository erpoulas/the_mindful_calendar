import { notFound } from "next/navigation";
import {
  deleteCalendarEventAction,
  updateCalendarEventAction,
  createCalendarEventAction,
} from "@/app/actions/calendar-events";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getCurrentUserId } from "@/lib/auth";
import { storedCalendarEvent, storedIntentions, storedProjects, storedTimezone } from "@/lib/stored-reads";
import { convertWallClock } from "@/lib/wall-clock";
import { EventForm } from "./event-form";

export async function NewEventView({
  date,
  title,
  postItId,
  projectId,
}: {
  date?: string;
  title?: string;
  postItId?: string;
  projectId?: string;
}) {
  const userId = await getCurrentUserId();
  const [projects, intentions, mainTimeZone] = await Promise.all([
    storedProjects(userId),
    storedIntentions(userId),
    storedTimezone(userId),
  ]);

  // A date (from a post-it dropped on the month view) makes an all-day event.
  const initialValues =
    date || title || projectId
      ? {
          title: title ?? "",
          startAt: date ? new Date(`${date}T00:00:00Z`) : null,
          endAt: null,
          isAllDay: Boolean(date),
          location: null,
          notes: null,
          projectId: projectId ?? null,
          intentionIds: [],
          timeZone: null,
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
      mainTimeZone={mainTimeZone}
    />
  );
}

export async function EditEventView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [event, projects, intentions, mainTimeZone] = await Promise.all([
    storedCalendarEvent(userId, id),
    storedProjects(userId),
    storedIntentions(userId),
    storedTimezone(userId),
  ]);

  if (!event) notFound();

  // Times are stored on the main zone's clock; show them on the clock of the
  // zone they were entered in, as Google Calendar does.
  const eventTimeZone = event.isAllDay ? mainTimeZone : (event.timeZone ?? mainTimeZone);
  const toEventZone = (time: Date | null) =>
    time && convertWallClock(time, mainTimeZone, eventTimeZone);

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
          startAt: toEventZone(event.startAt),
          endAt: toEventZone(event.endAt),
          isAllDay: event.isAllDay,
          location: event.location,
          notes: event.notes,
          projectId: event.projectId,
          intentionIds: event.intentions.map((ei) => ei.intentionId),
          timeZone: event.isAllDay ? null : event.timeZone,
        }}
        mainTimeZone={mainTimeZone}
      />

      <form action={deleteCalendarEventAction.bind(null, id)}>
        <ConfirmSubmitButton confirmMessage="Delete this event? This can't be undone.">
          Delete event
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
