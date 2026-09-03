import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Signed in as user {userId}</p>
      <Link href="/intentions" className="underline">
        Intentions
      </Link>
      <form action={logout}>
        <Button type="submit">Log out</Button>
      </form>
    </div>
  );
}
