import { stringParam } from "@/lib/dashboard-routes";
import { EditEventView, NewEventView } from "../../overlays/calendar-event";
import { PanelSheet } from "../../panel-sheet";

export default async function EventPanel({ searchParams }: PageProps<"/dashboard/event">) {
  const query = await searchParams;
  const id = stringParam(query.id);
  const editId = stringParam(query.view) === "edit" ? id : undefined;

  return (
    <PanelSheet open size="center" hideVisibleTitle title={editId ? "Edit event" : "New event"}>
      {editId ? (
        <EditEventView id={editId} />
      ) : (
        <NewEventView
          date={stringParam(query.date)}
          title={stringParam(query.title)}
          postItId={stringParam(query.postItId)}
          projectId={stringParam(query.projectId)}
        />
      )}
    </PanelSheet>
  );
}
