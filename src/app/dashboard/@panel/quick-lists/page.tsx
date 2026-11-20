import { stringParam } from "@/lib/dashboard-routes";
import { QuickListCreateView, QuickListEditView, QuickListsView } from "../../overlays/quick-lists";

export default async function QuickListsPanel({ searchParams }: PageProps<"/dashboard/quick-lists">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  if (view === "edit" && id) return <QuickListEditView id={id} />;
  if (view === "create") return <QuickListCreateView />;
  return <QuickListsView activeId={id} />;
}
