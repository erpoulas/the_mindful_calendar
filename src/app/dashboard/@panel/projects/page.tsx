import { stringParam } from "@/lib/dashboard-routes";
import { ProjectsView } from "../../overlays/projects";

export default async function ProjectsPanel({ searchParams }: PageProps<"/dashboard/projects">) {
  const query = await searchParams;
  return (
    <ProjectsView activeId={stringParam(query.id)} creating={stringParam(query.view) === "new"} />
  );
}
