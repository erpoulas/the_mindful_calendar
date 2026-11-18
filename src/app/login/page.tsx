"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={action} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Log in</h1>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
          {state?.errors?.email && (
            <p className="text-sm text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required />
          {state?.errors?.password && (
            <p className="text-sm text-red-600">{state.errors.password[0]}</p>
          )}
          <Link href="/forgot-password" className="self-end text-xs underline text-zinc-600">
            Forgot password?
          </Link>
        </div>

        {state?.message && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Logging in..." : "Log in"}
        </Button>

        <p className="text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
