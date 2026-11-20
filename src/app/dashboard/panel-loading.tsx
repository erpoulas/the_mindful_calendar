/**
 * Shown inside a popup's frame while its content loads (each popup route's
 * loading.tsx), so a click opens the popup at once instead of waiting for
 * the server to finish its queries.
 */
export function PanelLoading() {
  return (
    <p role="status" className="animate-pulse text-sm text-muted-foreground">
      Loading…
    </p>
  );
}
