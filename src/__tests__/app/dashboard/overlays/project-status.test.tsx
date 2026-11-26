import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectStatusControls } from "@/app/dashboard/overlays/project-status";

const never = () => new Promise<void>(() => {});

function renderControls(status: "ACTIVE" | "PAUSED" | "COMPLETED", pauseAction = vi.fn(never)) {
  render(
    <ProjectStatusControls
      projectId="p1"
      status={status}
      pauseAction={pauseAction}
      resumeAction={vi.fn(never)}
      completeAction={vi.fn(never)}
      deleteAction={vi.fn(never)}
    />,
  );
  return pauseAction;
}

describe("ProjectStatusControls", () => {
  it("shows the new status and buttons the moment Pause is clicked", async () => {
    const pauseAction = renderControls("ACTIVE");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Paused");
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
    expect(pauseAction).toHaveBeenCalledWith("p1");
  });

  it("offers no pause or complete on a completed project, only delete", () => {
    renderControls("COMPLETED");

    expect(screen.getByRole("status")).toHaveTextContent("Completed");
    expect(screen.queryByRole("button", { name: "Pause" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark complete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete project" })).toBeInTheDocument();
  });
});
