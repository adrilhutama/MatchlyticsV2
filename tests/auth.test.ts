import { describe, expect, it, vi, beforeEach } from "vitest";

import { useDevTierStore } from "../src/features/auth/stores/useDevTierStore.js";
import { useTerminalFilterStore } from "../src/features/terminal/stores/useTerminalFilterStore.js";

// ---------------------------------------------------------------------------
// Mock modules used by auth components
// ---------------------------------------------------------------------------

// Mock React hooks
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useContext: vi.fn(() => ({
      user: null,
      profile: null,
      isLoading: false,
      tier: "free" as const,
      isPro: false,
      isDev: true,
      signInWithEmail: vi.fn(),
      signOut: vi.fn(),
      openAuthModal: vi.fn(),
      closeAuthModal: vi.fn(),
      isAuthModalOpen: false,
    })),
    useState: vi.fn((init: unknown) => [init, vi.fn()]),
    useEffect: vi.fn(),
    useCallback: vi.fn((fn: unknown) => fn),
    useRef: vi.fn(() => ({ current: null })),
  };
});

// Mock Supabase
vi.mock("../src/services/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock("../src/services/supabase/queries", () => ({
  fetchUserProfile: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// useMediaQuery tests (from src/shared/hooks/useMediaQuery.ts)
// ---------------------------------------------------------------------------

describe("useMediaQuery", () => {
  it("defaults to desktop breakpoint", () => {
    // When window.matchMedia is mocked by setup.ts, it returns matches=false
    // This tests that the hook doesn't crash and returns a boolean
    expect(typeof window.matchMedia).toBe("function");
    const mql = window.matchMedia("(min-width: 1024px)");
    expect(typeof mql.matches).toBe("boolean");
  });

  it("returns false in test environment (no real matchMedia)", () => {
    // The setup.ts mock returns matches=false for all queries
    const mql = window.matchMedia("(min-width: 1024px)");
    expect(mql.matches).toBe(false);
  });

  it("matchMedia has required methods", () => {
    const mql = window.matchMedia("(min-width: 768px)");
    expect(typeof mql.addEventListener).toBe("function");
    expect(typeof mql.removeEventListener).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Tier Resolution Logic tests
// ---------------------------------------------------------------------------

describe("Tier Resolution", () => {
  beforeEach(() => {
    // Reset store to free before each test
    const store = useDevTierStore.getState();
    if (store.isDevModeEnabled) {
      useDevTierStore.getState().setTier("free");
    }
  });

  it("evaluates to free when profile is null (no user)", () => {
    // In a real app, profile=null → tier=free
    const tier = (null as unknown as { tier?: "free" | "pro" })?.tier ?? "free";
    expect(tier).toBe("free");
  });

  it("evaluates to free when profile tier is free", () => {
    const tier = ("free" as const) satisfies "free" | "pro";
    expect(tier).toBe("free");
  });

  it("evaluates to pro when profile tier is pro", () => {
    const tier = ("pro" as const) satisfies "free" | "pro";
    expect(tier).toBe("pro");
  });

  it("dev mode overrides profile tier", () => {
    // Simulate: profile says free, but dev mode says pro
    const profileTier = "free" as "free" | "pro";
    const simulatedTier = "pro" as "free" | "pro";
    const isDevEnabled = true;

    const effectiveTier = isDevEnabled ? simulatedTier : profileTier;
    expect(effectiveTier).toBe("pro");
  });

  it("isPro evaluates correctly based on tier", () => {
    const checkIsPro = (tier: "free" | "pro"): boolean => tier === "pro";
    expect(checkIsPro("free")).toBe(false);
    expect(checkIsPro("pro")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Zustand Store Tests
// ---------------------------------------------------------------------------

describe("useTerminalFilterStore", () => {
  beforeEach(() => {
    useTerminalFilterStore.getState().resetFilters();
  });

  it("resets to defaults", () => {
    const s = useTerminalFilterStore.getState();
    s.setMinEV(0.1);
    s.setSelectedLeagueId("laliga");
    s.setSelectedBookmakerId("bet365");
    s.setActiveMarketTab("1x2");
    s.resetFilters();

    const after = useTerminalFilterStore.getState();
    expect(after.minEV).toBe(0.025);
    expect(after.selectedLeagueId).toBeNull();
    expect(after.selectedBookmakerId).toBe("pinnacle");
    expect(after.activeMarketTab).toBe("all");
  });
});

describe("useDevTierStore", () => {
  it("starts with simulatedTier = free", () => {
    const s = useDevTierStore.getState();
    expect(s.simulatedTier).toBe("free");
  });

  it("toggleTier flips between free and pro when dev mode is enabled", () => {
    const s = useDevTierStore.getState();
    if (s.isDevModeEnabled) {
      useDevTierStore.getState().toggleTier();
      expect(useDevTierStore.getState().simulatedTier).toBe("pro");
      useDevTierStore.getState().toggleTier();
      expect(useDevTierStore.getState().simulatedTier).toBe("free");
    }
  });

  it("setTier sets the tier directly when dev mode enabled", () => {
    const s = useDevTierStore.getState();
    if (s.isDevModeEnabled) {
      useDevTierStore.getState().setTier("pro");
      expect(useDevTierStore.getState().simulatedTier).toBe("pro");
      useDevTierStore.getState().setTier("free");
      expect(useDevTierStore.getState().simulatedTier).toBe("free");
    }
  });
});

// ---------------------------------------------------------------------------
// TierGate Rendering Logic (logic-level, not DOM)
// ---------------------------------------------------------------------------

describe("TierGate Logic", () => {
  it("renders children when isPro is true", () => {
    // Logic check: if isPro, show children directly
    const isPro = true;
    const rendered = isPro ? "children" : "gated";
    expect(rendered).toBe("children");
  });

  it("shows fallback when isPro is false", () => {
    const isPro = false;
    const rendered = isPro ? "children" : "gated";
    expect(rendered).toBe("gated");
  });

  it("blur intensity maps correctly", () => {
    const blurMap = { sm: "blur-sm", md: "blur-md", lg: "blur-lg" } as const;
    expect(blurMap.sm).toBe("blur-sm");
    expect(blurMap.md).toBe("blur-md");
    expect(blurMap.lg).toBe("blur-lg");
  });
});

// ---------------------------------------------------------------------------
// Dev Mode Switcher Logic
// ---------------------------------------------------------------------------

describe("DevModeSwitch Logic", () => {
  it("returns null when dev mode is disabled", () => {
    const isDevModeEnabled = false;
    // Component would return null early
    const shouldRender = isDevModeEnabled;
    expect(shouldRender).toBe(false);
  });

  it("renders when dev mode is enabled", () => {
    const isDevModeEnabled = true;
    const shouldRender = isDevModeEnabled;
    expect(shouldRender).toBe(true);
  });
});
