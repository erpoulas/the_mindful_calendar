import { AffirmationsView } from "../../overlays/affirmations";
import { PanelSheet } from "../../panel-sheet";

export default function AffirmationsPanel() {
  return (
    <PanelSheet open title="Affirmations">
      <AffirmationsView />
    </PanelSheet>
  );
}
