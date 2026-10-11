/**
 * Terminal filter store — Zustand singleton.
 *
 * Controls which matches appear in the terminal view based on user-selected
 * filters (min EV threshold, league, bookmaker, market tab).
 */

import { create } from "zustand";

interface TerminalFilterState {
  minEV: number;
  selectedLeagueId: string | null;
  selectedBookmakerId: string;
  activeMarketTab: "all" | "1x2" | "spreads" | "totals";
}

interface TerminalFilterActions {
  setMinEV: (val: number) => void;
  setSelectedLeagueId: (id: string | null) => void;
  setSelectedBookmakerId: (id: string) => void;
  setActiveMarketTab: (tab: "all" | "1x2" | "spreads" | "totals") => void;
  resetFilters: () => void;
}

const DEFAULTS: TerminalFilterState = {
  minEV: 0.025,
  selectedLeagueId: null,
  selectedBookmakerId: "pinnacle",
  activeMarketTab: "all",
};

export const useTerminalFilterStore = create<TerminalFilterState & TerminalFilterActions>(
  (set) => ({
    ...DEFAULTS,

    setMinEV: (val) => set({ minEV: val }),
    setSelectedLeagueId: (id) => set({ selectedLeagueId: id }),
    setSelectedBookmakerId: (id) => set({ selectedBookmakerId: id }),
    setActiveMarketTab: (tab) => set({ activeMarketTab: tab }),
    resetFilters: () => set(DEFAULTS),
  }),
);
