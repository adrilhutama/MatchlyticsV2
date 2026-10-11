import React from "react";
import { TierGate } from "@features/auth/components/TierGate.js";
import { buildBivariatePoisson } from "@core/math/index.js";
import type { SanitizedMatch } from "@core/types/domain.js";

const MAX_SCORE = 8;

export interface MobileInspectorMatrixTabProps {
  match: SanitizedMatch;
}

export function MobileInspectorMatrixTab({ match }: MobileInspectorMatrixTabProps) {
  const matrix = buildBivariatePoisson(
    match.lambdas.home,
    match.lambdas.away,
    match.lambdas.cov,
  );

  // Top 3 scores by probability
  const scoreProbs: { score: string; prob: number }[] = [];
  for (let x = 0; x < MAX_SCORE; x++) {
    for (let y = 0; y < MAX_SCORE; y++) {
      scoreProbs.push({ score: `${x}-${y}`, prob: matrix.matrix[x][y] });
    }
  }
  scoreProbs.sort((a, b) => b.prob - a.prob);
  const topScores = scoreProbs.slice(0, 3);

  return (
    <TierGate
      fallbackTitle="Dixon-Coles Matrix Locked"
      fallbackDescription="Upgrade to Pro to view the full score probability matrix."
      blurIntensity="sm"
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="mb-3 text-xs font-mono text-zinc-400">
          8×8 Score Probability Matrix
        </p>

        {/* Matrix grid */}
        <div className="mb-4 grid grid-cols-8 gap-0.5">
          {Array.from({ length: MAX_SCORE }, (_, y) =>
            Array.from({ length: MAX_SCORE }, (_, x) => {
              const p = matrix.matrix[x][y];
              const intensity = Math.min(1, p * 8);
              return (
                <div
                  key={`${x}-${y}`}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: `rgba(16, 185, 129, ${intensity * 0.8})`,
                    border: `1px solid rgba(16, 185, 129, ${intensity * 0.3})`,
                  }}
                  title={`${x}-${y}: ${(p * 100).toFixed(1)}%`}
                />
              );
            }),
          ).flat()}
        </div>

        {/* Top scores */}
        <p className="mb-2 text-xs font-mono text-zinc-400">
          Most Likely Scores
        </p>
        <div className="space-y-1">
          {topScores.map(({ score, prob }) => (
            <div
              key={score}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/50 px-2 py-1"
            >
              <span className="text-xs font-mono text-zinc-300">{score}</span>
              <span className="text-xs font-mono text-emerald-400">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </TierGate>
  );
}
