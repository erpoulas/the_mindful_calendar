import { PanelSheet } from "../../panel-sheet";

const PROJECT_ART = { src: "/panel-art/project-tracker-side-popup.png", width: 863, height: 1108 };

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open title="Projects"
      titlesByView={{ edit: "Edit project", detail: "Project", create: "New project" }}
      backgroundImage={PROJECT_ART}>
      {children}
    </PanelSheet>
  );
}
