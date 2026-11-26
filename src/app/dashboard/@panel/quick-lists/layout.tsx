import { QUICK_NOTES_ART } from "../../panel-art";
import { PanelSheet } from "../../panel-sheet";

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function QuickListsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open size="center"
      title="Quick Lists"
      backgroundImage={QUICK_NOTES_ART}>
      {children}
    </PanelSheet>
  );
}
