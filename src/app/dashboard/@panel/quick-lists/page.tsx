import { stringParam } from "@/lib/dashboard-routes";
import { QuickListCreateView, QuickListEditView, QuickListsView } from "../../overlays/quick-lists";
import { PanelSheet } from "../../panel-sheet";

const QUICK_NOTES_ART = {
  src: "/panel-art/quick-notes-pop-up.png",
  width: 614,
  height: 996,
  // This photo has a clip along the top edge and punch holes down the
  // left, instead of a plain left-edge binding like the journal/project
  // photos, so it needs clearance on both sides.
  contentInsetClassName: "pt-[20%] pl-[16%]",
};

export default async function QuickListsPanel({ searchParams }: PageProps<"/dashboard/quick-lists">) {
  const query = await searchParams;
  const view = stringParam(query.view);
  const id = stringParam(query.id);

  let title = "Quick Lists";
  let content = <QuickListsView activeId={id} />;
  if (view === "edit" && id) {
    title = "Edit list";
    content = <QuickListEditView id={id} />;
  } else if (view === "create") {
    title = "New list";
    content = <QuickListCreateView />;
  }

  return (
    <PanelSheet open size="center" title={title} backgroundImage={QUICK_NOTES_ART}>
      {content}
    </PanelSheet>
  );
}
