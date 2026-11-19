import { DopamineMenuView } from "../../overlays/dopamine-menu";
import { PanelSheet } from "../../panel-sheet";

export default function DopamineMenuPanel() {
  return (
    <PanelSheet open title="Dopamine Menu">
      <DopamineMenuView />
    </PanelSheet>
  );
}
