/**
 * Mock fixture data for offline/demo mode.
 *
 * Used as fallback when no Supabase credentials are configured.
 * Generates realistic matches with proper quant parameters and odds.
 */

import type { SanitizedMatch } from "../../core/types/domain.js";
import type { LeagueRow } from "../../core/types/database.js";

const now = new Date();

function futureHours(hours: number): Date {
  return new Date(now.getTime() + hours * 3600000);
}

export const MOCK_MATCHES: SanitizedMatch[] = [
  {
    id: "mock-1",
    leagueId: "PL",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeLogoUrl: null,
    awayLogoUrl: null,
    kickoff: futureHours(3),
    status: "scheduled",
    lambdas: { home: 1.85, away: 0.95, cov: -0.08 },
    metrics: { expectedCorners: 10.4, expectedCards: 4.5 },
    bookmakers: [
      {
        id: "pinnacle",
        name: "Pinnacle",
        isSharp: true,
        h2h: { home: 1.62, draw: 4.10, away: 5.50 },
        spreads: [
          { line: -1.0, home: 1.55, away: 2.55 },
          { line: -0.5, home: 1.72, away: 2.20 },
        ],
        totals: [
          { line: 2.5, over: 1.75, under: 2.15 },
          { line: 3.5, over: 2.65, under: 1.50 },
        ],
        updatedAt: now.toISOString(),
      },
      {
        id: "bet365",
        name: "Bet365",
        isSharp: false,
        h2h: { home: 1.75, draw: 3.90, away: 4.80 },
        spreads: [{ line: -0.5, home: 1.80, away: 2.05 }],
        totals: [{ line: 2.5, over: 1.80, under: 2.05 }],
        updatedAt: now.toISOString(),
      },
    ],
    hasValidOdds: true,
  },
  {
    id: "mock-2",
    leagueId: "CL",
    homeTeam: "Inter",
    awayTeam: "AC Milan",
    homeLogoUrl: null,
    awayLogoUrl: null,
    kickoff: futureHours(28),
    status: "scheduled",
    lambdas: { home: 1.25, away: 1.20, cov: -0.08 },
    metrics: { expectedCorners: 9.2, expectedCards: 3.8 },
    bookmakers: [
      {
        id: "pinnacle",
        name: "Pinnacle",
        isSharp: true,
        h2h: { home: 2.20, draw: 3.25, away: 3.40 },
        spreads: [{ line: -0.5, home: 2.30, away: 1.65 }],
        totals: [{ line: 2.5, over: 2.05, under: 1.82 }],
        updatedAt: now.toISOString(),
      },
      {
        id: "bet365",
        name: "Bet365",
        isSharp: false,
        h2h: { home: 2.25, draw: 3.20, away: 3.30 },
        spreads: [],
        totals: [{ line: 2.5, over: 2.10, under: 1.78 }],
        updatedAt: now.toISOString(),
      },
    ],
    hasValidOdds: true,
  },
  {
    id: "mock-3",
    leagueId: "PD",
    homeTeam: "Getafe",
    awayTeam: "Real Madrid",
    homeLogoUrl: null,
    awayLogoUrl: null,
    kickoff: futureHours(48),
    status: "scheduled",
    lambdas: { home: 0.70, away: 2.10, cov: -0.08 },
    metrics: { expectedCorners: 8.1, expectedCards: 5.2 },
    bookmakers: [
      {
        id: "pinnacle",
        name: "Pinnacle",
        isSharp: true,
        h2h: { home: 7.50, draw: 5.00, away: 1.40 },
        spreads: [
          { line: 1.5, home: 1.55, away: 2.50 },
          { line: 1.0, home: 1.35, away: 3.20 },
        ],
        totals: [
          { line: 2.5, over: 1.95, under: 1.92 },
          { line: 1.5, over: 1.30, under: 3.50 },
        ],
        updatedAt: now.toISOString(),
      },
      {
        id: "bet365",
        name: "Bet365",
        isSharp: false,
        h2h: { home: 8.00, draw: 4.80, away: 1.36 },
        spreads: [],
        totals: [{ line: 2.5, over: 2.00, under: 1.85 }],
        updatedAt: now.toISOString(),
      },
    ],
    hasValidOdds: true,
  },
  {
    id: "mock-4",
    leagueId: "PL",
    homeTeam: "Man City",
    awayTeam: "Liverpool",
    homeLogoUrl: null,
    awayLogoUrl: null,
    kickoff: futureHours(1),
    status: "live",
    lambdas: { home: 2.10, away: 1.75, cov: -0.08 },
    metrics: { expectedCorners: 11.0, expectedCards: 3.9 },
    bookmakers: [
      {
        id: "pinnacle",
        name: "Pinnacle",
        isSharp: true,
        h2h: { home: 1.95, draw: 3.80, away: 3.60 },
        spreads: [],
        totals: [
          { line: 2.5, over: 1.65, under: 2.30 },
          { line: 3.5, over: 2.40, under: 1.58 },
        ],
        updatedAt: now.toISOString(),
      },
      {
        id: "bet365",
        name: "Bet365",
        isSharp: false,
        h2h: { home: 2.00, draw: 3.75, away: 3.50 },
        spreads: [],
        totals: [{ line: 2.5, over: 1.70, under: 2.20 }],
        updatedAt: now.toISOString(),
      },
    ],
    hasValidOdds: true,
  },
  {
    id: "mock-5",
    leagueId: "CL",
    homeTeam: "Bayern Munich",
    awayTeam: "PSG",
    homeLogoUrl: null,
    awayLogoUrl: null,
    kickoff: futureHours(120),
    status: "scheduled",
    lambdas: { home: 2.30, away: 1.95, cov: -0.08 },
    metrics: { expectedCorners: 10.8, expectedCards: 3.5 },
    bookmakers: [
      {
        id: "pinnacle",
        name: "Pinnacle",
        isSharp: true,
        h2h: { home: 1.72, draw: 4.00, away: 4.50 },
        spreads: [{ line: -0.5, home: 1.90, away: 1.95 }],
        totals: [
          { line: 2.5, over: 1.55, under: 2.50 },
          { line: 3.5, over: 2.20, under: 1.70 },
        ],
        updatedAt: now.toISOString(),
      },
      {
        id: "bet365",
        name: "Bet365",
        isSharp: false,
        h2h: { home: 1.75, draw: 3.90, away: 4.40 },
        spreads: [],
        totals: [{ line: 2.5, over: 1.60, under: 2.40 }],
        updatedAt: now.toISOString(),
      },
    ],
    hasValidOdds: true,
  },
];

/** Leagues derived from mock match data */
export const MOCK_LEAGUES: LeagueRow[] = [
  { id: "PL", name: "Premier League", country: "England", home_advantage_factor: 1.28, logo_url: null },
  { id: "CL", name: "UEFA Champions League", country: "Europe", home_advantage_factor: 1.22, logo_url: null },
  { id: "PD", name: "La Liga", country: "Spain", home_advantage_factor: 1.30, logo_url: null },
];
