import type { PanelArt } from "@/components/ui/sheet";

// The clipped, ruled notepaper behind Quick Lists and the Dopamine menu.
export const QUICK_NOTES_ART: PanelArt = {
  src: "/panel-art/quick-notes-pop-up.png",
  width: 614,
  height: 996,
  // The ruled sheet, right of the punch holes where the lines start. Its top
  // edge sits one line above the first ruled line (at 19.98%), so the
  // popup's rows line up with the ruled lines, 4.806% of the photo apart.
  paperArea: { top: 15.17, right: 4.5, bottom: 0.4, left: 13 },
  ruledLines: { spacing: 4.806 },
  // 30% bigger than the photo's own size when the screen has room.
  scale: 1.3,
};
