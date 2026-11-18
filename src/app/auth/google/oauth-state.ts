// The random "state" value sent to Google when connecting is also kept in
// this cookie. The callback only accepts Google's reply if the two match,
// which proves the reply belongs to a connect flow this browser started.
export const GOOGLE_STATE_COOKIE = "google_oauth_state";

export const GOOGLE_STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  // "lax" still sends the cookie when Google redirects back with a normal link.
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/auth/google",
  maxAge: 10 * 60, // seconds: plenty of time to finish Google's consent screen
} as const;
