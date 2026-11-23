import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

const QUICK_NOTES_ART: PanelArt = {
  src: "/panel-art/quick-notes-pop-up.png",
  width: 614,
  height: 996,
  // The ruled sheet, below the clip and right of the punch holes.
  paperArea: { top: 16, right: 0.8, bottom: 0.4, left: 10 },
};

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function QuickListsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open size="center"
      title="Quick Lists"
      titlesByView={{ edit: "Edit list", create: "New list" }}
      backgroundImage={QUICK_NOTES_ART}>
      {children}
    </PanelSheet>
  );
}
