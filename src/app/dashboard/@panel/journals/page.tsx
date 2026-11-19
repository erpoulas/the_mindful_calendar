import { stringParam } from "@/lib/dashboard-routes";
import {
  JournalCreateView,
  JournalDetailView,
  JournalEditView,
  JournalEntryEditView,
  JournalsListView,
} from "../../overlays/journals";
import { PanelSheet } from "../../panel-sheet";

const JOURNAL_ART = { src: "/panel-art/side-popup-journal.png", width: 818, height: 1099 };

export default async function JournalsPanel({ searchParams }: PageProps<"/dashboard/journals">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);
  const entryId = stringParam(query.entryId);

  let title = "Journals";
  let content = <JournalsListView />;
  if (view === "entry-edit" && id && entryId) {
    title = "Entry";
    content = <JournalEntryEditView id={id} entryId={entryId} />;
  } else if (view === "edit" && id) {
    title = "Edit journal";
    content = <JournalEditView id={id} />;
  } else if (view === "detail" && id) {
    title = "Journal";
    content = <JournalDetailView id={id} />;
  } else if (view === "create") {
    title = "New journal";
    content = <JournalCreateView />;
  }

  return (
    <PanelSheet open title={title} backgroundImage={JOURNAL_ART}>
      {content}
    </PanelSheet>
  );
}
