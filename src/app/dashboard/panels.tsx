import Link from "next/link";
import Image from "next/image";
import type { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "@/lib/dashboard";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";

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
          className="text-xs text-muted-foreground hover:text-foreground"
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
      <Link href="/dashboard?panel=affirmations" className="block">
        <div className="text-xs font-medium text-muted-foreground">✨ TODAY</div>
        <p className="mt-1 text-sm italic">
          {affirmation ? `"${affirmation.text}"` : "Add an affirmation to see one here."}
        </p>
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
      <Link href="/dashboard?panel=intentions" className="block">
        <div className="mb-1 text-xs font-medium text-muted-foreground">TIME THIS WEEK, BY INTENTION</div>
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events logged yet this week.</p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded bg-accent">
              {segments.map((segment) => (
                <div
                  key={segment.label}
                  style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
                  title={segment.label}
                />
              ))}
            </div>
            <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
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
      <Link href="/dashboard?panel=projects" className="flex items-center gap-2">
        <Image src="/panel-art/project-tracker-button.png" alt="" width={24} height={28} />
        <div>
          <div className="text-sm font-medium">Project tracker</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {activeCount} active · click to view any one
          </div>
        </div>
      </Link>
    </PanelShell>
  );
}

export function QuickListPanel({ openCount }: { openCount: number }) {
  return (
    <PanelShell panelKey="quicklist">
      <Link href="/dashboard?panel=quicklists" className="flex items-center gap-2">
        <Image src="/panel-art/quick-notes-button.png" alt="" width={31} height={28} />
        <div>
          <div className="text-sm font-medium">Quick notes</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {openCount} open {openCount === 1 ? "item" : "items"} · no intention needed
          </div>
        </div>
      </Link>
    </PanelShell>
  );
}

export function JournalPanel() {
  return (
    <PanelShell panelKey="journal">
      <Link href="/dashboard?panel=journals" className="flex items-center gap-2">
        <Image src="/panel-art/journal-button.png" alt="" width={34} height={28} />
        <div>
          <div className="text-sm font-medium">Journal</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Write now, no scheduling needed</div>
        </div>
      </Link>
    </PanelShell>
  );
}

export function DopaminePanel() {
  return (
    <PanelShell panelKey="dopamine">
      <Link href="/dashboard?panel=dopamine-menu" className="flex items-center gap-2">
        <Image src="/panel-art/dopamine-tracker.png" alt="" width={40} height={28} />
        <div>
          <div className="text-sm font-medium">Dopamine menu</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Feeling stuck? Get an idea</div>
        </div>
      </Link>
    </PanelShell>
  );
}

export function WeeklyReviewPanel({ stats }: { stats: WeeklyReviewStats }) {
  return (
    <PanelShell panelKey="review">
      <div className="text-sm font-medium">📊 Weekly review</div>
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
        <li>{stats.intentionBreakdown.totalCount} events logged this week</li>
        <li>{stats.tasksCompleted} project tasks completed</li>
        <li>{stats.quickListItemsCompleted} quick list items checked off</li>
        <li>{stats.projectsCompleted} projects completed</li>
      </ul>
    </PanelShell>
  );
}
