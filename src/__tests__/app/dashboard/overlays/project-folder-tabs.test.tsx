import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectFolderTabs } from "@/app/dashboard/overlays/project-folder-tabs";

const activeProjects = [
  { id: "p1", title: "Garden", tasksDone: 2, tasksTotal: 3 },
  { id: "p2", title: "5k", tasksDone: 0, tasksTotal: 0 },
];

describe("ProjectFolderTabs", () => {
  it("gives each project in progress a tab, marking the open one", () => {
    render(<ProjectFolderTabs activeProjects={activeProjects} finishedCount={0} open={{ kind: "project", id: "p2" }} />);

    expect(screen.getByRole("link", { name: "Garden" })).toHaveAttribute("href", "/dashboard/projects?id=p1");
    expect(screen.getByRole("link", { name: "5k" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "New project" })).toHaveAttribute("href", "/dashboard/projects?view=new");
  });

  it("shows the Finished shelf tab only once a project is finished", () => {
    const { rerender } = render(<ProjectFolderTabs activeProjects={activeProjects} finishedCount={0} open={null} />);
    expect(screen.queryByRole("link", { name: /Finished/ })).not.toBeInTheDocument();

    rerender(<ProjectFolderTabs activeProjects={activeProjects} finishedCount={3} open={{ kind: "finished" }} />);
    const shelf = screen.getByRole("link", { name: /Finished/ });
    expect(shelf).toHaveAttribute("href", "/dashboard/projects?view=finished");
    expect(shelf).toHaveTextContent("3");
    expect(shelf).toHaveAttribute("aria-current", "page");
  });

  it("draws a small progress ring on tabs whose project has tasks", () => {
    render(<ProjectFolderTabs activeProjects={activeProjects} finishedCount={0} open={null} />);

    const garden = screen.getByRole("link", { name: "Garden" });
    expect(garden).toHaveAttribute("title", "Garden · 2 of 3 tasks done");
    expect(garden.querySelector("[data-progress-ring]")).toHaveAttribute("data-progress-ring", "67");

    const fiveK = screen.getByRole("link", { name: "5k" });
    expect(fiveK).toHaveAttribute("title", "5k");
    expect(fiveK.querySelector("[data-progress-ring]")).toBeNull();
  });
});
