/**
 * Smart gatekeeper — avoids wasting The Odds API quota when there are
 * no upcoming scheduled fixtures for a given league within the window.
 */

/**
 * Returns true when the supplied league has at least one scheduled match
 * whose kickoff falls within the next `hoursAhead` hours.
 * Accepts a loose client shape to avoid Supabase generic type complexity.
 */
export async function hasUpcomingMatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  leagueId: string,
  hoursAhead = 36,
): Promise<boolean> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .eq('status', 'scheduled')
    .gte('kickoff', now.toISOString())
    .lte('kickoff', windowEnd.toISOString());

  if (error) {
    console.warn(`[Gatekeeper] Query error for league ${leagueId}: ${String(error)}`);
    return true; // optimistic: don't skip on errors
  }

  return ((data as unknown[])?.length ?? 0) > 0;
}
