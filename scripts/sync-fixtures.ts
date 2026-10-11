/**
 * sync-fixtures.ts — Ingest upcoming fixtures from Football-Data.org.
 *
 * Usage:
 *   npx tsx scripts/sync-fixtures.ts [--partition=1]
 *
 * Rotates through 6 API keys stored in FOOTBALL_DATA_KEY_1 … FOOTBALL_DATA_KEY_6.
 */

import { createClient } from '@supabase/supabase-js';
import { PARTITIONS, getPartition } from './config/partitions.js';

const API_BASE = 'https://api.football-data.org/v4';

interface FdMatch {
  id: number;
  competition: { identifier: string };
  homeTeam: { name: string };
  awayTeam: { name: string };
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED';
  matchday: number;
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

async function* rotateKeys(): AsyncGenerator<string> {
  const keys = Array.from({ length: 6 }, (_, i) => process.env[`FOOTBALL_DATA_KEY_${i + 1}`])
    .filter((k): k is string => !!k);
  if (keys.length === 0) throw new Error('No FOOTBALL_DATA_KEY_* variables set');
  let idx = 0;
  while (true) {
    yield keys[idx % keys.length];
    idx++;
    await sleep(200);
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchMatches(code: string, key: string, daysAhead = 14): Promise<FdMatch[]> {
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + daysAhead * 86400000).toISOString().slice(0, 10);

  const url = `${API_BASE}/competitions/${code}/matches?dateFrom=${from}&dateTo=${to}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': key } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Football-Data HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as FdResponse;
  return json.matches ?? [];
}

function mapStatus(fd: FdMatch['status']): 'scheduled' | 'live' | 'finished' {
  switch (fd) {
    case 'SCHEDULED':
    case 'TIMED':
      return 'scheduled';
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    case 'FINISHED':
      return 'finished';
    default:
      return 'scheduled';
  }
}

async function upsertMatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  matches: FdMatch[],
) {
  for (const m of matches) {
    if (m.status === 'POSTPONED') continue;
    const leagueId = m.competition.identifier;
    await client
      .from('matches')
      .upsert(
        {
          external_id: m.id,
          league_id: leagueId,
          home_team: m.homeTeam.name,
          away_team: m.awayTeam.name,
          kickoff: m.utcDate,
          status: mapStatus(m.status),
          matchday: m.matchday,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'external_id' },
      );
  }
}

export async function main(partitionNum?: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = getServiceClient();
  const partitions = partitionNum != null ? [getPartition(partitionNum)] : PARTITIONS;
  const toRun = partitions.filter((p): p is NonNullable<typeof p> => p !== undefined);

  console.log(`[sync-fixtures] Running ${toRun.length} partition(s): ${toRun.map((p) => p.partition).join(', ')}`);

  const keyIterator = rotateKeys();
  for (const part of toRun) {
    for (const code of part.footballDataCodes) {
      const key = await keyIterator.next();
      try {
        console.log(`[sync-fixtures] Fetching ${code} …`);
        const matches = await fetchMatches(code, key.value);
        console.log(`[sync-fixtures]  → ${matches.length} fixtures for ${code}`);
        await upsertMatches(client, matches);
      } catch (err) {
        console.error(`[sync-fixtures] Error for ${code}:`, err);
      }
      await sleep(1000);
    }
  }

  console.log('[sync-fixtures] Done.');
}

const rawPart = process.argv.find((a) => a.startsWith('--partition='));
const partition = rawPart ? parseInt(rawPart.split('=')[1], 10) : undefined;
main(partition).catch((e) => {
  console.error(e);
  process.exit(1);
});
