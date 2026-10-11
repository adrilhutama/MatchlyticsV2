/**
 * sync-stats.ts — Settle finished matches and recompute rolling lambdas.
 *
 * Usage:
 *   npx tsx scripts/sync-stats.ts
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://api.football-data.org/v4';
const DECAY_RATE = 0.006;

interface FdMatch {
  id: number;
  competition: { identifier: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home?: number; away?: number } };
  utcDate: string;
  status: 'FINISHED';
}

interface FdResponse {
  matches: FdMatch[];
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchFinishedMatches(code: string, key: string): Promise<FdMatch[]> {
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const res = await fetch(
    `${API_BASE}/competitions/${code}/matches?status=FINISHED&dateFrom=${from}&dateTo=${to}`,
    { headers: { 'X-Auth-Token': key } },
  );
  if (!res.ok) throw new Error(`Football-Data HTTP ${res.status}`);
  const json = (await res.json()) as FdResponse;
  return json.matches ?? [];
}

/**
 * Exponential-decay weighted attack/defence strength for a team.
 * w_k = e^{-0.006 * hours_since_match_k}
 */
function computeDecayWeights(results: { goalsFor: number; goalsAgainst: number; timestamp: string }[]): { attack: number; defense: number; weight: number } {
  let weightedGF = 0, weightedGA = 0, totalW = 0;
  for (const r of results) {
    const hoursAgo = (Date.now() - new Date(r.timestamp).getTime()) / 3600000;
    const w = Math.exp(-DECAY_RATE * hoursAgo);
    weightedGF += r.goalsFor * w;
    weightedGA += r.goalsAgainst * w;
    totalW += w;
  }
  if (totalW === 0) return { attack: 1.35, defense: 1.10, weight: 0 };
  return { attack: weightedGF / totalW, defense: weightedGA / totalW, weight: totalW };
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getServiceClient();

  const allResults: Record<string, FdMatch[]> = {};
  const codes = ['PL', 'ELC', 'PD', 'SA', 'BL1', 'FL1', 'DED', 'PPL', 'BSA', 'CL', 'EC', 'WC'];
  const keys = Array.from({ length: 6 }, (_, i) => process.env[`FOOTBALL_DATA_KEY_${i + 1}`]).filter(Boolean) as string[];

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const key = keys[i % keys.length];
    try {
      const matches = await fetchFinishedMatches(code, key);
      allResults[code] = matches;
      console.log(`[sync-stats] ${code}: ${matches.length} finished matches`);
    } catch (err) {
      console.error(`[sync-stats] Error fetching ${code}:`, err);
    }
    await sleep(1000);
  }

  // Update finished matches with scores
  for (const [league, matches] of Object.entries(allResults)) {
    for (const m of matches) {
      const ft = m.score?.fullTime;
      if (ft == null) continue;
      await client
        .from('matches')
        .update({
          status: 'finished' as const,
          home_score: ft.home ?? null,
          away_score: ft.away ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('external_id', m.id);
    }
  }

  // Recompute rolling lambdas per league
  for (const [league, matches] of Object.entries(allResults)) {
    if (matches.length === 0) continue;

    const teamStats = new Map<string, { goalsFor: number; goalsAgainst: number; timestamp: string }[]>();
    for (const m of matches) {
      const ft = m.score?.fullTime;
      if (ft == null) continue;
      const home = m.homeTeam.name;
      const away = m.awayTeam.name;
      const ts = m.utcDate;

      teamStats.set(home, [...(teamStats.get(home) ?? []), { goalsFor: ft.home ?? 0, goalsAgainst: ft.away ?? 0, timestamp: ts }]);
      teamStats.set(away, [...(teamStats.get(away) ?? []), { goalsFor: ft.away ?? 0, goalsAgainst: ft.home ?? 0, timestamp: ts }]);
    }

    const teamParams = new Map<string, { lambdaHome: number; lambdaAway: number }>();
    for (const [team, results] of teamStats) {
      const { attack, defense } = computeDecayWeights(results);
      teamParams.set(team, {
        lambdaHome: Math.max(0.5, Math.min(3.5, attack)),
        lambdaAway: Math.max(0.3, Math.min(3.0, defense)),
      });
    }

    const { data: scheduled } = await client
      .from('matches')
      .select('id, home_team, away_team')
      .eq('league_id', league)
      .eq('status', 'scheduled');

    if (!scheduled) continue;

    for (const match of scheduled as { id: string; home_team: string; away_team: string }[]) {
      const home = teamParams.get(match.home_team);
      const away = teamParams.get(match.away_team);
      if (!home || !away) continue;

      await client
        .from('matches')
        .update({
          lambda_home: home.lambdaHome,
          lambda_away: away.lambdaAway,
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id);
    }
  }

  // Compress odds_data for old finished matches (>7 days)
  const { data: oldFinished } = await client
    .from('matches')
    .select('id')
    .eq('status', 'finished')
    .lt('updated_at', new Date(Date.now() - 7 * 86400000).toISOString());

  if (oldFinished) {
    await client
      .from('matches')
      .update({ odds_data: {} as unknown })
      .in('id', (oldFinished as { id: string }[]).map((m) => m.id));
    console.log(`[sync-stats] Compressed odds for ${oldFinished.length} old finished matches`);
  }

  console.log('[sync-stats] Done.');
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
