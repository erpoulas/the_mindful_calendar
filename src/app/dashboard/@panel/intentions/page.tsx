import { stringParam } from "@/lib/dashboard-routes";
import { IntentionDetailView, IntentionEditView, IntentionsListView } from "../../overlays/intentions";

export default async function IntentionsPanel({ searchParams }: PageProps<"/dashboard/intentions">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  if (view === "edit" && id) return <IntentionEditView id={id} />;
  if (view === "detail" && id) return <IntentionDetailView id={id} />;
  return <IntentionsListView />;
}
