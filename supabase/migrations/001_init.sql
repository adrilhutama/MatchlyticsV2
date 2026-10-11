-- ============================================================
-- Matchlytics V2 — Migration 001: Initial Schema
-- ============================================================

-- 1. Custom ENUM Types
CREATE TYPE public.user_tier AS ENUM ('free', 'pro');
CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'finished');

-- 2. Profiles Table (Auth Linked)
CREATE TABLE public.profiles (
  id         UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT         NOT NULL,
  tier       user_tier    NOT NULL DEFAULT 'free'::user_tier,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 3. Leagues Table
CREATE TABLE public.leagues (
  id                       TEXT    PRIMARY KEY,
  name                     TEXT    NOT NULL,
  country                  TEXT    NOT NULL,
  home_advantage_factor    NUMERIC NOT NULL DEFAULT 1.25,
  logo_url                 TEXT
);

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for leagues"
  ON public.leagues FOR SELECT
  USING (true);

-- 4. Matches Table
CREATE TABLE public.matches (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id        TEXT           NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_team        TEXT           NOT NULL,
  away_team        TEXT           NOT NULL,
  home_logo_url    TEXT,
  away_logo_url    TEXT,
  kickoff          TIMESTAMPTZ    NOT NULL,
  status           match_status   NOT NULL DEFAULT 'scheduled'::match_status,

  -- Precomputed Quant Parameters
  lambda_home      NUMERIC        NOT NULL DEFAULT 1.35,
  lambda_away      NUMERIC        NOT NULL DEFAULT 1.10,
  lambda_cov       NUMERIC        NOT NULL DEFAULT -0.08,

  -- Match Metrics
  expected_corners NUMERIC        DEFAULT 9.5,
  expected_cards   NUMERIC        DEFAULT 4.2,

  -- Bookmaker Odds Payload
  odds_data        JSONB          NOT NULL DEFAULT '{}'::jsonb,

  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_kickoff ON public.matches(kickoff);
CREATE INDEX idx_matches_league  ON public.matches(league_id);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for matches"
  ON public.matches FOR SELECT
  USING (true);

-- 5. Auth Trigger Function & Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, tier)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
