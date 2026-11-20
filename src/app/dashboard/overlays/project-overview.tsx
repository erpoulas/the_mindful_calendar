"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { saveInBackground } from "./use-optimistic-list";

type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
type StatusAction = (projectId: string) => Promise<void>;

/**
 * The top of a project's screen: its details, status and buttons. Pause,
 * Resume and Mark complete change the status on screen at once and save in
 * the background; it switches back if the save fails.
 */
export function ProjectOverview({
  projectId,
  title,
  endGoal,
  dueLabel,
  status,
  editHref,
  pauseAction,
  resumeAction,
  completeAction,
  deleteAction,
}: {
  projectId: string;
  title: string;
  endGoal: string | null;
  /** Formatted on the server, so the browser shows the same text. */
  dueLabel: string | null;
  status: ProjectStatus;
  editHref: string;
  pauseAction: StatusAction;
  resumeAction: StatusAction;
  completeAction: StatusAction;
  deleteAction: StatusAction;
}) {
  const [shownStatus, showStatus] = useOptimistic(status);

  function changeStatus(newStatus: ProjectStatus, save: StatusAction) {
    return async () => {
      showStatus(newStatus);
      await saveInBackground(() => save(projectId));
    };
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{endGoal}</p>
        {dueLabel && <p className="mt-1 text-sm text-muted-foreground">Due {dueLabel}</p>}
        <p className="mt-1 text-sm font-medium">{shownStatus}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {shownStatus === "ACTIVE" && (
          <form action={changeStatus("PAUSED", pauseAction)}>
            <Button type="submit" variant="outline">
              Pause
            </Button>
          </form>
        )}
        {shownStatus === "PAUSED" && (
          <form action={changeStatus("ACTIVE", resumeAction)}>
            <Button type="submit" variant="outline">
              Resume
            </Button>
          </form>
        )}
        {shownStatus !== "COMPLETED" && (
          <form action={changeStatus("COMPLETED", completeAction)}>
            <Button type="submit">Mark complete</Button>
          </form>
        )}
        <Link href={editHref} className={buttonVariants({ variant: "outline" })}>
          Edit
        </Link>
        <form action={deleteAction.bind(null, projectId)}>
          <ConfirmSubmitButton confirmMessage="Delete this project? This can't be undone.">
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>
    </>
  );
}
