import { stringParam } from "@/lib/dashboard-routes";
import { AccountSettingsView } from "../../overlays/account-settings";

export default async function AccountPanel({ searchParams }: PageProps<"/dashboard/account">) {
  const query = await searchParams;
  return <AccountSettingsView googleOutcome={stringParam(query.google)} />;
}
