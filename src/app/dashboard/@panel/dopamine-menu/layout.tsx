import { Caveat } from "next/font/google";
import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

// The menu's own handwritten font, unlike the rest of the app.
const caveat = Caveat({ subsets: ["latin"] });

const DOPAMINE_MENU_ART: PanelArt = {
  // A silver tray (cut out of its photo) with a carved-frame paper menu
  // laid on it.
  src: "/panel-art/dopamine-menu.png",
  width: 598,
  height: 774,
  // The plain cream panel inside the paper's carved frame.
  paperArea: { top: 25, right: 28.5, bottom: 25.5, left: 28 },
  contentWidth: 100,
  alignTop: true,
  scale: 1.4,
};

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function DopamineMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open size="center" title="Dopamine Menu" backgroundImage={DOPAMINE_MENU_ART}>
      <div className={`${caveat.className} text-lg [--paper-text:20px]`}>{children}</div>
    </PanelSheet>
  );
}
