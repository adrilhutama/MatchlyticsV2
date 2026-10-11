import React from "react";
import { TierGate } from "@features/auth/components/TierGate.js";
import { KellyStakeBadge } from "../shared/KellyStakeBadge.js";
import {
  buildBivariatePoisson,
  devigShin,
  calculateEV,
} from "@core/math/index.js";
import type { SanitizedMatch } from "@core/types/domain.js";
import type { MatchEdge } from "../../hooks/useTerminalData.js";

export interface MobileInspectorEdgeTabProps {
  match: SanitizedMatch;
  edge?: MatchEdge;
}

export function MobileInspectorEdgeTab({ match, edge }: MobileInspectorEdgeTabProps) {
  const bookmaker = match.bookmakers.find((b) => b.id === "pinnacle");
  const pinnacleOdds = bookmaker?.h2h;
  const fair = pinnacleOdds
    ? devigShin([pinnacleOdds.home, pinnacleOdds.draw, pinnacleOdds.away])
    : null;

  if (!fair || !pinnacleOdds) {
    return (
      <p className="text-xs font-mono text-zinc-500">
        No odds data available for this match.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pinnacle fair odds */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="mb-2 text-xs font-mono text-zinc-400">
          Pinnacle Fair Odds
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "1", prob: fair.pHome, odd: pinnacleOdds.home },
            { label: "X", prob: fair.pDraw, odd: pinnacleOdds.draw },
            { label: "2", prob: fair.pAway, odd: pinnacleOdds.away },
          ].map(({ label, prob, odd }) => (
            <div key={label}>
              <span className="text-xs font-mono text-zinc-500">{label}</span>
              <p className="font-mono text-sm text-zinc-200">
                {(1 / prob).toFixed(2)}
              </p>
              <p className="text-xs font-mono text-zinc-600">
                @{odd.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* EV indicators */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="mb-2 text-xs font-mono text-zinc-400">
          Edge vs Selected Bookmaker
        </p>
        <div className="space-y-1.5">
          {[
            { label: "1", ev: edge?.homeEV ?? 0, odd: pinnacleOdds.home },
            { label: "X", ev: edge?.drawEV ?? 0, odd: pinnacleOdds.draw },
            { label: "2", ev: edge?.awayEV ?? 0, odd: pinnacleOdds.away },
          ].map(({ label, ev, odd }) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                ev >= 0.025 ? "bg-emerald-950/30" : ""
              }`}
            >
              <span className="text-xs font-mono text-zinc-400">{label}</span>
              <span
                className={`text-xs font-mono ${
                  ev >= 0.025 ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {ev >= 0 ? "+" : ""}
                {(ev * 100).toFixed(1)}% @ {odd.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Kelly stake */}
      <TierGate
        fallbackTitle="Kelly Stake Locked"
        fallbackDescription="Upgrade to Pro to see staking recommendations."
        blurIntensity="sm"
      >
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-mono text-zinc-400">
            Quarter Kelly Recommendation
          </p>
          {edge && edge.bestEV > 0 ? (
            <KellyStakeBadge
              stakePercent={edge.kellyStake * 100}
              side={edge.bestSide}
              fairProb={
                edge.bestSide === "home"
                  ? fair.pHome
                  : edge.bestSide === "draw"
                    ? fair.pDraw
                    : fair.pAway
              }
              odds={
                edge.bestSide === "home"
                  ? pinnacleOdds.home
                  : edge.bestSide === "draw"
                    ? pinnacleOdds.draw
                    : pinnacleOdds.away
              }
            />
          ) : (
            <p className="text-xs font-mono text-zinc-500">
              No positive EV edge detected.
            </p>
          )}
        </div>
      </TierGate>
    </div>
  );
}
