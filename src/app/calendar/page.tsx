import { redirect } from "next/navigation";

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const { start } = await searchParams;
  redirect(typeof start === "string" ? `/dashboard?start=${start}` : "/dashboard");
}
