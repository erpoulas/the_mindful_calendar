"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { CreateProjectSchema } from "@/lib/project-schemas";
import { dueDateFromInput } from "@/lib/project-due-date";
import {
  addProjectTask,
  completeProject,
  createProject,
  deleteProject,
  deleteProjectTask,
  pauseProject,
  resumeProject,
  toggleProjectTask,
  updateProject,
  updateProjectTaskText,
} from "@/lib/projects";
import { getCurrentUserId } from "@/lib/auth";
import { forgetStoredAfterSave } from "@/lib/stored-results";
import { db } from "@/lib/db";

export type ProjectFormState =
  | {
      errors?: {
        title?: string[];
        endGoal?: string[];
        intentionIds?: string[];
        dueDate?: string[];
      };
    }
  | undefined;

const { title: TitleSchema, endGoal: EndGoalSchema, intentionIds: IntentionIdsSchema } =
  CreateProjectSchema.shape;

/** Creates a project from the blank page and opens it in its own tab. */
export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const validated = CreateProjectSchema.safeParse({
    title: formData.get("title"),
    endGoal: formData.get("endGoal"),
    intentionIds: formData.getAll("intentionIds"),
    dueDate: formData.get("dueDate") ?? undefined,
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  const project = await createProject(db, {
    userId,
    title: validated.data.title,
    endGoal: validated.data.endGoal,
    intentionIds: validated.data.intentionIds,
    dueDate: dueDateFromInput(validated.data.dueDate ?? "") ?? undefined,
  });

  forgetStoredAfterSave(userId, ["projects"]);
  redirect(dashboardRoutes.projects(project.id));
}

// The rest save one field at a time, from boxes typed into right on the
// popup. Those ignore an empty value, so an invalid one is just skipped.

export async function renameProjectAction(projectId: string, formData: FormData) {
  const validated = TitleSchema.safeParse(formData.get("title"));
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateProject(db, { userId, projectId, title: validated.data });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function updateProjectEndGoalAction(projectId: string, formData: FormData) {
  const validated = EndGoalSchema.safeParse(formData.get("endGoal"));
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateProject(db, { userId, projectId, endGoal: validated.data });
  forgetStoredAfterSave(userId, ["projects"]);
}

/** Sets the due date from a date box's value ("2026-10-12"); empty clears it. */
export async function setProjectDueDateAction(projectId: string, value: string) {
  const userId = await getCurrentUserId();
  await updateProject(db, { userId, projectId, dueDate: dueDateFromInput(value) });
  forgetStoredAfterSave(userId, ["projects"]);
}

/** Replaces the project's intentions; a project always keeps at least one. */
export async function setProjectIntentionsAction(projectId: string, intentionIds: string[]) {
  const validated = IntentionIdsSchema.safeParse(intentionIds);
  if (!validated.success) return;

  const userId = await getCurrentUserId();
  await updateProject(db, { userId, projectId, intentionIds: validated.data });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function deleteProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await deleteProject(db, { userId, projectId });

  forgetStoredAfterSave(userId, ["projects", "events"]);
  redirect("/dashboard");
}

export async function addProjectTaskAction(projectId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const userId = await getCurrentUserId();
  await addProjectTask(db, { userId, projectId, text });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function toggleProjectTaskAction(taskId: string, projectId: string) {
  const userId = await getCurrentUserId();
  await toggleProjectTask(db, { userId, taskId });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function updateProjectTaskTextAction(taskId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const userId = await getCurrentUserId();
  await updateProjectTaskText(db, { userId, taskId, text });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function deleteProjectTaskAction(taskId: string) {
  const userId = await getCurrentUserId();
  await deleteProjectTask(db, { userId, taskId });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function pauseProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await pauseProject(db, { userId, projectId });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function resumeProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await resumeProject(db, { userId, projectId });
  forgetStoredAfterSave(userId, ["projects"]);
}

export async function completeProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await completeProject(db, { userId, projectId });
  forgetStoredAfterSave(userId, ["projects"]);
}
