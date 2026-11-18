import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { saveGoogleConnection } from "@/lib/google-connections";
import { GOOGLE_STATE_COOKIE, GOOGLE_STATE_COOKIE_OPTIONS } from "../oauth-state";

type ConnectOutcome = "connected" | "cancelled" | "error";

// Step two of connecting Google Calendar: Google sends the browser back here
// (this is GOOGLE_REDIRECT_URI) with a one-time code, which is traded for
// tokens and saved. Then it's back to Account settings with the outcome.
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId(); // outside the try: it may redirect to /login

  const { searchParams } = request.nextUrl;
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const code = searchParams.get("code");

  let outcome: ConnectOutcome = "error";
  if (searchParams.get("error") === "access_denied") {
    outcome = "cancelled"; // the user pressed Cancel on Google's page
  } else if (code && expectedState && searchParams.get("state") === expectedState) {
    try {
      const tokens = await exchangeCodeForTokens(code);
      await saveGoogleConnection(db, { userId, ...tokens });
      outcome = "connected";
    } catch (error) {
      console.error("Could not connect Google Calendar", error);
    }
  }

  const response = NextResponse.redirect(
    new URL(`/dashboard?panel=account&google=${outcome}`, request.url),
  );
  response.cookies.set(GOOGLE_STATE_COOKIE, "", { ...GOOGLE_STATE_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
