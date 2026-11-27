import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Trophy } from "lucide-react";
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
import { getWeekRange } from "@/lib/calendar-week";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findIntentionColor } from "@/lib/intention-colors";
import { dueDateInputValue, formatDueDate } from "@/lib/project-due-date";
import {
  describeLastWorked,
  formatDuration,
  summarizeProjectTime,
  wholeDaysBetween,
} from "@/lib/project-progress";
import {
  storedIntentions,
  storedProjectDetail,
  storedProjects,
  storedProjectSessions,
  storedTimezone,
} from "@/lib/stored-reads";
import { toWallClockDate } from "@/lib/wall-clock";
import { Checklist } from "./checklist";
import { EditableName } from "./editable-name";
import { ProjectIntentionChips, type IntentionChoice } from "./intention-chips";
import { ScheduleIconLink, StartNowButton } from "./item-actions";
import { NewProjectForm } from "./new-project-form";
import { pageHeadingClassName, softCardLinkClassName } from "./photo-page-styles";
import { PopupEmptyState } from "./popup-empty-state";
import { ProjectDueDate } from "./project-due-date";
import { type FolderTabsOpen, ProjectFolderTabs } from "./project-folder-tabs";
import { ProjectStatusControls } from "./project-status";

type Session = { projectId: string; startAt: Date; endAt: Date };
type Clock = { now: Date; weekStart: Date; weekEnd: Date };

/** Minutes put into one project, this week and in all. */
function timeFor(projectId: string, sessions: Session[], clock: Clock) {
  return summarizeProjectTime(
    sessions.filter((session) => session.projectId === projectId),
    clock,
  );
}

/** "Finished Nov 26 · 48 days · 23h · 10 tasks": a finished project at a glance. */
function finishedSummary(
  project: { createdAt: Date; completedAt: Date | null },
  totalMinutes: number,
  tasksDone: number,
  timeZone: string,
) {
  // completedAt is a real moment, so it's shown in the user's time zone.
  const finishedAt = project.completedAt ?? project.createdAt;
  const parts = [
    `Finished ${finishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone })}`,
    `${wholeDaysBetween(project.createdAt, finishedAt)} days`,
  ];
  if (totalMinutes > 0) parts.push(formatDuration(totalMinutes));
  parts.push(`${tasksDone} ${tasksDone === 1 ? "task" : "tasks"}`);
  return parts.join(" · ");
}

/**
 * The Project Tracker on one screen, styled as a manila folder: a folder
 * tab per project in progress (plus "+" and a "Finished" shelf), and the
 * open project as the page. Where a quick list is a scratchpad, a project is
 * a journey toward a finish line, so the page leads with the end goal, then
 * how far along it is (tasks done, time put in from its calendar sessions,
 * the due-date countdown) and the next task to do. Everything is edited in
 * place.
 */
