import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";

// Central place every Server Component/Action asks "who's logged in?" —
// redirects to /login if nobody is. cache() avoids re-checking the session
// multiple times within the same render pass.
export const getCurrentUserId = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Demo mode: start the dev server with SKIP_LOGIN=true to browse the UI
    // without an account. Everything is saved under one shared demo user.
    if (process.env.SKIP_LOGIN === "true") {
      return "demo-user";
    }
    redirect("/login");
  }

  return user.id;
});
