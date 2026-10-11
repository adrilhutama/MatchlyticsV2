import React from "react";
import { TierGate } from "@features/auth/components/TierGate.js";
import {
  calculateHalfTimeMatrix,
  calculatePoissonTotals,
} from "@core/math/index.js";
import type { SanitizedMatch } from "@core/types/domain.js";

export interface MobileInspectorProjectionsTabProps {
  match: SanitizedMatch;
}

export function MobileInspectorProjectionsTab({
  match,
}: MobileInspectorProjectionsTabProps) {
  const htft = calculateHalfTimeMatrix(match.lambdas.home, match.lambdas.away);
  const cornerTotals = calculatePoissonTotals(match.metrics.expectedCorners, [
    8.5, 9.5, 10.5,
  ]);
  const cardTotals = calculatePoissonTotals(match.metrics.expectedCards, [
    3.5, 4.5,
  ]);

  return (
    <div className="space-y-3">
      {/* Corners */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="mb-2 text-xs font-mono text-zinc-400">
          Expected Corners: {match.metrics.expectedCorners}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[8.5, 9.5, 10.5].map((line) => (
            <div
              key={line}
              className="text-center rounded-md border border-zinc-800 bg-zinc-950/50 p-2"
            >
              <p className="text-xs font-mono text-zinc-500">O/U {line}</p>
              <p className="text-xs font-mono text-emerald-400">
                Over{" "}
                {((cornerTotals[line as 8.5 | 9.5 | 10.5]?.over ?? 0.5) * 100).toFixed(
                  0,
                )}
                %
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="mb-2 text-xs font-mono text-zinc-400">
          Expected Cards: {match.metrics.expectedCards}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[3.5, 4.5].map((line) => (
            <div
              key={line}
              className="text-center rounded-md border border-zinc-800 bg-zinc-950/50 p-2"
            >
              <p className="text-xs font-mono text-zinc-500">O/U {line}</p>
              <p className="text-xs font-mono text-emerald-400">
                Over{" "}
                {((cardTotals[line as 3.5 | 4.5]?.over ?? 0.5) * 100).toFixed(0)}
                %
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* HT/FT */}
      <TierGate
        fallbackTitle="HT/FT Locked"
        fallbackDescription="Upgrade to Pro for half-time/full-time projections."
        blurIntensity="sm"
      >
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-xs font-mono text-zinc-400">
            Half-Time / Full-Time
          </p>
          <div className="grid grid-cols-3 gap-1">
            {["H", "D", "A"].map((ht, i) =>
              ["H", "D", "A"].map((ft, j) => {
                const prob = htft.matrix[i]?.[j] ?? 0;
                return (
                  <div
                    key={`${ht}-${ft}`}
                    className="rounded border border-zinc-800 bg-zinc-950/50 p-1.5 text-center"
                  >
                    <p className="text-xs font-mono text-zinc-500">
                      {ht}/{ft}
                    </p>
                    <p className="text-xs font-mono text-emerald-400">
                      {(prob * 100).toFixed(1)}%
                    </p>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </TierGate>
    </div>
  );
}
