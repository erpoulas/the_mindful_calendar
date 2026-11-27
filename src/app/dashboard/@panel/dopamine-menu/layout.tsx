import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

const DOPAMINE_MENU_ART: PanelArt = {
  // A cream menu card: a wavy blue frame tied with a bow, and little line
  // drawings (champagne, salad, teacup, cake) in its corners.
  src: "/panel-art/dopamine-menu-card.png",
  width: 1000,
  height: 1500,
  // Inside the frame, between the top and bottom drawings.
  paperArea: { top: 28, right: 15, bottom: 27, left: 15 },
  contentWidth: 100,
  alignTop: true,
  scale: 0.62,
};

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it. Everything on the card
// is in the drawings' steel blue.
export default function DopamineMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open size="center" title="Dopamine Menu" backgroundImage={DOPAMINE_MENU_ART}>
      <div className="text-[#3b7399]">{children}</div>
    </PanelSheet>
  );
}
