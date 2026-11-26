import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

const DOPAMINE_MENU_ART: PanelArt = {
  // A striped café menu whose printed text was painted out, leaving the
  // frame, its title oval and the little drawings.
  src: "/panel-art/dopamine-menu.png",
  width: 736,
  height: 952,
  // The empty cream below the title oval and envelope, above the teacup,
  // inside the wavy frame.
  paperArea: { top: 30, right: 17.5, bottom: 22.5, left: 17.5 },
  contentWidth: 100,
  alignTop: true,
};

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function DopamineMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open title="Dopamine Menu" backgroundImage={DOPAMINE_MENU_ART}>
      {children}
    </PanelSheet>
  );
}