export async function ProjectsView({
  activeId,
  show = "project",
}: {
  activeId?: string;
  /** A project (the picked or first one), a blank new one, or the Finished shelf. */
  show?: "project" | "new" | "finished";
}) {
  const userId = await getCurrentUserId();
  const wantsProject = show === "project";
  // With a project picked in the URL, load it alongside the rest. Otherwise
  // the first one in progress is shown, which needs the list first.
  const [projects, intentions, sessions, timeZone, pickedProject] = await Promise.all([
    storedProjects(userId),
    storedIntentions(userId),
    storedProjectSessions(userId),
    storedTimezone(userId),
    wantsProject && activeId ? storedProjectDetail(userId, activeId) : null,
  ]);
  const activeProjects = projects.filter((saved) => saved.status !== "COMPLETED");
  const finishedProjects = projects.filter((saved) => saved.status === "COMPLETED");
  const firstId = activeProjects[0]?.id;
  const project = !wantsProject
    ? null
    : activeId
      ? pickedProject
      : firstId
        ? await storedProjectDetail(userId, firstId)
        : null;
  if (wantsProject && activeId && !project) notFound();

  // Event times are wall-clock, so "now" is too (see AGENTS.md).
  const now = toWallClockDate(new Date(), timeZone);
  const { start: weekStart, end: weekEnd } = getWeekRange(now);
  const clock = { now, weekStart, weekEnd };

  const open: FolderTabsOpen =
    show === "new"
      ? { kind: "new" }
      : show === "finished" || project?.status === "COMPLETED"
        ? { kind: "finished" }
        : project
          ? { kind: "project", id: project.id }
          : null;

  const intentionChoices: IntentionChoice[] = intentions.map((intention) => ({
    id: intention.id,
    name: intention.name,
    colorHex: findIntentionColor(intention.color)?.hex ?? null,
  }));

  return (
    <div className="flex flex-col gap-5">
      <ProjectFolderTabs
        activeProjects={activeProjects}
        finishedCount={finishedProjects.length}
        open={open}
      />

      {show === "new" && <NewProjectForm intentions={intentionChoices} createAction={createProjectAction} />}

      {show === "finished" && (
        <FinishedShelf
          // Newest finish first.
          projects={finishedProjects
            .toSorted((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
            .map((finished) => ({
            id: finished.id,
            title: finished.title,
            endGoal: finished.endGoal,
            summary: finishedSummary(
              finished,
              timeFor(finished.id, sessions, clock).totalMinutes,
              finished.tasksDone,
              timeZone,
            ),
          }))}
        />
      )}

      {wantsProject && !project && (
        <PopupEmptyState
          message={
            finishedProjects.length > 0
              ? "Nothing in progress. Ready for the next finish line?"
              : "No projects yet. Pick something with a real finish line, like running your first 5k."
          }
          action={{ href: dashboardRoutes.newProject(), label: "Start a project" }}
        />
      )}

      {project && (
        // A fresh set of boxes for each project, so switching tabs drops
        // anything half-typed.
        <ProjectPage
          key={project.id}
          project={project}
          intentionChoices={intentionChoices}
          time={timeFor(project.id, sessions, clock)}
          lastWorked={describeLastWorked(
            sessions.filter((session) => session.projectId === project.id),
            // Ticks are real moments; make them wall-clock like the sessions.
            project.tasks.flatMap((task) => (task.completedAt ? [toWallClockDate(task.completedAt, timeZone)] : [])),
            clock,
          )}
          today={now.toISOString().slice(0, 10)}
          timeZone={timeZone}
        />
      )}
    </div>
  );
}

type ProjectDetail = NonNullable<Awaited<ReturnType<typeof storedProjectDetail>>>;

function ProjectPage({
  project,
  intentionChoices,
  time,
  lastWorked,
  today,
  timeZone,
}: {
  project: ProjectDetail;
  intentionChoices: IntentionChoice[];
  time: { weekMinutes: number; totalMinutes: number };
  /** "Last worked on 5 days ago", or null when there's been work this week. */
  lastWorked: string | null;
  /** The user's today, e.g. "2026-11-26", for the due-date countdown. */
  today: string;
  timeZone: string;
}) {
  const finished = project.status === "COMPLETED";
  const tasksDone = project.tasks.filter((task) => task.done).length;
  const nextTask = project.tasks.find((task) => !task.done);

  return (
    <div className="flex flex-col gap-4">
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

      {/* The end goal leads the page: it's what makes this a project. */}
      <div className="flex items-start gap-2.5">
        <Flag className="mt-1 size-5 shrink-0 text-amber-600" aria-label="End goal" />
        <EditableName
          id={project.id}
          name={project.endGoal}
          label="End goal"
          fieldName="endGoal"
          as="p"
          renameAction={updateProjectEndGoalAction}
          className="text-lg font-medium leading-snug wrap-anywhere"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {!finished && (
          <ProjectDueDate
            dueDate={project.dueDate ? dueDateInputValue(project.dueDate) : ""}
            today={today}
            saveAction={setProjectDueDateAction.bind(null, project.id)}
          />
        )}
        <ProjectIntentionChips
          intentions={intentionChoices}
          selectedIds={project.intentions.map((link) => link.intentionId)}
          saveAction={setProjectIntentionsAction.bind(null, project.id)}
        />
      </div>

      {finished ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-amber-700/30 bg-[#fdf3dc] px-3 py-2 text-sm text-amber-950">
          <Trophy className="size-4 shrink-0 text-amber-600" aria-hidden />
          {finishedSummary(project, time.totalMinutes, tasksDone, timeZone)}
          {project.dueDate && ` · was due ${formatDueDate(project.dueDate)}`}
        </p>
      ) : (
        <ProgressStrip tasksDone={tasksDone} taskCount={project.tasks.length} time={time} lastWorked={lastWorked} />
      )}

      {!finished && nextTask && (
        <div className="flex items-center gap-3 rounded-lg bg-[#fdf3dc] px-3 py-1.5">
          <span className="shrink-0 text-xs font-semibold tracking-wide text-amber-800 uppercase">Next up</span>
          <span className="min-w-0 flex-1 truncate text-[15px]" title={nextTask.text}>
            {nextTask.text}
          </span>
          <div className="flex shrink-0 items-center">
            <ScheduleIconLink
              href={dashboardRoutes.newEvent({ title: nextTask.text, projectId: project.id })}
            />
            <StartNowButton itemId={nextTask.id} startNowAction={scheduleProjectTaskNowAction} />
          </div>
        </div>
      )}

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
  );
}

/**
 * "▓▓▓▓░░ 6 of 10 tasks · 4h this week · 23h total", one quiet line. A
 * project gone quiet says when it was last worked on instead of "0m this
 * week".
 */
function ProgressStrip({
  tasksDone,
  taskCount,
  time,
  lastWorked,
}: {
  tasksDone: number;
  taskCount: number;
  time: { weekMinutes: number; totalMinutes: number };
  lastWorked: string | null;
}) {
  const parts = [];
  if (taskCount > 0) parts.push(`${tasksDone} of ${taskCount} tasks`);
  if (time.weekMinutes > 0 || (time.totalMinutes > 0 && !lastWorked)) {
    parts.push(`${formatDuration(time.weekMinutes)} this week`);
  }
  if (time.totalMinutes > 0) parts.push(`${formatDuration(time.totalMinutes)} total`);
  if (lastWorked) parts.push(lastWorked);
  if (parts.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {taskCount > 0 && (
        <div
          role="progressbar"
          aria-label="Tasks done"
          aria-valuemin={0}
          aria-valuemax={taskCount}
          aria-valuenow={tasksDone}
          className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-amber-900/10"
        >
          <div
            className="h-full rounded-full bg-amber-500 transition-[width]"
            style={{ width: `${(tasksDone / taskCount) * 100}%` }}
          />
        </div>
      )}
      <span>{parts.join(" · ")}</span>
    </div>
  );
}

/** The finished projects, each a card to open it again. */
function FinishedShelf({
  projects,
}: {
  projects: { id: string; title: string; endGoal: string; summary: string }[];
}) {
  if (projects.length === 0) {
    return <PopupEmptyState message="Finished projects land here, with what it took to get there." />;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {projects.map((project) => (
        <li key={project.id}>
          <Link href={dashboardRoutes.projects(project.id)} prefetch className={`${softCardLinkClassName} px-4 py-3`}>
            <p className="font-heading text-xl tracking-wide uppercase">{project.title}</p>
            <p className="flex items-start gap-1.5 text-sm">
              <Flag className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
              {project.endGoal}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="size-3 shrink-0 text-amber-600" aria-hidden />
              {project.summary}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
