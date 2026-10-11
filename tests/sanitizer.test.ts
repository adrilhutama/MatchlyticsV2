import { describe, expect, it, afterEach } from "vitest";

import {
  isValidOdd,
  sanitizeBookmaker,
  sanitizeMatch,
} from "../src/core/guards/match-sanitizer.js";
import type { SanitizedMatch, ValidatedBookmaker } from "../src/core/types/domain.js";
import { useTerminalFilterStore } from "../src/features/terminal/stores/useTerminalFilterStore.js";
import { useTerminalInspectorStore } from "../src/features/terminal/stores/useTerminalStore.js";
import { useDevTierStore } from "../src/features/auth/stores/useDevTierStore.js";

// ---------------------------------------------------------------------------
// Helper: reset Zustand stores after each test to avoid cross-test pollution
// ---------------------------------------------------------------------------
afterEach(() => {
  useTerminalFilterStore.getState().resetFilters();
  useTerminalInspectorStore.getState().closeInspector();
});

// ---------------------------------------------------------------------------
// isValidOdd
// ---------------------------------------------------------------------------

describe("isValidOdd", () => {
  it("accepts valid decimal odds > 1.01", () => {
    expect(isValidOdd(2.0)).toBe(true);
    expect(isValidOdd(1.5)).toBe(true);
    expect(isValidOdd(5.0)).toBe(true);
  });

  it("rejects odds ≤ 1.01", () => {
    expect(isValidOdd(1.01)).toBe(false);
    expect(isValidOdd(1.0)).toBe(false);
    expect(isValidOdd(1.005)).toBe(false);
    expect(isValidOdd(0.5)).toBe(false);
    expect(isValidOdd(-1)).toBe(false);
  });

  it("rejects non-number types", () => {
    expect(isValidOdd(null)).toBe(false);
    expect(isValidOdd(undefined)).toBe(false);
    expect(isValidOdd("2.0")).toBe(false);
    expect(isValidOdd(NaN)).toBe(false);
    expect(isValidOdd(Infinity)).toBe(false);
    expect(isValidOdd(-Infinity)).toBe(false);
    expect(isValidOdd({})).toBe(false);
    expect(isValidOdd([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeBookmaker
// ---------------------------------------------------------------------------

describe("sanitizeBookmaker", () => {
  it("extracts Pinnacle as isSharp and validates 1X2", () => {
    const raw = {
      name: "Pinnacle",
      last_update: "2024-01-15T10:00:00Z",
      h2h: { home: 2.1, draw: 3.4, away: 3.6 },
      spreads: [{ line: -1.5, home: 1.9, away: 1.95 }],
      totals: [{ line: 2.5, over: 1.85, under: 2.05 }],
    };

    const result = sanitizeBookmaker("pinnacle", raw);
    expect(result).not.toBeNull();
    expect(result!.isSharp).toBe(true);
    expect(result!.name).toBe("Pinnacle");
    expect(result!.h2h).toEqual({ home: 2.1, draw: 3.4, away: 3.6 });
    expect(result!.spreads).toEqual([{ line: -1.5, home: 1.9, away: 1.95 }]);
    expect(result!.totals).toEqual([{ line: 2.5, over: 1.85, under: 2.05 }]);
    expect(result!.updatedAt).toBe("2024-01-15T10:00:00Z");
  });

  it("marks lowercase 'pinnacle' key as sharp", () => {
    const raw = {
      name: "Bet365",
      h2h: { home: 2.0, draw: 3.5, away: 4.0 },
    };
    const result = sanitizeBookmaker("pinnacle", raw);
    expect(result!.isSharp).toBe(true);
  });

  it("discards bookmaker with invalid (missing) 1X2 prices", () => {
    const raw = {
      name: "BadBook",
      h2h: { home: 2.0, draw: null, away: 4.0 },
    };
    expect(sanitizeBookmaker("badbook", raw)).toBeNull();
  });

  it("discards incomplete spreads (missing home price)", () => {
    const raw = {
      name: "PartialBook",
      h2h: { home: 2.0, draw: 3.5, away: 4.0 },
      spreads: [{ line: -0.5, home: null, away: 1.9 }],
    };
    const result = sanitizeBookmaker("partial", raw);
    expect(result).not.toBeNull();
    expect(result!.spreads).toEqual([]);
  });

  it("discards bookmaker with zero valid markets", () => {
    const raw = {
      name: "EmptyBook",
      h2h: { home: null, draw: null, away: null },
      spreads: [],
      totals: [{ line: 2.5, over: null, under: null }],
    };
    expect(sanitizeBookmaker("empty", raw)).toBeNull();
  });

  it("falls back to key name when name field is empty", () => {
    const raw = {
      name: "",
      h2h: { home: 2.0, draw: 3.5, away: 4.0 },
    };
    const result = sanitizeBookmaker("bet365", raw);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("bet365");
  });

  it("returns null for non-object input", () => {
    expect(sanitizeBookmaker("key", "string" as unknown)).toBeNull();
    expect(sanitizeBookmaker("key", 42 as unknown)).toBeNull();
    expect(sanitizeBookmaker("key", null as unknown)).toBeNull();
    expect(sanitizeBookmaker("key", [1, 2] as unknown)).toBeNull();
  });

  it("filters totals with missing over price", () => {
    const raw = {
      name: "SomeBook",
      h2h: { home: 2.0, draw: 3.5, away: 4.0 },
      totals: [
        { line: 2.5, over: 1.85, under: 2.05 },
        { line: 3.5, over: null, under: 2.1 },
      ],
    };
    const result = sanitizeBookmaker("somebook", raw);
    expect(result!.totals).toHaveLength(1);
    expect(result!.totals[0].line).toBe(2.5);
  });
});

// ---------------------------------------------------------------------------
// sanitizeMatch
// ---------------------------------------------------------------------------

describe("sanitizeMatch", () => {
  it("returns null when required fields are missing", () => {
    expect(sanitizeMatch(null)).toBeNull();
    expect(sanitizeMatch({})).toBeNull();
    expect(sanitizeMatch({ id: "1" })).toBeNull(); // missing league_id, home_team, etc.
    expect(
      sanitizeMatch({
        id: "1",
        league_id: "epl",
        home_team: "A",
        away_team: "B",
        kickoff: "",
      }),
    ).toBeNull();
  });

  it("parses a full valid match row correctly", () => {
    const row = {
      id: "match-1",
      league_id: "epl",
      home_team: "Arsenal",
      away_team: "Chelsea",
      home_logo_url: "https://example.com/a.png",
      away_logo_url: "https://example.com/b.png",
      kickoff: "2024-03-15T15:00:00Z",
      status: "scheduled" as const,
      lambda_home: 1.6,
      lambda_away: 1.1,
      lambda_cov: -0.08,
      expected_corners: 9.5,
      expected_cards: 4.2,
      odds_data: {
        pinnacle: {
          name: "Pinnacle",
          h2h: { home: 2.1, draw: 3.4, away: 3.6 },
          totals: [{ line: 2.5, over: 1.85, under: 2.05 }],
        },
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const result = sanitizeMatch(row);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("match-1");
    expect(result!.leagueId).toBe("epl");
    expect(result!.homeTeam).toBe("Arsenal");
    expect(result!.awayTeam).toBe("Chelsea");
    expect(result!.lambdas.home).toBe(1.6);
    expect(result!.lambdas.away).toBe(1.1);
    expect(result!.lambdas.cov).toBe(-0.08);
    expect(result!.metrics.expectedCorners).toBe(9.5);
    expect(result!.metrics.expectedCards).toBe(4.2);
    expect(result!.hasValidOdds).toBe(true);
    expect(result!.bookmakers.length).toBe(1);
    expect(result!.bookmakers[0].isSharp).toBe(true);
    expect(result!.kickoff).toEqual(new Date("2024-03-15T15:00:00Z"));
  });

  it("provides safe fallback defaults when lambdas are missing or invalid", () => {
    const row = {
      id: "m2",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "2024-03-15T15:00:00Z",
      status: "scheduled" as const,
      lambda_home: NaN,
      lambda_away: -5,
      lambda_cov: undefined,
      expected_corners: null,
      expected_cards: null,
      odds_data: {},
    };

    const result = sanitizeMatch(row);
    expect(result).not.toBeNull();
    expect(result!.lambdas.home).toBe(1.35);
    expect(result!.lambdas.away).toBe(1.10);
    expect(result!.lambdas.cov).toBe(-0.08);
    expect(result!.metrics.expectedCorners).toBe(9.5);
    expect(result!.metrics.expectedCards).toBe(4.2);
  });

  it("gracefully handles malformed odds_data without throwing", () => {
    const row = {
      id: "m3",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "2024-03-15T15:00:00Z",
      status: "live" as const,
      lambda_home: 1.5,
      lambda_away: 1.2,
      lambda_cov: -0.05,
      expected_corners: 10,
      expected_cards: 4,
      odds_data: "not-an-object" as unknown,
    };

    expect(() => sanitizeMatch(row)).not.toThrow();
    const result = sanitizeMatch(row);
    expect(result).not.toBeNull();
    expect(result!.hasValidOdds).toBe(false);
    expect(result!.bookmakers).toEqual([]);
  });

  it("handles empty object odds_data", () => {
    const row = {
      id: "m4",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "2024-03-15T15:00:00Z",
      status: "finished" as const,
      lambda_home: 1.0,
      lambda_away: 1.0,
      lambda_cov: 0,
      expected_corners: 8,
      expected_cards: 3,
      odds_data: {},
    };

    const result = sanitizeMatch(row);
    expect(result!.hasValidOdds).toBe(false);
    expect(result!.status).toBe("finished");
  });

  it("coerces invalid status to 'scheduled'", () => {
    const row = {
      id: "m5",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "2024-03-15T15:00:00Z",
      status: "unknown_status" as unknown,
      lambda_home: 1.0,
      lambda_away: 1.0,
      lambda_cov: 0,
      odds_data: {},
    };

    const result = sanitizeMatch(row);
    expect(result!.status).toBe("scheduled");
  });

  it("falls back to new Date() for unparseable kickoff", () => {
    const nowBefore = Date.now();
    const row = {
      id: "m6",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "not-a-date" as unknown,
      status: "scheduled" as const,
      lambda_home: 1.0,
      lambda_away: 1.0,
      lambda_cov: 0,
      odds_data: {},
    };

    const result = sanitizeMatch(row);
    expect(result).not.toBeNull();
    expect(result!.kickoff.getTime()).toBeGreaterThanOrEqual(nowBefore);
  });

  it("treats odds with value ≤ 1.01 as invalid", () => {
    const row = {
      id: "m7",
      league_id: "epl",
      home_team: "A",
      away_team: "B",
      kickoff: "2024-03-15T15:00:00Z",
      status: "scheduled" as const,
      lambda_home: 1.0,
      lambda_away: 1.0,
      lambda_cov: 0,
      odds_data: {
        bookmaker: {
          name: "Book",
          h2h: { home: 1.01, draw: 3.5, away: 4.0 },
        },
      },
    };

    const result = sanitizeMatch(row);
    expect(result!.hasValidOdds).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Zustand stores
// ---------------------------------------------------------------------------

describe("useTerminalFilterStore", () => {
  it("starts with default values", () => {
    const s = useTerminalFilterStore.getState();
    expect(s.minEV).toBe(0.025);
    expect(s.selectedLeagueId).toBeNull();
    expect(s.selectedBookmakerId).toBe("pinnacle");
    expect(s.activeMarketTab).toBe("all");
  });

  it("updates minEV", () => {
    useTerminalFilterStore.getState().setMinEV(0.05);
    expect(useTerminalFilterStore.getState().minEV).toBe(0.05);
  });

  it("updates selectedLeagueId", () => {
    useTerminalFilterStore.getState().setSelectedLeagueId("epl");
    expect(useTerminalFilterStore.getState().selectedLeagueId).toBe("epl");
  });

  it("updates selectedBookmakerId", () => {
    useTerminalFilterStore.getState().setSelectedBookmakerId("bet365");
    expect(useTerminalFilterStore.getState().selectedBookmakerId).toBe("bet365");
  });

  it("updates activeMarketTab", () => {
    useTerminalFilterStore.getState().setActiveMarketTab("1x2");
    expect(useTerminalFilterStore.getState().activeMarketTab).toBe("1x2");
    useTerminalFilterStore.getState().setActiveMarketTab("spreads");
    expect(useTerminalFilterStore.getState().activeMarketTab).toBe("spreads");
    useTerminalFilterStore.getState().setActiveMarketTab("totals");
    expect(useTerminalFilterStore.getState().activeMarketTab).toBe("totals");
  });

  it("resetFilters restores all defaults", () => {
    const s = useTerminalFilterStore.getState();
    s.setMinEV(0.1);
    s.setSelectedLeagueId("laliga");
    s.setSelectedBookmakerId("bet365");
    s.setActiveMarketTab("1x2");
    s.resetFilters();

    expect(useTerminalFilterStore.getState().minEV).toBe(0.025);
    expect(useTerminalFilterStore.getState().selectedLeagueId).toBeNull();
    expect(useTerminalFilterStore.getState().selectedBookmakerId).toBe("pinnacle");
    expect(useTerminalFilterStore.getState().activeMarketTab).toBe("all");
  });
});

describe("useTerminalInspectorStore", () => {
  it("starts closed with no inspected match", () => {
    const s = useTerminalInspectorStore.getState();
    expect(s.inspectedMatchId).toBeNull();
    expect(s.isInspectorOpen).toBe(false);
  });

  it("openInspector sets both id and open flag", () => {
    useTerminalInspectorStore.getState().openInspector("match-xyz");
    const s = useTerminalInspectorStore.getState();
    expect(s.inspectedMatchId).toBe("match-xyz");
    expect(s.isInspectorOpen).toBe(true);
  });

  it("closeInspector clears both id and open flag", () => {
    useTerminalInspectorStore.getState().openInspector("match-abc");
    useTerminalInspectorStore.getState().closeInspector();
    const s = useTerminalInspectorStore.getState();
    expect(s.inspectedMatchId).toBeNull();
    expect(s.isInspectorOpen).toBe(false);
  });

  it("setInspectedMatchId updates id without toggling open", () => {
    useTerminalInspectorStore.getState().setInspectedMatchId("match-new");
    expect(useTerminalInspectorStore.getState().inspectedMatchId).toBe("match-new");
  });
});

describe("useDevTierStore", () => {
  it("starts with simulatedTier = 'free'", () => {
    const s = useDevTierStore.getState();
    expect(s.simulatedTier).toBe("free");
  });

  it("toggleTier flips between free and pro", () => {
    const s = useDevTierStore.getState();
    if (s.isDevModeEnabled) {
      useDevTierStore.getState().toggleTier();
      expect(useDevTierStore.getState().simulatedTier).toBe("pro");
      useDevTierStore.getState().toggleTier();
      expect(useDevTierStore.getState().simulatedTier).toBe("free");
    }
  });

  it("setTier sets the tier directly", () => {
    const s = useDevTierStore.getState();
    if (s.isDevModeEnabled) {
      useDevTierStore.getState().setTier("pro");
      expect(useDevTierStore.getState().simulatedTier).toBe("pro");
      useDevTierStore.getState().setTier("free");
      expect(useDevTierStore.getState().simulatedTier).toBe("free");
    }
  });
});
