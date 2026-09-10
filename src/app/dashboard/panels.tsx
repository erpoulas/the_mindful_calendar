import Link from "next/link";
import type { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "@/lib/dashboard";
import type { listSeasons } from "@/lib/seasons";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";

type Season = Awaited<ReturnType<typeof listSeasons>>[number];
type IntentionBreakdown = Awaited<ReturnType<typeof getWeeklyIntentionBreakdown>>;
type WeeklyReviewStats = Awaited<ReturnType<typeof getWeeklyReviewStats>>;

const UNTAGGED_COLOR = "#999999";
const DEFAULT_INTENTION_COLOR = "#4a6a99";

function PanelShell({
  panelKey,
  children,
}: {
  panelKey: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded border p-3">
      <form
        action={togglePanelVisibilityAction.bind(null, panelKey)}
        className="absolute top-1 right-1 hidden group-data-[customizing=true]:block"
      >
        <button
          type="submit"
          aria-label="Hide this panel"
          className="text-xs text-zinc-400 hover:text-zinc-700"
        >
          ✕
        </button>
      </form>
      {children}
    </div>
  );
}

export function AffirmationPanel({
  affirmation,
}: {
  affirmation: { text: string; isOverride: boolean } | null;
}) {
  return (
    <PanelShell panelKey="affirmation">
      <div className="text-xs font-medium text-zinc-500">✨ TODAY</div>
      <p className="mt-1 text-sm italic">
        {affirmation ? `"${affirmation.text}"` : "Add an affirmation to see one here."}
      </p>
    </PanelShell>
  );
}

export function SeasonPanel({ season }: { season: Season | null }) {
  return (
    <PanelShell panelKey="season">
      <Link href={season ? `/seasons/${season.id}` : "/seasons"} className="block">
        <div className="text-xs font-medium text-zinc-500">🍂 CURRENT SEASON</div>
        <div className="mt-1 text-sm font-medium">{season ? season.name : "No seasons yet"}</div>
        {season?.endDate && (
          <div className="mt-0.5 text-xs text-zinc-500">
            {Math.max(
              0,
              Math.ceil((season.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            )}{" "}
            days left
          </div>
        )}
      </Link>
    </PanelShell>
  );
}

export function IntentionBreakdownPanel({ breakdown }: { breakdown: IntentionBreakdown }) {
  const segments = [
    ...breakdown.breakdown
      .filter((b) => b.count > 0)
      .map((b) => ({ label: b.name, percent: b.percent, color: DEFAULT_INTENTION_COLOR })),
    ...(breakdown.untagged.count > 0
      ? [{ label: "Untagged", percent: breakdown.untagged.percent, color: UNTAGGED_COLOR }]
      : []),
  ];

  return (
    <PanelShell panelKey="breakdown">
      <Link href="/intentions" className="block">
        <div className="mb-1 text-xs font-medium text-zinc-500">TIME THIS WEEK, BY INTENTION</div>
        {segments.length === 0 ? (
          <p className="text-sm text-zinc-600">No events logged yet this week.</p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded bg-zinc-100">
              {segments.map((segment) => (
                <div
                  key={segment.label}
                  style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
                  title={segment.label}
                />
              ))}
            </div>
            <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-zinc-600">
              {segments.map((segment) => (
                <li key={segment.label}>
                  {segment.label} {segment.percent}%
                </li>
              ))}
            </ul>
          </>
        )}
      </Link>
    </PanelShell>
  );
}

export function ProjectsPanel({ activeCount }: { activeCount: number }) {
  return (
    <PanelShell panelKey="projects">
      <Link href="/projects" className="block">
        <div className="text-sm font-medium">📁 All projects</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {activeCount} active · click to view any one
        </div>
      </Link>
    </PanelShell>
  );
}

export function QuickListPanel({ openCount }: { openCount: number }) {
  return (
    <PanelShell panelKey="quicklist">
      <Link href="/quicklists" className="block">
        <div className="text-sm font-medium">📝 Quick list</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {openCount} open {openCount === 1 ? "item" : "items"} · no intention needed
        </div>
      </Link>
    </PanelShell>
  );
}

export function JournalPanel() {
  return (
    <PanelShell panelKey="journal">
      <Link href="/journals" className="block">
        <div className="text-sm font-medium">📓 Journal</div>
        <div className="mt-0.5 text-xs text-zinc-500">Write now, no scheduling needed</div>
      </Link>
    </PanelShell>
  );
}

export function DopaminePanel() {
  return (
    <PanelShell panelKey="dopamine">
      <Link href="/dopamine-menu" className="block">
        <div className="text-sm font-medium">🎲 Dopamine menu</div>
        <div className="mt-0.5 text-xs text-zinc-500">Feeling stuck? Get an idea</div>
      </Link>
    </PanelShell>
  );
}

export function WeeklyReviewPanel({ stats }: { stats: WeeklyReviewStats }) {
  return (
    <PanelShell panelKey="review">
      <div className="text-sm font-medium">📊 Weekly review</div>
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-600">
        <li>{stats.intentionBreakdown.totalCount} events logged this week</li>
        <li>{stats.tasksCompleted} project tasks completed</li>
        <li>{stats.quickListItemsCompleted} quick list items checked off</li>
        <li>{stats.projectsCompleted} projects completed</li>
      </ul>
    </PanelShell>
  );
}
