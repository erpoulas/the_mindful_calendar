import { stringParam } from "@/lib/dashboard-routes";
import { EditEventView, NewEventView } from "../../overlays/calendar-event";

export default async function EventPanel({ searchParams }: PageProps<"/dashboard/event">) {
  const query = await searchParams;
  const id = stringParam(query.id);

  if (stringParam(query.view) === "edit" && id) return <EditEventView id={id} />;
  return (
    <NewEventView
      date={stringParam(query.date)}
      title={stringParam(query.title)}
      postItId={stringParam(query.postItId)}
      projectId={stringParam(query.projectId)}
      intentionId={stringParam(query.intentionId)}
    />
  );
}
