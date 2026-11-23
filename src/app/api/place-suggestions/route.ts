import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { isPlaceSearchConfigured, searchPlaces } from "@/lib/place-search";

/**
 * Place suggestions for the event form's Location field (LocationSearch).
 *
 * A Route Handler rather than a server action, like /api/google-sync: Next
 * runs a tab's server actions one at a time, so a search per keystroke would
 * queue up behind (and hold up) saves. It also keeps the Places key on the
 * server, and only answers signed-in users so nobody else can spend it.
 *
 * Query: ?q=<what the user typed>. Answers { suggestions }.
 */
export async function GET(request: NextRequest) {
  if (!isPlaceSearchConfigured()) {
    return NextResponse.json({ error: "place search isn't set up" }, { status: 404 });
  }
  await getCurrentUserId();

  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ suggestions: await searchPlaces(query) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "place search failed" }, { status: 502 });
  }
}
