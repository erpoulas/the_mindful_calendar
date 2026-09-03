import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Signed in as user {userId}</p>
      <div className="flex gap-4">
        <Link href="/intentions" className="underline">
          Intentions
        </Link>
        <Link href="/projects" className="underline">
          Projects
        </Link>
        <Link href="/calendar" className="underline">
          Calendar
        </Link>
        <Link href="/quicklists" className="underline">
          Quick Lists
        </Link>
        <Link href="/seasons" className="underline">
          Seasons
        </Link>
        <Link href="/dopamine-menu" className="underline">
          Dopamine Menu
        </Link>
        <Link href="/affirmations" className="underline">
          Affirmations
        </Link>
      </div>
      <form action={logout}>
        <Button type="submit">Log out</Button>
      </form>
    </div>
  );
}
