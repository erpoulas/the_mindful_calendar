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
});
