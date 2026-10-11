/**
 * Domain contracts — clean, sanitized shapes ready for UI and quant engines.
 *
 * These types are produced by match-sanitizer.ts and must be consumed
 * by all downstream layers (quant core, terminal views, bankroll calculator).
 */

import type { MatchStatus } from "./database.js";

// ---------------------------------------------------------------------------
// Odds primitives
// ---------------------------------------------------------------------------

export interface ValidatedOdds1X2 {
  home: number;
  draw: number;
  away: number;
}

export interface ValidatedSpread {
  line: number;
  home: number;
  away: number;
}

export interface ValidatedTotal {
  line: number;
  over: number;
  under: number;
}

// ---------------------------------------------------------------------------
// Bookmaker
// ---------------------------------------------------------------------------

export interface ValidatedBookmaker {
  id: string;
  name: string;
  isSharp: boolean;
  h2h: ValidatedOdds1X2 | null;
  spreads: ValidatedSpread[];
  totals: ValidatedTotal[];
  updatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export interface SanitizedMatch {
  id: string;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  kickoff: Date;
  status: MatchStatus;
  lambdas: {
    home: number;
    away: number;
    cov: number;
  };
  metrics: {
    expectedCorners: number;
    expectedCards: number;
  };
  bookmakers: ValidatedBookmaker[];
  hasValidOdds: boolean;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface ValidatedProfile {
  id: string;
  email: string;
  tier: import("./database.js").UserTier;
  createdAt: string;
}
