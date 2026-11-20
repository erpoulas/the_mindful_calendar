/**
 * Asks the server to sync this range with Google (src/app/api/google-sync).
 * Resolves to true when the sync changed what the calendar shows.
 */
export async function requestGoogleSync(range: { start: string; end: string }): Promise<boolean> {
  const response = await fetch("/api/google-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(range),
  });
  if (!response.ok) throw new Error(`Google sync failed with status ${response.status}`);
  const { changed } = (await response.json()) as { changed?: boolean };
  return changed === true;
}
