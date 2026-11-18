import { z } from "zod";

/**
 * The password rules, in one place: the server checks them through
 * passwordSchema, and the sign-up page shows them as a live checklist.
 */
export const passwordRequirements = [
  { label: "At least 8 characters", isMet: (password: string) => password.length >= 8 },
  { label: "A letter", isMet: (password: string) => /[a-zA-Z]/.test(password) },
  { label: "A number", isMet: (password: string) => /[0-9]/.test(password) },
];

const passwordSchema = passwordRequirements.reduce(
  (schema, requirement) =>
    schema.refine(requirement.isMet, `Password needs ${requirement.label.toLowerCase()}`),
  z.string(),
);

export const SignupSchema = z
  .object({
    email: z.email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export const UpdatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const UpdateEmailSchema = z.object({
  email: z.email(),
});

export const RequestPasswordResetSchema = z.object({
  email: z.email(),
});
