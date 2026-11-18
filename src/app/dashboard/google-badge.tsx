/** The small "G" that marks an event as coming from Google Calendar. */
export function GoogleBadge() {
  return (
    <span
      aria-label="Google Calendar event"
      className="shrink-0 rounded-sm bg-primary/15 px-0.5 text-[9px] leading-[1.4] font-semibold text-primary"
    >
      G
    </span>
  );
}
