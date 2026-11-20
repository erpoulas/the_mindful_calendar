import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProjectOverview } from "@/app/dashboard/overlays/project-overview";

const never = () => new Promise<void>(() => {});

describe("ProjectOverview", () => {
  it("shows the new status and buttons the moment Pause is clicked", async () => {
    const pauseAction = vi.fn(never);
    render(
      <ProjectOverview
        projectId="p1"
        title="Garden"
        endGoal="Grow tomatoes"
        dueLabel={null}
        status="ACTIVE"
        editHref="/dashboard/projects?view=edit&id=p1"
        pauseAction={pauseAction}
        resumeAction={vi.fn(never)}
        completeAction={vi.fn(never)}
        deleteAction={vi.fn(never)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    expect(await screen.findByText("PAUSED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
    expect(pauseAction).toHaveBeenCalledWith("p1");
  });
});
