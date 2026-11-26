import { stringParam } from "@/lib/dashboard-routes";
import { QuickListsView } from "../../overlays/quick-lists";

export default async function QuickListsPanel({ searchParams }: PageProps<"/dashboard/quick-lists">) {
  const query = await searchParams;
  return <QuickListsView activeId={stringParam(query.id)} />;
}
