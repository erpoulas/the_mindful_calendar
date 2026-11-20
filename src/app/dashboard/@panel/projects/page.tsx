import { stringParam } from "@/lib/dashboard-routes";
import {
  ProjectCreateView,
  ProjectDetailView,
  ProjectEditView,
  ProjectsListView,
} from "../../overlays/projects";

export default async function ProjectsPanel({ searchParams }: PageProps<"/dashboard/projects">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  if (view === "edit" && id) return <ProjectEditView id={id} />;
  if (view === "detail" && id) return <ProjectDetailView id={id} />;
  if (view === "create") return <ProjectCreateView />;
  return <ProjectsListView />;
}
