import { notFound } from "next/navigation";
import { Target } from "lucide-react";
import {
  addProjectTaskAction,
  completeProjectAction,
  createProjectAction,
  deleteProjectAction,
  deleteProjectTaskAction,
  pauseProjectAction,
  renameProjectAction,
  resumeProjectAction,
  setProjectDueDateAction,
  setProjectIntentionsAction,
  toggleProjectTaskAction,
  updateProjectEndGoalAction,
  updateProjectTaskTextAction,
} from "@/app/actions/projects";
import { scheduleProjectTaskNowAction } from "@/app/actions/schedule-now";
import { getCurrentUserId } from "@/lib/auth";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findIntentionColor } from "@/lib/intention-colors";
import { dueDateInputValue } from "@/lib/project-due-date";
import { storedIntentions, storedProjectDetail, storedProjects } from "@/lib/stored-reads";
import { Checklist } from "./checklist";
import { EditableName } from "./editable-name";
import { ProjectIntentionChips, type IntentionChoice } from "./intention-chips";
import { NameTabs } from "./name-tabs";
import { NewProjectForm } from "./new-project-form";
import { pageHeadingClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";
import { ProjectDueDate } from "./project-due-date";
import { ProjectStatusControls } from "./project-status";

/**
 * The whole Project Tracker on one screen, like Quick Lists: a tab per
 * project (with "+" for a blank new one), and the open project with
 * everything editable in place: click its name or end goal to edit, tap
 * intentions to pick them, set the due date, and add, tick, edit or
 * backspace away tasks like Quick List items.
 */
export async function ProjectsView({
  activeId,
  creating = false,
}: {
  activeId?: string;
  /** Shows a blank new project instead of a saved one. */
  creating?: boolean;
}) {
  const userId = await getCurrentUserId();
  // With a project picked in the URL, load it alongside the tabs. Otherwise
  // the first project is shown, which needs the tabs first to know which.
  const [projects, intentions, pickedProject] = await Promise.all([
    storedProjects(userId),
    storedIntentions(userId),
    activeId && !creating ? storedProjectDetail(userId, activeId) : null,
  ]);
  const firstId = projects[0]?.id;
  const project = creating
    ? null
    : activeId
      ? pickedProject
      : firstId
        ? await storedProjectDetail(userId, firstId)
        : null;
  if (activeId && !creating && !project) notFound();

  const intentionChoices: IntentionChoice[] = intentions.map((intention) => ({
    id: intention.id,
    name: intention.name,
    colorHex: findIntentionColor(intention.color)?.hex ?? null,
  }));

  return (
    <div className="flex flex-col gap-5">
      <NameTabs
        label="Projects"
        noun="project"
        items={projects.map((saved) => ({ id: saved.id, name: saved.title }))}
        activeId={project?.id}
        hrefFor={dashboardRoutes.projects}
        newHref={dashboardRoutes.newProject()}
        creating={creating}
      />

      {creating && <NewProjectForm intentions={intentionChoices} createAction={createProjectAction} />}

      {!creating && !project && (
        <PopupEmptyState
          message="No projects yet. Pick something with a real finish line, like running your first 5k."
          action={{ href: dashboardRoutes.newProject(), label: "Start a project" }}
        />
      )}

      {project && (
        // A fresh set of boxes for each project, so switching tabs drops
        // anything half-typed.
        <div key={project.id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <EditableName
              id={project.id}
              name={project.title}
              label="Project name"
              fieldName="title"
              renameAction={renameProjectAction}
              className={`${pageHeadingClassName} wrap-anywhere`}
            />
            <ProjectStatusControls
              projectId={project.id}
              status={project.status}
              pauseAction={pauseProjectAction}
              resumeAction={resumeProjectAction}
              completeAction={completeProjectAction}
              deleteAction={deleteProjectAction}
            />
          </div>

          <div className="flex items-start gap-2">
            <Target className="mt-1 size-4 shrink-0 text-amber-700/70" aria-label="End goal" />
            <EditableName
              id={project.id}
              name={project.endGoal}
              label="End goal"
              fieldName="endGoal"
              as="p"
              renameAction={updateProjectEndGoalAction}
              className="text-[15px] wrap-anywhere"
            />
          </div>

          <div className="flex flex-col gap-2">
            <ProjectIntentionChips
              intentions={intentionChoices}
              selectedIds={project.intentions.map((link) => link.intentionId)}
              saveAction={setProjectIntentionsAction.bind(null, project.id)}
            />
            <ProjectDueDate
              dueDate={project.dueDate ? dueDateInputValue(project.dueDate) : ""}
              saveAction={setProjectDueDateAction.bind(null, project.id)}
            />
          </div>

          <Checklist
            listId={project.id}
            items={project.tasks.map(({ id, text, done }) => ({ id, text, done }))}
            addPlaceholder="New task"
            toggleAction={toggleProjectTaskAction}
            addAction={addProjectTaskAction}
            editTextAction={updateProjectTaskTextAction}
            deleteAction={deleteProjectTaskAction}
            scheduleProjectId={project.id}
            startNowAction={scheduleProjectTaskNowAction}
            // A project just started is ready for its first task.
            focusNewItem={project.tasks.length === 0}
          />
        </div>
      )}
    </div>
  );
}
