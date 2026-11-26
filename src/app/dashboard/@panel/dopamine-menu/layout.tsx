import { PanelSheet } from "../../panel-sheet";

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function DopamineMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open title="Dopamine Menu">
      {children}
    </PanelSheet>
  );
}
