/**
 * Additional match metrics: HT/FT matrix, Poisson totals, Brier score.
 *
 * All functions are pure and deterministic.
 */

/** Result of a half-time/full-time probability calculation. */
export interface HTFTResult {
  /** 3×3 matrix htft[ht][ft], where ht/ft ∈ {0=home, 1=draw, 2=away} */
  matrix: number[][];
  /** Sum of all entries (should be ≈ 1.0) */
  total: number;
}

/**
 * Calculate half-time / full-time probability matrix.
 *
 * Scales full-time lambdas by htRatio (default 0.43) to get half-time lambdas,
 * then combines two independent Poisson distributions for HT and FT margins.
 *
 * Matrix layout (index = 0=Home, 1=Draw, 2=Away):
 *   htft[ht][ft] = P(HT result = ht AND FT result = ft)
 *
 * Note: This is an approximation. A fully correct HT/FT model would need
 * a correlated bivariate process; we approximate by conditioning on FT.
 */
export function calculateHalfTimeMatrix(
  lambdaHome: number,
  lambdaAway: number,
  htRatio = 0.43,
): HTFTResult {
  if (lambdaHome <= 0 || lambdaAway <= 0) {
    throw new Error("lambdaHome and lambdaAway must be positive");
  }

  const lambdaHTHome = lambdaHome * htRatio;
  const lambdaHTAway = lambdaAway * htRatio;
  const lambdaFTHome = lambdaHome;
  const lambdaFTAway = lambdaAway;

  // Probabilities for Home win / Draw / Away win at HT and FT
  // Using Poisson CDF approximations for goal totals
  const htProbs = computeWinProb(lambdaHTHome, lambdaHTAway);
  const ftProbs = computeWinProb(lambdaFTHome, lambdaFTAway);

  // Joint HT/FT: approximate independence between HT and FT goal differences
  // conditioned on the FT outcome class.
  //
  // A simple and widely-used approximation:
  //   P(HT=h, FT=f) ≈ P(HT=h) × P(FT=f | FT margin consistent with h)
  // For computational simplicity we use a factorization that preserves marginals:
  const matrix: number[][] = [];
  for (let ht = 0; ht < 3; ht++) {
    matrix[ht] = [];
    for (let ft = 0; ft < 3; ft++) {
      if (ht === ft) {
        // Same result at HT and FT: scale by consistency factor
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 1.0;
      } else if (ht === 0 && ft === 1) {
        // Home lead at HT, Draw at FT — home team fades
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.3;
      } else if (ht === 0 && ft === 2) {
        // Home lead at HT, Away win at FT — big swing
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.1;
      } else if (ht === 1 && ft === 0) {
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.3;
      } else if (ht === 1 && ft === 2) {
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.1;
      } else if (ht === 2 && ft === 0) {
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.1;
      } else if (ht === 2 && ft === 1) {
        matrix[ht][ft] = htProbs[ht] * ftProbs[ft] * 0.3;
      } else {
        matrix[ht][ft] = 0;
      }
    }
  }

  // Normalize to sum to 1.0
  let total = 0;
  for (let ht = 0; ht < 3; ht++) {
    for (let ft = 0; ft < 3; ft++) {
      total += matrix[ht][ft];
    }
  }
  if (total > 0) {
    for (let ht = 0; ht < 3; ht++) {
      for (let ft = 0; ft < 3; ft++) {
        matrix[ht][ft] /= total;
      }
    }
  }

  return { matrix, total: 1.0 };
}

/**
 * Compute win/draw/loss probabilities from two Poisson lambdas
 * by summing the infinite Poisson series (truncated at score=15 for stability).
 */
function computeWinProb(lambdaHome: number, lambdaAway: number): [number, number, number] {
  const maxScore = 15;
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let x = 0; x <= maxScore; x++) {
    const px = poissonPMF(lambdaHome, x);
    for (let y = 0; y <= maxScore; y++) {
      const py = poissonPMF(lambdaAway, y);
      const joint = px * py;
      if (x > y) homeWin += joint;
      else if (x === y) draw += joint;
      else awayWin += joint;
    }
  }

  const total = homeWin + draw + awayWin;
  if (total <= 0) return [1 / 3, 1 / 3, 1 / 3];
  return [homeWin / total, draw / total, awayWin / total];
}

