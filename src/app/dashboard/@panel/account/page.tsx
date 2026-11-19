import { stringParam } from "@/lib/dashboard-routes";
import { AccountSettingsView } from "../../overlays/account-settings";
import { PanelSheet } from "../../panel-sheet";

export default async function AccountPanel({ searchParams }: PageProps<"/dashboard/account">) {
  const query = await searchParams;

  return (
    <PanelSheet open title="Account settings">
      <AccountSettingsView googleOutcome={stringParam(query.google)} />
    </PanelSheet>
  );
}
