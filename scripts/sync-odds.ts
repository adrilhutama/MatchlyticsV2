/**
 * sync-odds.ts — Pull bookmaker odds from The Odds API and store them.
 *
 * Uses the smart gatekeeper to skip leagues with no upcoming fixtures
 * within 36 hours, preserving quota.
 *
 * Usage:
 *   npx tsx scripts/sync-odds.ts [--partition=1]
 */

import { createClient } from '@supabase/supabase-js';
import { PARTITIONS, getPartition } from './config/partitions.js';
import { hasUpcomingMatches } from './utils/gatekeeper.js';
import { isTeamMatch } from './utils/team-mapper.js';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface OddsEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sports_book: string;
  h2h?: { home: number; draw: number; away: number };
  spreads?: { point_spread: number; home_odds: number; away_odds: number }[];
  totals?: { total: number; over_odds: number; under_odds: number }[];
}

interface OddsResponse {
  data: OddsEvent[];
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key, { auth: { persistSession: false } });
}

function buildOddsPayload(events: OddsEvent[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const ev of events) {
    const bookie = ev.sports_book ?? 'unknown';
    if (!payload[bookie]) {
      payload[bookie] = { name: bookie, h2h: null, spreads: [], totals: [] };
    }
    const entry = payload[bookie] as Record<string, unknown>;
    if (ev.h2h) {
      entry.h2h = { home: ev.h2h.home ?? null, draw: ev.h2h.draw ?? null, away: ev.h2h.away ?? null };
    }
    if (ev.spreads?.length) {
      entry.spreads = ev.spreads.map((s) => ({ line: s.point_spread, home: s.home_odds, away: s.away_odds }));
    }
    if (ev.totals?.length) {
      entry.totals = ev.totals.map((t) => ({ line: t.total, over: t.over_odds, under: t.under_odds }));
    }
  }
  return payload;
}

async function fetchOdds(sportKey: string, regions: string, markets: string, apiKey: string): Promise<OddsEvent[]> {
  const params = new URLSearchParams({ apiKey, sport: sportKey, regions, markets, eventOptions: 'commenceTime' });
  const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/odds/?${params}`);
  if (!res.ok) throw new Error(`Odds API HTTP ${res.status}`);
  const json = (await res.json()) as OddsResponse;
  return json.data ?? [];
}

async function matchFixtureToSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  event: OddsEvent,
  leagueId: string,
): Promise<string | null> {
  const windowMs = 24 * 3600000;
  const targetTime = new Date(event.commence_time).getTime();

  const { data: candidates } = await client
    .from('matches')
    .select('id, home_team, away_team')
    .eq('league_id', leagueId)
    .eq('status', 'scheduled')
    .gte('kickoff', new Date(targetTime - windowMs).toISOString())
    .lte('kickoff', new Date(targetTime + windowMs).toISOString());

  if (!candidates) return null;

  for (const match of candidates as { id: string; home_team: string; away_team: string }[]) {
    if (
      (isTeamMatch(match.home_team, event.home_team) && isTeamMatch(match.away_team, event.away_team)) ||
      (isTeamMatch(match.away_team, event.home_team) && isTeamMatch(match.home_team, event.away_team))
    ) {
      return match.id;
    }
  }
  return null;
}

async function main(partitionNum?: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getServiceClient();
  const partitions = partitionNum != null ? [getPartition(partitionNum)] : PARTITIONS;
  const toRun = partitions.filter((p): p is NonNullable<typeof p> => p !== undefined);

  const oddsKeys = Array.from({ length: 6 }, (_, i) => process.env[`THE_ODDS_KEY_${i + 1}`]).filter(Boolean) as string[];
  if (oddsKeys.length === 0) throw new Error('No THE_ODDS_KEY_* variables set');

  for (let pi = 0; pi < toRun.length; pi++) {
    const part = toRun[pi];
    const apiKey = oddsKeys[pi % oddsKeys.length];

    for (const leagueId of part.leagueIds) {
      const hasMatches = await hasUpcomingMatches(client, leagueId, 36);
      if (!hasMatches) {
        console.log(`[sync-odds] Skipping ${leagueId} — no fixtures within 36h.`);
        continue;
      }

      try {
        console.log(`[sync-odds] Fetching odds for ${leagueId} …`);
        const events = await fetchOdds(part.oddsSportKey, 'eu', 'h2h,spreads,totals', apiKey);
        console.log(`[sync-odds]  → ${events.length} bookmaker entries`);

        for (const event of events) {
          const matchId = await matchFixtureToSupabase(client, event, leagueId);
          if (!matchId) continue;

          const payload = buildOddsPayload([event]);
          await client.from('matches').update({ odds_data: payload, updated_at: new Date().toISOString() }).eq('id', matchId);
        }
      } catch (err) {
        console.error(`[sync-odds] Error for ${leagueId}:`, err);
      }
      await sleep(1000);
    }
  }

  console.log('[sync-odds] Done.');
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const rawPart = process.argv.find((a) => a.startsWith('--partition='));
const partition = rawPart ? parseInt(rawPart.split('=')[1], 10) : undefined;
main(partition).catch((e) => {
  console.error(e);
  process.exit(1);
});
