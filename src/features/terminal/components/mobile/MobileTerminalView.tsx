import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { useTerminalInspectorStore } from "../../stores/useTerminalStore.js";
import { useTerminalFilterStore } from "../../stores/useTerminalFilterStore.js";
import { useTerminalData } from "../../hooks/useTerminalData.js";
import { MobileHeader } from "./MobileHeader.js";
import { MobileFilterSheet } from "./MobileFilterSheet.js";
import { MobileMatchCard } from "./MobileMatchCard.js";
import { MobileInspectorSheet } from "./MobileInspectorSheet.js";

export function MobileTerminalView() {
  const { openAuthModal, isAuthModalOpen } = useAuth();
  const { inspectedMatchId, openInspector, closeInspector } =
    useTerminalInspectorStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const minEV = useTerminalFilterStore((s) => s.minEV);
  const selectedBookmakerId = useTerminalFilterStore((s) => s.selectedBookmakerId);
  const activeMarketTab = useTerminalFilterStore((s) => s.activeMarketTab);

  const { matches, isLoading, error, refetch, edges } = useTerminalData();

  const selectedMatch = matches.find((m) => m.id === inspectedMatchId) ?? null;

  // Count active filters
  const activeFilterCount = [
    minEV > 0,
    selectedBookmakerId !== "pinnacle",
    activeMarketTab !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <MobileHeader
        onFilterClick={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Refresh button */}
      <div className="px-4 py-2">
        <button
          onClick={refetch}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-mono text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
        >
          <RotateCw size={12} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Match list */}
      <div className="px-4 pb-24 space-y-2">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-xs font-mono text-zinc-500">Loading matches…</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-xs font-mono text-rose-400">
              Failed to load matches.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-mono text-zinc-500">
              No matches found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          matches.map((match) => (
            <MobileMatchCard
              key={match.id}
              match={match}
              edge={edges.get(match.id)}
              onClick={() => openInspector(match.id)}
            />
          ))
        )}
      </div>

      {/* Filter sheet */}
      <MobileFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      />

      {/* Inspector sheet */}
      <MobileInspectorSheet
        match={selectedMatch}
        edge={selectedMatch ? edges.get(selectedMatch.id) : undefined}
        onClose={closeInspector}
      />

      {/* Auth modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-sm">
            {/* Inline auth modal placeholder — in real app use AuthModal component */}
            <button
              onClick={openAuthModal}
              className="w-full rounded-lg border border-emerald-700 bg-zinc-950 px-4 py-3 text-center text-sm font-mono text-emerald-400"
            >
              Open Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
