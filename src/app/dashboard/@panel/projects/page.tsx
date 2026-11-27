import { stringParam } from "@/lib/dashboard-routes";
import { ProjectsView } from "../../overlays/projects";

export default async function ProjectsPanel({ searchParams }: PageProps<"/dashboard/projects">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  return (
    <ProjectsView
      activeId={stringParam(query.id)}
      show={view === "new" || view === "finished" ? view : "project"}
    />
  );
}
