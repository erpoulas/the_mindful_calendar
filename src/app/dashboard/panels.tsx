import Link from "next/link";
import Image from "next/image";
import type { getWeeklyIntentionBreakdown, getWeeklyReviewStats } from "@/lib/dashboard";
import { togglePanelVisibilityAction } from "@/app/actions/dashboard";
import { dashboardRoutes } from "@/lib/dashboard-routes";
import { findIntentionColor } from "@/lib/intention-colors";

type IntentionBreakdown = Awaited<ReturnType<typeof getWeeklyIntentionBreakdown>>;
type WeeklyReviewStats = Awaited<ReturnType<typeof getWeeklyReviewStats>>;

const UNTAGGED_COLOR = "#999999";
const DEFAULT_INTENTION_COLOR = "#4a6a99";

function PanelIcon({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
      <Image src={src} alt="" width={width} height={height} className="h-auto max-h-10 w-auto max-w-10 object-contain" />
    </div>
  );
}

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
        className="absolute top-2 right-2 hidden group-data-[customizing=true]:block"
      >
        <button
          type="submit"
          aria-label="Hide this panel"
          className="text-base text-muted-foreground hover:text-foreground"
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
      <Link href={dashboardRoutes.affirmations()} className="block">
        <div className="flex items-center gap-2">
          <PanelIcon src="/panel-art/positive-affirmations.png" width={736} height={685} />
          <div className="text-sm font-medium">Today</div>
        </div>
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
      .map((b) => ({
        label: b.name,
        percent: b.percent,
        color: findIntentionColor(b.color)?.hex ?? DEFAULT_INTENTION_COLOR,
      })),
    ...(breakdown.untagged.count > 0
      ? [{ label: "Untagged", percent: breakdown.untagged.percent, color: UNTAGGED_COLOR }]
      : []),
  ];

  return (
    <PanelShell panelKey="breakdown">
      <Link href={dashboardRoutes.intentions()} className="block">
        <div className="mb-1 flex items-center gap-2">
          <PanelIcon src="/panel-art/time-this-week.png" width={360} height={360} />
          <div className="text-sm font-medium">Time this week, by intention</div>
        </div>
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

function IconPanelLink({
  href,
  iconSrc,
  iconWidth,
  iconHeight,
  title,
}: {
  href: string;
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <PanelIcon src={iconSrc} width={iconWidth} height={iconHeight} />
      <div className="text-sm font-medium">{title}</div>
    </Link>
  );
}

export function ProjectsPanel() {
  return (
    <PanelShell panelKey="projects">
      <IconPanelLink
        href={dashboardRoutes.projects()}
        iconSrc="/panel-art/project-tracker-button.png"
        iconWidth={197}
        iconHeight={233}
        title="Project tracker"
      />
    </PanelShell>
  );
}

export function QuickListPanel() {
  return (
    <PanelShell panelKey="quicklist">
      <IconPanelLink
        href={dashboardRoutes.quickLists()}
        iconSrc="/panel-art/quick-notes-button.png"
        iconWidth={253}
        iconHeight={228}
        title="Quick notes"
      />
    </PanelShell>
  );
}

export function JournalPanel() {
  return (
    <PanelShell panelKey="journal">
      <IconPanelLink
        href={dashboardRoutes.journals()}
        iconSrc="/panel-art/journal-button.png"
        iconWidth={201}
        iconHeight={164}
        title="Journal"
      />
    </PanelShell>
  );
}

export function DopaminePanel() {
  return (
    <PanelShell panelKey="dopamine">
      <IconPanelLink
        href={dashboardRoutes.dopamineMenu()}
        iconSrc="/panel-art/dopamine-tracker.png"
        iconWidth={144}
        iconHeight={100}
        title="Dopamine menu"
      />
    </PanelShell>
  );
}

export function WeeklyReviewPanel({ stats }: { stats: WeeklyReviewStats }) {
  return (
    <PanelShell panelKey="review">
      <div className="flex items-center gap-2">
        <PanelIcon src="/panel-art/weekly-review.png" width={697} height={664} />
        <div className="text-sm font-medium">Weekly review</div>
      </div>
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
        <li>{stats.intentionBreakdown.totalCount} events logged this week</li>
        <li>{stats.tasksCompleted} project tasks completed</li>
        <li>{stats.quickListItemsCompleted} quick list items checked off</li>
        <li>{stats.projectsCompleted} projects completed</li>
      </ul>
    </PanelShell>
  );
}
