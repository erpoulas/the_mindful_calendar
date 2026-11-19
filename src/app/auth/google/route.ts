import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { buildGoogleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { GOOGLE_STATE_COOKIE, GOOGLE_STATE_COOKIE_OPTIONS } from "./oauth-state";

// Step one of connecting Google Calendar: the "Connect" button in Account
// settings links here, and this sends the browser on to Google's consent page.
export async function GET(request: NextRequest) {
  await getCurrentUserId(); // sends logged-out visitors to /login

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(new URL(dashboardRoutes.account({ google: "error" }), request.url));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set(GOOGLE_STATE_COOKIE, state, GOOGLE_STATE_COOKIE_OPTIONS);
  return response;
}
