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
import { scheduleProjectTaskNowAction } from "@/app/actions/schedule-now";
import { getCurrentUserId } from "@/lib/auth";
import { storedIntentions, storedProjectDetail, storedProjects } from "@/lib/stored-reads";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findListNeighbors } from "@/lib/list-neighbors";
import { Checklist } from "./checklist";
import { PopupListNavigation } from "./popup-list-navigation";
import { ProjectForm } from "./project-form";
import { ProjectOverview } from "./project-overview";

const STATUS_LABEL = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export async function ProjectsListView() {
  const userId = await getCurrentUserId();
  const projects = await storedProjects(userId);

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects yet — add one below.</p>
        )}
        {projects.map((project) => (
          <li key={project.id}>
            {/* prefetch: loads each project's screen while the list is open. */}
            <Link
              href={dashboardRoutes.project(project.id)}
              prefetch
              className="flex items-center justify-between px-1 py-1 hover:underline"
            >
              <span>{project.title}</span>
              <span className="text-sm text-muted-foreground">{STATUS_LABEL[project.status]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href={dashboardRoutes.newProject()} className="text-sm hover:underline">
        + Create new project
      </Link>
    </div>
  );
}

export async function ProjectCreateView() {
  const userId = await getCurrentUserId();
  const intentions = await storedIntentions(userId);

  return (
    <ProjectForm
      action={createProjectAction}
      heading="New project"
      submitLabel="Add project"
      pendingLabel="Adding..."
      intentions={intentions}
    />
  );
}

export async function ProjectDetailView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [project, projects] = await Promise.all([
    storedProjectDetail(userId, id),
    storedProjects(userId),
  ]);
  if (!project) notFound();
  const { previous, next } = findListNeighbors(projects, project.id);

  return (
    <div className="flex flex-col gap-6">
      <PopupListNavigation
        back={{ href: dashboardRoutes.projects(), label: "All projects" }}
        previous={previous && { href: dashboardRoutes.project(previous.id), label: previous.title }}
        next={next && { href: dashboardRoutes.project(next.id), label: next.title }}
      />
      <ProjectOverview
        projectId={project.id}
        title={project.title}
        endGoal={project.endGoal}
        dueLabel={project.dueDate ? project.dueDate.toLocaleDateString() : null}
        status={project.status}
        editHref={dashboardRoutes.editProject(project.id)}
        pauseAction={pauseProjectAction}
        resumeAction={resumeProjectAction}
        completeAction={completeProjectAction}
        deleteAction={deleteProjectAction}
      />

      <div>
        <h3 className="text-lg font-medium">Tasks</h3>
        <Checklist
          listId={project.id}
          items={project.tasks.map(({ id, text, done }) => ({ id, text, done }))}
          emptyText="No tasks yet."
          addPlaceholder="Add a task"
          toggleAction={toggleProjectTaskAction}
          addAction={addProjectTaskAction}
          scheduleProjectId={project.id}
          startNowAction={scheduleProjectTaskNowAction}
          listClassName="mt-2 flex flex-col gap-2"
          formClassName="mt-3 flex gap-2"
        />
      </div>
    </div>
  );
}

export async function ProjectEditView({ id }: { id: string }) {
  const userId = await getCurrentUserId();

  const [project, intentions] = await Promise.all([
    storedProjectDetail(userId, id),
    storedIntentions(userId),
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
