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
    redirect("/login");
  }

  return user.id;
});
