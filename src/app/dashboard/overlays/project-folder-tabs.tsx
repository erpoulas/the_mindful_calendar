import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { dashboardRoutes } from "@/lib/dashboard-routes";

// Manila folder tabs along the top of the sheet, like a filing folder: the
// open one is white and runs into the page below (its bottom border is
// white, over the sheet's edge line); the others sit behind it in manila.
const FOLDER_TAB_CLASSES =
  "relative -mb-px flex h-8 min-w-0 items-center gap-1.5 rounded-t-lg border border-amber-900/15 px-3 text-sm transition";
function folderTabClassName(open: boolean) {
  return `${FOLDER_TAB_CLASSES} ${
    open
      ? "z-10 border-b-white bg-white font-medium text-foreground"
      : "bg-[#f9e0a8] text-amber-950/70 hover:bg-[#f6d690] hover:text-amber-950"
  }`;
}

export type FolderTabsOpen = { kind: "project"; id: string } | { kind: "new" } | { kind: "finished" } | null;

/**
 * One tab per project still in progress, a "+" tab for a new one, and a
 * "Finished" tab at the far end holding the completed projects, so they
 * stop crowding the active ones. Each tab is one click, with nothing in
 * between.
 */
export function ProjectFolderTabs({
  activeProjects,
  finishedCount,
  open,
}: {
  activeProjects: { id: string; title: string }[];
  finishedCount: number;
  open: FolderTabsOpen;
}) {
  return (
    <nav aria-label="Projects" className="flex flex-wrap items-end gap-x-0.5 border-b border-amber-900/15">
      {activeProjects.map((project) => {
        const isOpen = open?.kind === "project" && open.id === project.id;
        return (
          <Link
            key={project.id}
            href={dashboardRoutes.projects(project.id)}
            // Loads each tab while the popup is open, so switching is instant.
            prefetch
            title={project.title}
            aria-current={isOpen ? "page" : undefined}
            className={folderTabClassName(isOpen)}
          >
            {/* Long names end in "…"; hovering shows the whole name. */}
            <span className="max-w-[9rem] truncate">{project.title}</span>
          </Link>
        );
      })}
      <Link
        href={dashboardRoutes.newProject()}
        prefetch
        aria-label="New project"
        title="New project"
        aria-current={open?.kind === "new" ? "page" : undefined}
        className={folderTabClassName(open?.kind === "new")}
      >
        <Plus className="size-4" aria-hidden />
      </Link>
      {finishedCount > 0 && (
        <Link
          href={dashboardRoutes.finishedProjects()}
          prefetch
          aria-current={open?.kind === "finished" ? "page" : undefined}
          className={`${folderTabClassName(open?.kind === "finished")} ml-auto`}
        >
          <Trophy className="size-3.5" aria-hidden />
          Finished
          <span className="text-xs text-muted-foreground">{finishedCount}</span>
        </Link>
      )}
    </nav>
  );
}
