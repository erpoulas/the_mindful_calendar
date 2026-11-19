import { stringParam } from "@/lib/dashboard-routes";
import {
  ProjectCreateView,
  ProjectDetailView,
  ProjectEditView,
  ProjectsListView,
} from "../../overlays/projects";
import { PanelSheet } from "../../panel-sheet";

const PROJECT_ART = { src: "/panel-art/project-tracker-side-popup.png", width: 863, height: 1108 };

export default async function ProjectsPanel({ searchParams }: PageProps<"/dashboard/projects">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  let title = "Projects";
  let content = <ProjectsListView />;
  if (view === "edit" && id) {
    title = "Edit project";
    content = <ProjectEditView id={id} />;
  } else if (view === "detail" && id) {
    title = "Project";
    content = <ProjectDetailView id={id} />;
  } else if (view === "create") {
    title = "New project";
    content = <ProjectCreateView />;
  }

  return (
    <PanelSheet open title={title} backgroundImage={PROJECT_ART}>
      {content}
    </PanelSheet>
  );
}
