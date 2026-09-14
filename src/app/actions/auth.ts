"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  LoginSchema,
  RequestPasswordResetSchema,
  SignupSchema,
  UpdateEmailSchema,
  UpdatePasswordSchema,
} from "@/lib/auth-schemas";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  redirect("/dashboard");
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { message: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type UpdatePasswordFormState =
  | {
      errors?: { password?: string[]; confirmPassword?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

// Used both for a logged-in "change my password" form and for the
// forgot-password recovery page — Supabase treats the session created by
// clicking a recovery link the same as a normal session, so this same
// action works for both.
export async function updatePasswordAction(
  _state: UpdatePasswordFormState,
  formData: FormData,
): Promise<UpdatePasswordFormState> {
  const validated = UpdatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: validated.data.password });
  if (error) {
    return { message: error.message };
  }

  return { success: true, message: "Password updated." };
}

export type UpdateEmailFormState =
  | { errors?: { email?: string[] }; message?: string; success?: boolean }
  | undefined;

export async function updateEmailAction(
  _state: UpdateEmailFormState,
  formData: FormData,
): Promise<UpdateEmailFormState> {
  const validated = UpdateEmailSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: validated.data.email });
  if (error) {
    return { message: error.message };
  }

  return { success: true, message: "Check your new email to confirm the change." };
}

export type RequestPasswordResetFormState =
  | { errors?: { email?: string[] }; message?: string; success?: boolean }
  | undefined;

export async function requestPasswordResetAction(
  _state: RequestPasswordResetFormState,
  formData: FormData,
): Promise<RequestPasswordResetFormState> {
  const validated = RequestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
  });

  // Always report success, whether or not that email has an account —
  // otherwise this form becomes a way to check who has an account here.
  return {
    success: true,
    message: "If that email has an account, a reset link is on its way.",
  };
}
