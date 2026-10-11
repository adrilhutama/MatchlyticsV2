-- ============================================================
-- Matchlytics V2 — Seed Data (supabase/seed.sql)
--
-- Run against your Supabase project after applying migration 001:
--   supabase db push --db-url <DATABASE_URL>
-- Or via the Supabase SQL Editor.
--
-- All dates use Asia/Jakarta timezone (UTC+7).
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. LEAGUES
-- ---------------------------------------------------------------------------
INSERT INTO public.leagues (id, name, country, home_advantage_factor, logo_url) VALUES
  ('epl',   'English Premier League',   'England',  1.28, 'https://media.api-sports.io/football/leagues/39.png'),
  ('ucl',   'UEFA Champions League',    'Europe',   1.22, 'https://media.api-sports.io/football/leagues/2.png'),
  ('laliga','La Liga',                  'Spain',    1.30, 'https://media.api-sports.io/football/leagues/140.png');

-- ---------------------------------------------------------------------------
-- 2. MATCHES
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------
-- Match 1: Arsenal vs Chelsea  (EPL · High +EV Gold Setup)
-- ---------------------------------------------------------------
-- Pinnacle fair: 1.62 / 4.10 / 5.50  (implied: 58.7% / 22.8% / 18.2%)
-- Bet365 off-market home 1.75 → EV ≈ +8.1% on Home
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'epl',
  'Arsenal', 'Chelsea',
  'https://media.api-sports.io/football/teams/42.png',
  'https://media.api-sports.io/football/teams/49.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '3 hours',
  'scheduled'::match_status,
  1.85, 0.95, -0.08,
  10.4, 4.5,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "last_update": "' || TO_CHAR(NOW(), 'YYYY-MM"T"HH24:MI:SS"Z"') || '",
      "h2h":      { "home": 1.62, "draw": 4.10, "away": 5.50 },
      "spreads":  [
        { "line": -1.0, "home": 1.55, "away": 2.55 },
        { "line": -0.5, "home": 1.72, "away": 2.20 }
      ],
      "totals":   [
        { "line": 2.5, "over": 1.75, "under": 2.15 },
        { "line": 3.5, "over": 2.65, "under": 1.50 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "last_update": "' || TO_CHAR(NOW(), 'YYYY-MM"T"HH24:MI:SS"Z"') || '",
      "h2h":      { "home": 1.75, "draw": 3.90, "away": 4.80 },
      "spreads":  [
        { "line": -1.0, "home": 1.65, "away": 2.25 },
        { "line": -0.5, "home": 1.80, "away": 2.05 }
      ],
      "totals":   [
        { "line": 2.5, "over": 1.80, "under": 2.05 },
        { "line": 3.5, "over": 2.75, "under": 1.45 }
      ]
    },
    "unibet": {
      "name": "Unibet",
      "h2h":      { "home": 1.70, "draw": 3.95, "away": 5.00 },
      "totals":   [
        { "line": 2.5, "over": 1.78, "under": 2.08 }
      ]
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 2: Inter vs AC Milan  (UCL · Tight Derby / Draw Bias)
-- ---------------------------------------------------------------
-- Low-scoring, balanced lambdas → top score 1-1 (~13.5%)
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'ucl',
  'Inter', 'AC Milan',
  'https://media.api-sports.io/football/teams/505.png',
  'https://media.api-sports.io/football/teams/489.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '28 hours',
  'scheduled'::match_status,
  1.25, 1.20, -0.08,
  9.2, 3.8,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 2.20, "draw": 3.25, "away": 3.40 },
      "spreads":  [
        { "line": -0.5, "home": 2.30, "away": 1.65 }
      ],
      "totals":   [
        { "line": 2.5, "over": 2.05, "under": 1.82 },
        { "line": 1.5, "over": 1.25, "under": 4.00 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 2.25, "draw": 3.20, "away": 3.30 },
      "totals":   [
        { "line": 2.5, "over": 2.10, "under": 1.78 }
      ]
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 3: Getafe vs Real Madrid  (La Liga · Underdog Value)
-- ---------------------------------------------------------------
-- Getafe 0.70 λ vs Real 2.10 λ → soft book over 2.5 Under offer
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'laliga',
  'Getafe', 'Real Madrid',
  'https://media.api-sports.io/football/teams/546.png',
  'https://media.api-sports.io/football/teams/541.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '48 hours',
  'scheduled'::match_status,
  0.70, 2.10, -0.08,
  8.1, 5.2,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 7.50, "draw": 5.00, "away": 1.40 },
      "spreads":  [
        { "line": +1.5, "home": 1.55, "away": 2.50 },
        { "line": +1.0, "home": 1.35, "away": 3.20 }
      ],
      "totals":   [
        { "line": 2.5, "over": 1.95, "under": 1.92 },
        { "line": 1.5, "over": 1.30, "under": 3.50 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 8.00, "draw": 4.80, "away": 1.36 },
      "totals":   [
        { "line": 2.5, "over": 2.00, "under": 1.85 }
      ]
    },
    "1xbet": {
      "name": "1xBet",
      "h2h":      { "home": 8.20, "draw": 4.90, "away": 1.34 },
      "totals":   [
        { "line": 2.5, "over": 2.05, "under": 1.80 }
      ]
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 4: Man City vs Liverpool  (EPL · Live Scenario)
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'epl',
  'Manchester City', 'Liverpool',
  'https://media.api-sports.io/football/teams/50.png',
  'https://media.api-sports.io/football/teams/40.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '1 hour',
  'live'::match_status,
  2.10, 1.75, -0.08,
  11.0, 3.9,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 1.95, "draw": 3.80, "away": 3.60 },
      "totals":   [
        { "line": 2.5, "over": 1.65, "under": 2.30 },
        { "line": 3.5, "over": 2.40, "under": 1.58 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 2.00, "draw": 3.75, "away": 3.50 },
      "totals":   [
        { "line": 2.5, "over": 1.70, "under": 2.20 }
      ]
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 5: Barcelona vs Atletico Madrid  (La Liga · Finished)
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'laliga',
  'Barcelona', 'Atletico Madrid',
  'https://media.api-sports.io/football/teams/529.png',
  'https://media.api-sports.io/football/teams/530.png',
  NOW() AT TIME ZONE 'utc' - INTERVAL '2 days',
  'finished'::match_status,
  1.90, 1.05, -0.08,
  9.8, 4.0,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 1.55, "draw": 4.30, "away": 6.00 },
      "totals":   [
        { "line": 2.5, "over": 1.70, "under": 2.20 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 1.57, "draw": 4.20, "away": 5.80 }
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 6: Bayern Munich vs PSG  (UCL · Classic Heavyweight)
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'ucl',
  'Bayern Munich', 'Paris Saint-Germain',
  'https://media.api-sports.io/football/teams/157.png',
  'https://media.api-sports.io/football/teams/85.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '5 days',
  'scheduled'::match_status,
  2.30, 1.95, -0.08,
  10.8, 3.5,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 1.72, "draw": 4.00, "away": 4.50 },
      "spreads":  [
        { "line": -0.5, "home": 1.90, "away": 1.95 }
      ],
      "totals":   [
        { "line": 2.5, "over": 1.55, "under": 2.50 },
        { "line": 3.5, "over": 2.20, "under": 1.70 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 1.75, "draw": 3.90, "away": 4.40 },
      "totals":   [
        { "line": 2.5, "over": 1.60, "under": 2.40 }
      ]
    },
    "unibet": {
      "name": "Unibet",
      "h2h":      { "home": 1.73, "draw": 3.95, "away": 4.45 },
      "totals":   [
        { "line": 2.5, "over": 1.58, "under": 2.45 }
      ]
    }
  }'::jsonb
);

