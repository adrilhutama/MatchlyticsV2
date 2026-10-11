/**
 * Runtime data guard — defensive sanitizer for all external payloads.
 *
 * Every function here treats its input as untrusted.  Null, undefined,
 * and malformed values are either rejected (returns null) or replaced
 * with safe defaults — never coerced silently into NaN or Infinity.
 */

import type {
  RawBookmakerData,
  RawOddsPayload,
  MatchRow,
  MatchStatus,
} from "../types/database.js";
import type {
  ValidatedOdds1X2,
  ValidatedSpread,
  ValidatedTotal,
  ValidatedBookmaker,
  SanitizedMatch,
} from "../types/domain.js";

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

/**
 * Returns true only when `val` is a finite number strictly greater than 1.01.
 * Odds at exactly 1.01 or below carry no meaningful market value.
 */
export function isValidOdd(val: unknown): val is number {
  if (typeof val !== "number") return false;
  if (!Number.isFinite(val)) return false;
  return val > 1.01;
}

/**
 * Returns true when `val` is a finite number (no minimum threshold).
 * Used for lambdas, expected values, and lines where odds thresholds don't apply.
 */
export function isFiniteNumber(val: unknown): val is number {
  if (typeof val !== "number") return false;
  return Number.isFinite(val);
}

// ---------------------------------------------------------------------------
// Bookmaker sanitization
// ---------------------------------------------------------------------------

/**
 * Check whether a bookmaker identifier should be treated as sharp.
 * Currently only Pinnacle is flagged.
 */
function classifySharp(key: string, name: string): boolean {
  const needle = key.toLowerCase().replace(/[_\s-]/g, "");
  const nameLower = name.toLowerCase().replace(/[_\s-]/g, "");
  return needle === "pinnacle" || nameLower === "pinnacle";
}

/**
 * Parse and validate a 1X2 market from raw odds data.
 * Returns null when any of the three prices is missing or invalid.
 */
function parse1X2(raw: unknown): ValidatedOdds1X2 | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }

  const r = raw as Record<string, unknown>;
  const home = isValidOdd(r.home);
  const draw = isValidOdd(r.draw);
  const away = isValidOdd(r.away);

  if (!home || !draw || !away) return null;

  return {
    home: r.home as number,
    draw: r.draw as number,
    away: r.away as number,
  };
}

/**
 * Parse and validate spread entries, dropping any row with invalid prices.
 */
function parseSpreads(raw: unknown): ValidatedSpread[] {
  if (!Array.isArray(raw)) return [];

  const valid: ValidatedSpread[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;

    const line = isFiniteNumber(e.line) ? (e.line as number) : NaN;
    if (!Number.isFinite(line)) continue;

    const home = isValidOdd(e.home);
    const away = isValidOdd(e.away);
    if (!home || !away) continue;

    valid.push({ line, home: e.home as number, away: e.away as number });
  }
  return valid;
}

/**
 * Parse and validate total (Over/Under) entries, dropping any row with invalid prices.
 */
function parseTotals(raw: unknown): ValidatedTotal[] {
  if (!Array.isArray(raw)) return [];

  const valid: ValidatedTotal[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;

    const line = isFiniteNumber(e.line) ? (e.line as number) : NaN;
    if (!Number.isFinite(line)) continue;

    const over = isValidOdd(e.over);
    const under = isValidOdd(e.under);
    if (!over || !under) continue;

    valid.push({ line, over: e.over as number, under: e.under as number });
  }
  return valid;
}

/**
 * Sanitize a single bookmaker entry from odds_data JSONB.
 * Returns null when the bookmaker has zero valid markets.
 */
