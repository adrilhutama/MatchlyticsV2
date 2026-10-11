/**
 * Terminal inspector store — Zustand singleton.
 *
 * Manages which match is currently under deep inspection (heatmap,
 * quant breakdown, bankroll simulation).  Drives the split-view on
 * desktop and the bottom-sheet drawer on mobile.
 */

import { create } from "zustand";

interface TerminalInspectorState {
  inspectedMatchId: string | null;
  isInspectorOpen: boolean;
}

interface TerminalInspectorActions {
  setInspectedMatchId: (id: string | null) => void;
  openInspector: (id: string) => void;
  closeInspector: () => void;
}

export const useTerminalInspectorStore = create<TerminalInspectorState & TerminalInspectorActions>(
  (set) => ({
    inspectedMatchId: null,
    isInspectorOpen: false,

    setInspectedMatchId: (id) => set({ inspectedMatchId: id }),
    openInspector: (id) => set({ inspectedMatchId: id, isInspectorOpen: true }),
    closeInspector: () => set({ inspectedMatchId: null, isInspectorOpen: false }),
  }),
);