-- ---------------------------------------------------------------
-- Match 7: Newcastle vs Tottenham  (EPL · Late Fixture)
-- ---------------------------------------------------------------
INSERT INTO public.matches (
  league_id, home_team, away_team,
  home_logo_url, away_logo_url,
  kickoff, status,
  lambda_home, lambda_away, lambda_cov,
  expected_corners, expected_cards,
  odds_data
) VALUES (
  'epl',
  'Newcastle United', 'Tottenham Hotspur',
  'https://media.api-sports.io/football/teams/34.png',
  'https://media.api-sports.io/football/teams/47.png',
  NOW() AT TIME ZONE 'utc' + INTERVAL '6 days',
  'scheduled'::match_status,
  1.55, 1.40, -0.08,
  9.6, 4.8,
  '{
    "pinnacle": {
      "name": "Pinnacle",
      "h2h":      { "home": 2.10, "draw": 3.50, "away": 3.30 },
      "totals":   [
        { "line": 2.5, "over": 1.88, "under": 1.98 },
        { "line": 1.5, "over": 1.22, "under": 4.50 }
      ]
    },
    "bet365": {
      "name": "Bet365",
      "h2h":      { "home": 2.15, "draw": 3.45, "away": 3.25 },
      "totals":   [
        { "line": 2.5, "over": 1.90, "under": 1.95 }
      ]
    }
  }'::jsonb
);