export function sanitizeBookmaker(
  key: string,
  raw: unknown,
): ValidatedBookmaker | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const r = raw as RawBookmakerData;

  const name = typeof r.name === "string" && r.name.length > 0 ? r.name : key;
  const updatedAt =
    typeof r.last_update === "string" && r.last_update.length > 0
      ? r.last_update
      : null;

  const h2h = parse1X2(r.h2h);
  const spreads = parseSpreads(r.spreads);
  const totals = parseTotals(r.totals);

  // Bookmaker is invalid if it has no valid markets at all
  if (h2h === null && spreads.length === 0 && totals.length === 0) {
    return null;
  }

  return {
    id: key,
    name,
    isSharp: classifySharp(key, name),
    h2h,
    spreads,
    totals,
    updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Match sanitization
// ---------------------------------------------------------------------------

/**
 * Map a potentially corrupted match status string to a valid enum value.
 */
function coerceStatus(val: unknown): MatchStatus {
  if (val === "scheduled" || val === "live" || val === "finished") return val as MatchStatus;
  return "scheduled";
}

/**
 * Parse kickoff: accept ISO-8601 strings and coerce anything that parses.
 * Falls back to `new Date()` on failure.
 */
function parseKickoff(val: unknown): Date {
  if (typeof val === "string" && val.length > 0) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  return new Date();
}

/**
 * Full match-row → SanitizedMatch conversion.
 * Returns null when critical fields (id, league_id, home_team, away_team, kickoff)
 * are missing or empty, so the UI never renders a blank card.
 */
export function sanitizeMatch(raw: unknown): SanitizedMatch | null {
  if (
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw)
  ) {
    return null;
  }

  const r = raw as Partial<MatchRow>;

  // --- Required field checks ---
  const id = typeof r.id === "string" && r.id.length > 0 ? r.id : null;
  const leagueId =
    typeof r.league_id === "string" && r.league_id.length > 0
      ? r.league_id
      : null;
  const homeTeam =
    typeof r.home_team === "string" && r.home_team.length > 0
      ? r.home_team
      : null;
  const awayTeam =
    typeof r.away_team === "string" && r.away_team.length > 0
      ? r.away_team
      : null;
  const kickoffStr = typeof r.kickoff === "string" ? r.kickoff : null;

  if (!id || !leagueId || !homeTeam || !awayTeam || !kickoffStr) return null;

  // --- Lambdas with safe defaults ---
  const lambdaHome =
    isFiniteNumber(r.lambda_home) && r.lambda_home > 0
      ? r.lambda_home
      : 1.35;
  const lambdaAway =
    isFiniteNumber(r.lambda_away) && r.lambda_away > 0
      ? r.lambda_away
      : 1.10;
  const lambdaCov =
    isFiniteNumber(r.lambda_cov)
      ? r.lambda_cov
      : -0.08;

  // --- Metrics with safe defaults ---
  const expectedCorners =
    isFiniteNumber(r.expected_corners) && r.expected_corners > 0
      ? r.expected_corners
      : 9.5;
  const expectedCards =
    isFiniteNumber(r.expected_cards) && r.expected_cards > 0
      ? r.expected_cards
      : 4.2;

  // --- Odds parsing ---
  let parsedBookmakers: ValidatedBookmaker[] = [];
  if (
    typeof r.odds_data === "object" &&
    r.odds_data !== null &&
    !Array.isArray(r.odds_data)
  ) {
    const payload = r.odds_data as Record<string, unknown>;
    parsedBookmakers = Object.entries(payload)
      .map(([key, val]) => sanitizeBookmaker(key, val))
      .filter((b): b is ValidatedBookmaker => b !== null);
  }

  const hasValidOdds = parsedBookmakers.length > 0;

  return {
    id,
    leagueId,
    homeTeam,
    awayTeam,
    homeLogoUrl:
      typeof r.home_logo_url === "string" ? r.home_logo_url : null,
    awayLogoUrl:
      typeof r.away_logo_url === "string" ? r.away_logo_url : null,
    kickoff: parseKickoff(r.kickoff),
    status: coerceStatus(r.status),
    lambdas: { home: lambdaHome, away: lambdaAway, cov: lambdaCov },
    metrics: { expectedCorners, expectedCards },
    bookmakers: parsedBookmakers,
    hasValidOdds,
  };
}
