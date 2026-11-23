import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

const PROJECT_ART: PanelArt = {
  src: "/panel-art/project-tracker-side-popup.png",
  width: 863,
  height: 1108,
  // The white sheet, right of the folder's yellow tab.
  paperArea: { top: 2.2, right: 0.5, bottom: 0.5, left: 11.6 },
};

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
