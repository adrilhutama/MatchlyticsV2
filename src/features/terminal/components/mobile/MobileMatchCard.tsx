import React from "react";
import type { SanitizedMatch } from "@core/types/domain.js";
import type { MatchEdge } from "../../hooks/useTerminalData.js";
import { OddsPill } from "../shared/OddsPill.js";
import { QuantScoreBadge } from "../shared/QuantScoreBadge.js";

export interface MobileMatchCardProps {
  match: SanitizedMatch;
  edge?: MatchEdge;
  onClick: () => void;
}

export const MobileMatchCard = React.memo(function MobileMatchCard({
  match,
  edge,
  onClick,
}: MobileMatchCardProps) {
  const fmtKickoff = (d: Date) => {
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    return isToday
      ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
          " " +
          d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const bestEV = edge?.bestEV ?? 0;
  const hasGoldenEdge = bestEV >= 0.025;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 text-left transition-colors active:bg-zinc-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* Top row: time + league + edge badge */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500">
          {fmtKickoff(match.kickoff)}
        </span>
        {hasGoldenEdge && (
          <span className="rounded-md border border-emerald-700/60 bg-emerald-950/40 px-2 py-0.5 text-xs font-mono text-emerald-400">
            +{(bestEV * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {match.homeLogoUrl ? (
            <img
              src={match.homeLogoUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full"
            />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs font-mono text-zinc-500">
              {match.homeTeam[0]}
            </span>
          )}
          <span className="truncate text-sm font-mono font-medium text-zinc-100">
            {match.homeTeam}
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-600">vs</span>
        <div className="flex min-w-0 flex-1 items-center gap-2 justify-end">
          <span className="truncate text-sm font-mono font-medium text-zinc-100">
            {match.awayTeam}
          </span>
          {match.awayLogoUrl ? (
            <img
              src={match.awayLogoUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full"
            />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs font-mono text-zinc-500">
              {match.awayTeam[0]}
            </span>
          )}
        </div>
      </div>

      {/* Odds row */}
      {match.bookmakers.length > 0 && match.bookmakers[0].h2h ? (
        <div className="flex items-center justify-between gap-2">
          <QuantScoreBadge
            homeLambda={match.lambdas.home}
            awayLambda={match.lambdas.away}
            status={match.status}
          />
          <div className="flex gap-1.5">
            <OddsPill
              label="1"
              price={match.bookmakers[0].h2h.home}
              ev={edge?.homeEV}
            />
            <OddsPill
              label="X"
              price={match.bookmakers[0].h2h.draw}
              ev={edge?.drawEV}
            />
            <OddsPill
              label="2"
              price={match.bookmakers[0].h2h.away}
              ev={edge?.awayEV}
            />
          </div>
        </div>
      ) : (
        <QuantScoreBadge
          homeLambda={match.lambdas.home}
          awayLambda={match.lambdas.away}
          status={match.status}
        />
      )}
    </button>
  );
});
