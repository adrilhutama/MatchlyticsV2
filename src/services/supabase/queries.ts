/**
 * Typed Supabase fetchers.
 *
 * Each function maps a database query to a strongly-typed result.
 * Match rows are run through the sanitizer before returning.
 * Falls back to mock data when no Supabase credentials are configured.
 */

import type { LeagueRow, MatchRow, ProfileRow } from "../../core/types/database.js";
import type { SanitizedMatch } from "../../core/types/domain.js";
import { sanitizeMatch } from "../../core/guards/match-sanitizer.js";
import { supabase } from "./client.js";
import { MOCK_MATCHES, MOCK_LEAGUES } from "./mock-data.js";

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

export async function fetchLeagues(): Promise<LeagueRow[]> {
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .order("name", { ascending: true });

  if (error || !Array.isArray(data)) return MOCK_LEAGUES as LeagueRow[];
  return data as LeagueRow[];
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

/**
 * Fetch all matches, optionally filtered by league_id.
 * Results are sanitized and nulls are dropped.
 * Falls back to mock data when no Supabase credentials are configured.
 */
export async function fetchMatches(leagueId?: string): Promise<SanitizedMatch[]> {
  let query = supabase.from("matches").select("*");

  if (leagueId) {
    query = (query as any).eq("league_id", leagueId);
  }

  const { data, error } = await query.order("kickoff", { ascending: true });

  if (error || !Array.isArray(data)) return MOCK_MATCHES;

  return (data as MatchRow[])
    .map((row) => sanitizeMatch(row))
    .filter((m): m is SanitizedMatch => m !== null);
}

/**
 * Fetch a single match by UUID.
 */
export async function fetchMatchById(matchId: string): Promise<SanitizedMatch | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !data) return null;
  return sanitizeMatch(data as MatchRow);
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function fetchUserProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}
