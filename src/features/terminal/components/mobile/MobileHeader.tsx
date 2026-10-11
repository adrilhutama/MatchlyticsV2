import React from "react";
import { Filter } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth.js";
import { useTerminalFilterStore } from "../../stores/useTerminalFilterStore.js";

export interface MobileHeaderProps {
  onFilterClick: () => void;
  leagueName?: string;
  activeFilterCount: number;
}

export const MobileHeader = React.memo(function MobileHeader({
  onFilterClick,
  leagueName,
  activeFilterCount,
}: MobileHeaderProps) {
  const { isPro, openAuthModal, user } = useAuth();
  const minEV = useTerminalFilterStore((s) => s.minEV);
  const selectedBookmakerId = useTerminalFilterStore((s) => s.selectedBookmakerId);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-zinc-100">
            MATCHLYTICS
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          {leagueName && (
            <span className="text-xs font-mono text-zinc-500">· {leagueName}</span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onFilterClick}
            aria-label="Open filters"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <Filter size={14} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-mono text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1">
              <span className="text-xs font-mono text-zinc-300">{user.email}</span>
              <span
                className={`text-xs font-mono ${isPro ? "text-amber-400" : "text-zinc-500"}`}
              >
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="rounded-md border border-emerald-700 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-400 transition-colors hover:bg-emerald-950/60"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
