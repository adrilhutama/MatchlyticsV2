import React from "react";
import { Drawer } from "@shared/components/ui/drawer.js";
import { Button } from "@shared/components/ui/button.js";
import { Badge } from "@shared/components/ui/badge.js";
import { useTerminalFilterStore } from "../../stores/useTerminalFilterStore.js";

const EV_PRESETS = [
  { label: "All", value: 0 },
  { label: "+1.0%", value: 0.01 },
  { label: "+2.5%", value: 0.025 },
  { label: "+5.0%", value: 0.05 },
] as const;

const MARKET_TABS = ["all", "1x2", "spreads", "totals"] as const;
const BOOKMAKER_IDS = ["pinnacle", "bet365", "unibet", "1xbet"] as const;

export interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
}

export const MobileFilterSheet = React.memo(function MobileFilterSheet({
  open,
  onClose,
}: MobileFilterSheetProps) {
  const {
    minEV,
    selectedLeagueId,
    selectedBookmakerId,
    activeMarketTab,
    setMinEV,
    setSelectedLeagueId,
    setSelectedBookmakerId,
    setActiveMarketTab,
    resetFilters,
  } = useTerminalFilterStore();

  const activeCount = [
    minEV > 0,
    selectedLeagueId !== null,
    activeMarketTab !== "all",
  ].filter(Boolean).length;

  return (
    <Drawer open={open} onOpenChange={onClose} title="Filters">
      <div className="space-y-5">
        {/* Min EV */}
        <div>
          <p className="mb-2 text-xs font-mono text-zinc-400">Min EV Threshold</p>
          <div className="flex flex-wrap gap-2">
            {EV_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setMinEV(p.value)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs font-mono transition-colors " +
                  (minEV === p.value
                    ? "border-emerald-600 bg-emerald-950/50 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market Tab */}
        <div>
          <p className="mb-2 text-xs font-mono text-zinc-400">Market</p>
          <div className="flex gap-2">
            {MARKET_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMarketTab(tab)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs font-mono transition-colors " +
                  (activeMarketTab === tab
                    ? "border-emerald-600 bg-emerald-950/50 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500")
                }
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Bookmaker */}
        <div>
          <p className="mb-2 text-xs font-mono text-zinc-400">Compare Against</p>
          <div className="flex flex-wrap gap-2">
            {BOOKMAKER_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setSelectedBookmakerId(id)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs font-mono transition-colors " +
                  (selectedBookmakerId === id
                    ? "border-amber-600 bg-amber-950/50 text-amber-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500")
                }
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
});
