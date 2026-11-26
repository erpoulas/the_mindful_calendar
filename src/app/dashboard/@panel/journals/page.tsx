import { stringParam } from "@/lib/dashboard-routes";
import { JournalsView } from "../../overlays/journals";

export default async function JournalsPanel({ searchParams }: PageProps<"/dashboard/journals">) {
  const query = await searchParams;
  return <JournalsView activeId={stringParam(query.id)} />;
}
