import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addProjectTaskAction,
  completeProjectAction,
  createProjectAction,
  deleteProjectAction,
  pauseProjectAction,
  resumeProjectAction,
  toggleProjectTaskAction,
  updateProjectAction,
} from "@/app/actions/projects";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { listIntentions } from "@/lib/intentions";
import { getProjectDetail, listProjects } from "@/lib/projects";
import { ProjectForm } from "./project-form";

const STATUS_LABEL = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export async function ProjectsListView() {
  const userId = await getCurrentUserId();
  const [projects, intentions] = await Promise.all([
    listProjects(db, userId),
    listIntentions(db, userId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet — add one below.</p>
        )}
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/dashboard?panel=projects&view=detail&id=${project.id}`}
              className="flex items-center justify-between px-1 py-1 hover:underline"
            >
              <span>{project.title}</span>
              <span className="text-sm text-muted-foreground">{STATUS_LABEL[project.status]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <ProjectForm
        action={createProjectAction}
        heading="New project"
        submitLabel="Add project"
        pendingLabel="Adding..."
        intentions={intentions}
      />
    </div>
  );
}

export async function ProjectDetailView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const project = await getProjectDetail(db, { userId, projectId: id });
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{project.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{project.endGoal}</p>
        {project.dueDate && (
          <p className="mt-1 text-sm text-muted-foreground">
            Due {project.dueDate.toLocaleDateString()}
          </p>
        )}
        <p className="mt-1 text-sm font-medium">{project.status}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {project.status === "ACTIVE" && (
          <form action={pauseProjectAction.bind(null, project.id)}>
            <Button type="submit" variant="outline">
              Pause
            </Button>
          </form>
        )}
        {project.status === "PAUSED" && (
          <form action={resumeProjectAction.bind(null, project.id)}>
            <Button type="submit" variant="outline">
              Resume
            </Button>
          </form>
        )}
        {project.status !== "COMPLETED" && (
          <form action={completeProjectAction.bind(null, project.id)}>
            <Button type="submit">Mark complete</Button>
          </form>
        )}
        <Link
          href={`/dashboard?panel=projects&view=edit&id=${project.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit
        </Link>
        <form action={deleteProjectAction.bind(null, project.id)}>
          <ConfirmSubmitButton confirmMessage="Delete this project? This can't be undone.">
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium">Tasks</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {project.tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          {project.tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <form action={toggleProjectTaskAction.bind(null, task.id, project.id)}>
                <button
                  type="submit"
                  aria-label={task.done ? "Mark not done" : "Mark done"}
                  className={`h-5 w-5 rounded border ${
                    task.done ? "border-primary bg-primary" : "border-border bg-background"
                  }`}
                />
              </form>
              <span className={task.done ? "text-muted-foreground line-through" : ""}>
                {task.text}
              </span>
            </li>
          ))}
        </ul>

        <form
          action={addProjectTaskAction.bind(null, project.id)}
          className="mt-3 flex gap-2"
        >
          <Input name="text" placeholder="Add a task" required />
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  );
}

export async function ProjectEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [project, intentions] = await Promise.all([
    getProjectDetail(db, { userId, projectId: id }),
    listIntentions(db, userId),
  ]);

  if (!project) notFound();

  return (
    <ProjectForm
      action={updateProjectAction.bind(null, id)}
      heading="Edit project"
      submitLabel="Save"
      pendingLabel="Saving..."
      intentions={intentions}
      initialValues={{
        title: project.title,
        endGoal: project.endGoal,
        dueDate: project.dueDate,
        intentionIds: project.intentions.map((pi) => pi.intentionId),
      }}
    />
  );
}
