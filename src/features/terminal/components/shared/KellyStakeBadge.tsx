import React from "react";
import { Shield } from "lucide-react";
import { TierGate } from "@features/auth/components/TierGate.js";

export interface KellyStakeBadgeProps {
  stakePercent: number;
  side: "home" | "draw" | "away";
  fairProb: number;
  odds: number;
}

export const KellyStakeBadge = React.memo(function KellyStakeBadge({
  stakePercent,
  side,
  fairProb,
  odds,
}: KellyStakeBadgeProps) {
  return (
    <TierGate
      fallbackTitle="Quarter Kelly Locked"
      fallbackDescription="Upgrade to Pro to see staking recommendations."
      blurIntensity="sm"
    >
      <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-700/50 bg-amber-950/30 px-2.5 py-1">
        <Shield size={12} className="text-amber-400" />
        <span className="text-xs font-mono text-amber-300">
          {side.toUpperCase()} {stakePercent.toFixed(1)}% @ {odds.toFixed(2)}
        </span>
        <span className="text-xs font-mono text-zinc-500">
          (P={fairProb.toFixed(2)})
        </span>
      </div>
    </TierGate>
  );
});
