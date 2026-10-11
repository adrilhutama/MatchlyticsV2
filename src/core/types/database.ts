/**
 * Database row contracts — mirrors supabase/migrations/001_init.sql exactly.
 *
 * These types describe the raw shapes returned by Supabase queries.
 * They are intentionally permissive on optional fields so that
 * downstream sanitizers can reject incomplete records.
 */

export type UserTier = 'free' | 'pro';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface ProfileRow {
  id: string;
  email: string;
  tier: UserTier;
  created_at: string;
}

export interface LeagueRow {
  id: string;
  name: string;
  country: string;
  home_advantage_factor: number;
  logo_url: string | null;
}

export interface RawOddsMarket1X2 {
  home: number | null;
  draw: number | null;
  away: number | null;
}

export interface RawOddsMarketSpread {
  line: number;
  home: number | null;
  away: number | null;
}

export interface RawOddsMarketTotal {
  line: number;
  over: number | null;
  under: number | null;
}

export interface RawBookmakerData {
  name: string;
  last_update?: string;
  h2h?: RawOddsMarket1X2;
  spreads?: RawOddsMarketSpread[];
  totals?: RawOddsMarketTotal[];
}

export type RawOddsPayload = Record<string, RawBookmakerData>;

export interface MatchRow {
  id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  home_logo_url: string | null;
  away_logo_url: string | null;
  kickoff: string;
  status: MatchStatus;
  lambda_home: number;
  lambda_away: number;
  lambda_cov: number;
  expected_corners: number | null;
  expected_cards: number | null;
  odds_data: RawOddsPayload | unknown;
  created_at: string;
  updated_at: string;
}
