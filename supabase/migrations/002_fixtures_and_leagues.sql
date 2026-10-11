-- ============================================================
-- Matchlytics V2 — Migration 002: Fixtures Enrichment & League Seed
-- ============================================================

-- 1. Extend matches table with external identifiers and score columns
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS external_id INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS matchday    INTEGER,
  ADD COLUMN IF NOT EXISTS home_score  INTEGER,
  ADD COLUMN IF NOT EXISTS away_score  INTEGER;

-- 2. Seed / Upsert the 12 supported leagues
INSERT INTO public.leagues (id, name, country, home_advantage_factor)
VALUES
  ('PL',  'Premier League',      'England', 1.28),
  ('ELC', 'Championship',        'England', 1.25),
  ('PD',  'La Liga',             'Spain',   1.30),
  ('SA',  'Serie A',             'Italy',   1.26),
  ('BL1', 'Bundesliga',          'Germany', 1.32),
  ('FL1', 'Ligue 1',             'France',  1.27),
  ('DED', 'Eredivisie',          'Netherlands', 1.30),
  ('PPL', 'Primeira Liga',       'Portugal', 1.28),
  ('BSA', 'Campeonato Brasileiro', 'Brazil', 1.35),
  ('CL',  'UEFA Champions League','Europe', 1.22),
  ('EC',  'European Championship','Europe', 1.15),
  ('WC',  'FIFA World Cup',      'World',  1.10)
ON CONFLICT (id) DO UPDATE SET
  name                    = EXCLUDED.name,
  home_advantage_factor   = EXCLUDED.home_advantage_factor;
