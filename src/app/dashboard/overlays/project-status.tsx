"use client";

import { useOptimistic } from "react";
import { CircleCheck, Pause, Play, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { saveInBackground } from "./use-optimistic-list";

type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
type ProjectAction = (projectId: string) => Promise<void>;

const STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

const STATUS_PILL: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-primary/10 text-primary",
};

/**
 * A project's status as a small pill, with quiet icon buttons beside it:
 * pause or resume, mark complete, and delete. A status change shows at once
 * and saves in the background; it switches back if the save fails.
 */
export function ProjectStatusControls({
  projectId,
  status,
  pauseAction,
  resumeAction,
  completeAction,
  deleteAction,
}: {
  projectId: string;
  status: ProjectStatus;
  pauseAction: ProjectAction;
  resumeAction: ProjectAction;
  completeAction: ProjectAction;
  deleteAction: ProjectAction;
}) {
  const [shownStatus, showStatus] = useOptimistic(status);

  function changeStatus(newStatus: ProjectStatus, save: ProjectAction) {
    return async () => {
      showStatus(newStatus);
      await saveInBackground(() => save(projectId));
    };
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <span
        role="status"
        className={`mr-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[shownStatus]}`}
      >
        {STATUS_LABEL[shownStatus]}
      </span>
      {shownStatus === "ACTIVE" && (
        <form action={changeStatus("PAUSED", pauseAction)}>
          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Pause" title="Pause">
            <Pause aria-hidden />
          </Button>
        </form>
      )}
      {shownStatus === "PAUSED" && (
        <form action={changeStatus("ACTIVE", resumeAction)}>
          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Resume" title="Resume">
            <Play aria-hidden />
          </Button>
        </form>
      )}
      {shownStatus !== "COMPLETED" && (
        <form action={changeStatus("COMPLETED", completeAction)}>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Mark complete"
            title="Mark complete (the end goal is met)"
          >
            <CircleCheck aria-hidden />
          </Button>
        </form>
      )}
      <form action={deleteAction.bind(null, projectId)}>
        <ConfirmSubmitButton
          variant="ghost"
          size="icon-sm"
          aria-label="Delete project"
          title="Delete project"
          className="text-destructive"
          confirmMessage="Delete this project and all its tasks? This can't be undone."
        >
          <Trash2 aria-hidden />
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
