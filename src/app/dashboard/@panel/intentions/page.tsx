import { stringParam } from "@/lib/dashboard-routes";
import { IntentionDetailView, IntentionEditView, IntentionsListView } from "../../overlays/intentions";
import { PanelSheet } from "../../panel-sheet";

export default async function IntentionsPanel({ searchParams }: PageProps<"/dashboard/intentions">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  let title = "Intentions";
  let content = <IntentionsListView />;
  if (view === "edit" && id) {
    title = "Edit intention";
    content = <IntentionEditView id={id} />;
  } else if (view === "detail" && id) {
    title = "Intention";
    content = <IntentionDetailView id={id} />;
  }

  return (
    <PanelSheet open title={title}>
      {content}
    </PanelSheet>
  );
}
