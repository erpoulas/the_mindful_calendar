import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sheet } from "@/components/ui/sheet";

const NOTEBOOK_ART = {
  src: "/panel-art/side-popup-journal.png",
  width: 818,
  height: 1099,
  paperArea: { top: 4.5, right: 2.2, bottom: 4, left: 12.2 },
};

describe("Sheet with panel art", () => {
  it("keeps the scrolling area inside the paper of the art", async () => {
    render(
      <Sheet open onOpenChange={() => {}} title="Journals" backgroundImage={NOTEBOOK_ART}>
        <p>Journal list</p>
      </Sheet>,
    );

    const scrollArea = (await screen.findByText("Journal list")).closest(".overflow-y-auto");
    expect(scrollArea).toHaveStyle({ top: "4.5%", right: "2.2%", bottom: "4%", left: "12.2%" });
  });

  it("puts the header in the art's own corner when the art names one", async () => {
    render(
      <Sheet
        open
        onOpenChange={() => {}}
        title="Dopamine Menu"
        size="center"
        backgroundImage={{ ...NOTEBOOK_ART, headerAt: { top: 3, left: 4 } }}
        headerStart={<button type="button">Back</button>}
      >
        <p>Menu</p>
      </Sheet>,
    );

    const header = (await screen.findByRole("button", { name: "Back" })).closest(".absolute");
    expect(header).toHaveStyle({ top: "3%", left: "4%" });
    // Not inside the scrolling paper area, which starts lower down.
    expect(header).not.toHaveClass("overflow-y-auto");
  });
});
