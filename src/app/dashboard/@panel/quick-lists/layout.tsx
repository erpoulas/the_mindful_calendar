import { PanelSheet } from "../../panel-sheet";

const QUICK_NOTES_ART = {
  src: "/panel-art/quick-notes-pop-up.png",
  width: 614,
  height: 996,
  // This photo has a clip along the top edge and punch holes down the
  // left, instead of a plain left-edge binding like the journal/project
  // photos, so it needs clearance on both sides.
  contentInsetClassName: "pt-[20%] pl-[16%]",
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
