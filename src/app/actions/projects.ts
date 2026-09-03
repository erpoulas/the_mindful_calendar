"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateProjectSchema } from "@/lib/project-schemas";
import {
  addProjectTask,
  completeProject,
  createProject,
  pauseProject,
  resumeProject,
  toggleProjectTask,
} from "@/lib/projects";
import { getCurrentUserId } from "@/lib/auth";
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

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const rawDueDate = formData.get("dueDate");

  const validated = CreateProjectSchema.safeParse({
    title: formData.get("title"),
    endGoal: formData.get("endGoal"),
    intentionIds: formData.getAll("intentionIds"),
    dueDate: rawDueDate && String(rawDueDate).trim() !== "" ? rawDueDate : undefined,
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await createProject(db, {
    userId,
    title: validated.data.title,
    endGoal: validated.data.endGoal,
    intentionIds: validated.data.intentionIds,
    dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : undefined,
  });

  revalidatePath("/projects");
}

export async function addProjectTaskAction(projectId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const userId = await getCurrentUserId();
  await addProjectTask(db, { userId, projectId, text });
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleProjectTaskAction(taskId: string, projectId: string) {
  const userId = await getCurrentUserId();
  await toggleProjectTask(db, { userId, taskId });
  revalidatePath(`/projects/${projectId}`);
}

export async function pauseProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await pauseProject(db, { userId, projectId });
  revalidatePath(`/projects/${projectId}`);
}

export async function resumeProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await resumeProject(db, { userId, projectId });
  revalidatePath(`/projects/${projectId}`);
}

export async function completeProjectAction(projectId: string) {
  const userId = await getCurrentUserId();
  await completeProject(db, { userId, projectId });
  revalidatePath(`/projects/${projectId}`);
}
