import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";

// Central place every Server Component/Action asks "who's logged in?" —
// redirects to /login if nobody is. cache() avoids re-checking the session
// multiple times within the same render pass.
//
// getClaims() checks the login token's signature right here on the server,
// with no trip to Supabase (getUser() made one on every click). It only
// falls back to asking Supabase if the project still signs tokens with the
// old shared secret.
export const getCurrentUserId = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (!userId) {
    // Demo mode: start the dev server with SKIP_LOGIN=true to browse the UI
    // without an account. Everything is saved under one shared demo user.
    if (process.env.SKIP_LOGIN === "true") {
      return "demo-user";
    }
    redirect("/login");
  }

  return userId;
});
