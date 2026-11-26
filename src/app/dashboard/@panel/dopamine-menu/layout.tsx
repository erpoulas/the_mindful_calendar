import { QUICK_NOTES_ART } from "../../panel-art";
import { PanelSheet } from "../../panel-sheet";

// The popup's frame: the same ruled notepaper as Quick Lists, so the menu's
// items sit on its lines. page.tsx (behind loading.tsx) fills it.
export default function DopamineMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open size="center" title="Dopamine Menu" backgroundImage={QUICK_NOTES_ART}>
      {children}
    </PanelSheet>
  );
}
