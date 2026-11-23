import { stringParam } from "@/lib/dashboard-routes";
import {
  JournalCreateView,
  JournalDetailView,
  JournalEditView,
  JournalEntryEditView,
  JournalEntryView,
  JournalsListView,
} from "../../overlays/journals";

export default async function JournalsPanel({ searchParams }: PageProps<"/dashboard/journals">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);
  const entryId = stringParam(query.entryId);
  const tab = stringParam(query.tab);

  if (view === "entry" && id && entryId) return <JournalEntryView id={id} entryId={entryId} />;
  if (view === "entry-edit" && id && entryId) return <JournalEntryEditView id={id} entryId={entryId} />;
  if (view === "edit" && id) return <JournalEditView id={id} />;
  if (view === "detail" && id) {
    return <JournalDetailView id={id} tab={tab === "read" || tab === "write" ? tab : undefined} />;
  }
  if (view === "create") return <JournalCreateView />;
  return <JournalsListView />;
}
