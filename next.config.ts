import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep pages you've just seen (a week, a popup) in the browser for 5
    // minutes, so going back to one, like closing a popup onto the calendar,
    // shows it at once instead of rendering it on the server again. Your own
    // edits still show straight away: every server action's revalidatePath,
    // and the Google sync's router.refresh(), clear this cache.
    staleTimes: {
      dynamic: 300,
    },
  },
};

export default nextConfig;
