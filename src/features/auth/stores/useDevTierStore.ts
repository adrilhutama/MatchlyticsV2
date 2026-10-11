/**
 * Dev-mode tier switcher — Zustand singleton.
 *
 * In development, this lets testers toggle between `free` and `pro`
 * tiers without going through the payment flow.  In production builds
 * (import.meta.env.PROD), the store is effectively read-only — the
 * simulated tier always resolves to the user'\''s actual tier.
 */

import { create } from "zustand";

type Tier = "free" | "pro";

interface DevTierState {
  simulatedTier: Tier;
  isDevModeEnabled: boolean;
}

interface DevTierActions {
  toggleTier: () => void;
  setTier: (tier: Tier) => void;
}

type ImportMetaEnv = { DEV?: boolean; PROD?: boolean };

export const useDevTierStore = create<DevTierState & DevTierActions>((set, get) => ({
  simulatedTier: "free",
  // Guard: never auto-enable dev mode outside DEV environments
  isDevModeEnabled:
    typeof import.meta !== "undefined" &&
    (((import.meta as unknown as { env: ImportMetaEnv })).env?.DEV === true),

  toggleTier: () => {
    const { simulatedTier } = get();
    const next: Tier = simulatedTier === "free" ? "pro" : "free";
    set({ simulatedTier: next });
  },

  setTier: (tier) => {
    if (!get().isDevModeEnabled) return;
    if (tier !== "free" && tier !== "pro") return;
    // eslint-disable-next-line no-console
    console.info(`[DevTier] Switched to ${tier}`);
    set({ simulatedTier: tier });
  },
}));