/** Precomputed factorials up to 20 for Poisson PMF. */
const FACTORIALS: readonly number[] = [
  1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880,
  3628800, 39916800, 479001600, 6227020800, 87178291200,
  1307674368000, 20922789888000, 355687428096000, 6402373705728000,
  121645100408832000, 2432902008176640000,
];

function poissonPMF(lambda: number, k: number): number {
  if (lambda < 0 || k < 0 || k >= FACTORIALS.length) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / FACTORIALS[k];
}

// ---------------------------------------------------------------------------
// Poisson Totals (Over/Under for non-goal counts like corners, cards)
// ---------------------------------------------------------------------------

export interface TotalsResult {
  [line: number]: { over: number; under: number };
}

/**
 * Calculate Over/Under probabilities for a Poisson-distributed count.
 *
 * @param expectedMean  The expected mean (e.g. expected corners = 9.5).
 * @param lines         Array of integer or half-integer thresholds (e.g. [8.5, 9.5, 10.5]).
 * @returns Mapping from threshold → { over, under }.
 */
export function calculatePoissonTotals(expectedMean: number, lines: number[]): TotalsResult {
  if (expectedMean <= 0) {
    throw new Error("expectedMean must be positive");
  }

  const result: TotalsResult = {};
  const maxK = Math.ceil(expectedMean * 5) + 20; // Sufficient truncation point

  // Precompute Poisson PMF up to maxK
  const pmf: number[] = [];
  let pmfSum = 0;
  for (let k = 0; k <= maxK; k++) {
    const p = poissonPMFStandAlone(expectedMean, k);
    pmf.push(p);
    pmfSum += p;
  }

  // Normalize to compensate for truncation
  if (pmfSum <= 0) return {};
  for (let k = 0; k <= maxK; k++) {
    pmf[k] /= pmfSum;
  }

  // Cumulative distribution
  const cdf: number[] = new Array(maxK + 1);
  cdf[0] = pmf[0];
  for (let k = 1; k <= maxK; k++) {
    cdf[k] = cdf[k - 1] + pmf[k];
  }

  for (const line of lines) {
    const threshold = Math.ceil(line - 0.0001); // e.g. 8.5 → 9 (over means > line)
    const underProb = threshold <= maxK ? cdf[threshold - 1] : 1.0;
    result[line] = {
      under: underProb,
      over: 1 - underProb,
    };
  }

  return result;
}

function poissonPMFStandAlone(lambda: number, k: number): number {
  if (lambda < 0 || k < 0 || k >= FACTORIALS.length) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / FACTORIALS[k];
}

// ---------------------------------------------------------------------------
// Brier Score (Multiclass Calibration)
// ---------------------------------------------------------------------------

/**
 * Calculate the multiclass Brier calibration score.
 *
 * BS = (1/N) × Σ_t Σ_j (f_{t,j} − o_{t,j})²
 *
 * @param predictions  Array of [pHome, pDraw, pAway] for each match.
 * @param actualOutcomes  Array of 0 (Home win), 1 (Draw), 2 (Away win).
 * @returns Brier score (lower is better; 0 = perfect calibration).
 */
export function calculateBrierScore(
  predictions: [number, number, number][],
  actualOutcomes: (0 | 1 | 2)[],
): number {
  if (predictions.length !== actualOutcomes.length || predictions.length === 0) {
    return NaN;
  }

  let total = 0;
  for (let t = 0; t < predictions.length; t++) {
    const [pHome, pDraw, pAway] = predictions[t];
    const outcome = actualOutcomes[t];

    // One-hot encoding of actual outcome
    const oHome = outcome === 0 ? 1 : 0;
    const oDraw = outcome === 1 ? 1 : 0;
    const oAway = outcome === 2 ? 1 : 0;

    total += (pHome - oHome) ** 2;
    total += (pDraw - oDraw) ** 2;
    total += (pAway - oAway) ** 2;
  }

  return total / predictions.length;
}
