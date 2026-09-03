"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateSeasonSchema, ReflectOnSeasonSchema } from "@/lib/season-schemas";
import { createSeason, deleteSeason, reflectOnSeason, updateSeason } from "@/lib/seasons";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export type SeasonFormState =
  | { errors?: { name?: string[]; startDate?: string[]; endDate?: string[] } }
  | undefined;

export type ReflectionFormState =
  | { errors?: { reflectionText?: string[] } }
  | undefined;

function parseSeasonFormData(formData: FormData) {
  const rawStartDate = formData.get("startDate");
  const rawEndDate = formData.get("endDate");

  return CreateSeasonSchema.safeParse({
    name: formData.get("name"),
    startDate: rawStartDate && String(rawStartDate).trim() !== "" ? rawStartDate : undefined,
    endDate: rawEndDate && String(rawEndDate).trim() !== "" ? rawEndDate : undefined,
    note: formData.get("note") || undefined,
  });
}

export async function createSeasonAction(
  _state: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const validated = parseSeasonFormData(formData);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  const season = await createSeason(db, {
    userId,
    name: validated.data.name,
    startDate: validated.data.startDate ? new Date(validated.data.startDate) : undefined,
    endDate: validated.data.endDate ? new Date(validated.data.endDate) : undefined,
    note: validated.data.note,
  });

  revalidatePath("/seasons");
  redirect(`/seasons/${season.id}`);
}

export async function updateSeasonAction(
  seasonId: string,
  _state: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const validated = parseSeasonFormData(formData);
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await updateSeason(db, {
    userId,
    seasonId,
    name: validated.data.name,
    startDate: validated.data.startDate ? new Date(validated.data.startDate) : undefined,
    endDate: validated.data.endDate ? new Date(validated.data.endDate) : undefined,
    note: validated.data.note,
  });

  revalidatePath("/seasons");
  redirect(`/seasons/${seasonId}`);
}

export async function deleteSeasonAction(seasonId: string) {
  const userId = await getCurrentUserId();
  await deleteSeason(db, { userId, seasonId });

  revalidatePath("/seasons");
  redirect("/seasons");
}

export async function reflectOnSeasonAction(
  seasonId: string,
  _state: ReflectionFormState,
  formData: FormData,
): Promise<ReflectionFormState> {
  const validated = ReflectOnSeasonSchema.safeParse({
    reflectionText: formData.get("reflectionText"),
  });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const userId = await getCurrentUserId();
  await reflectOnSeason(db, {
    userId,
    seasonId,
    reflectionText: validated.data.reflectionText,
  });

  revalidatePath(`/seasons/${seasonId}`);
}
