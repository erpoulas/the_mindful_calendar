import type { PanelArt } from "@/components/ui/sheet";
import { PanelSheet } from "../../panel-sheet";

const JOURNAL_ART: PanelArt = {
  src: "/panel-art/side-popup-journal.png",
  width: 818,
  height: 1099,
  // The cream page: right of the spiral, inside the page edges.
  paperArea: { top: 4.5, right: 2.2, bottom: 4, left: 12.2 },
};

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function JournalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open title="Journals"
      titlesByView={{ "entry-edit": "Entry", edit: "Edit journal", detail: "Journal", create: "New journal" }}
      backgroundImage={JOURNAL_ART}>
      {children}
    </PanelSheet>
  );
}
