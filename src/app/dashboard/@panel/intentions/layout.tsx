import { PanelSheet } from "../../panel-sheet";

// The popup's frame. It stays on screen while you move between its
// screens; page.tsx (behind loading.tsx) fills it.
export default function IntentionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelSheet open title="Intentions" titlesByView={{ edit: "Edit intention", detail: "Intention" }}>
      {children}
    </PanelSheet>
  );
}
