/**
 * Dixon-Coles adjusted Bivariate Poisson model.
 *
 * Builds an 8×8 score probability matrix P(x, y) for x,y ∈ [0..7],
 * applies the τ_ρ correction factor on low-score cells, and derives
 * market probabilities (1X2, Over/Under, BTTS, Asian Handicap).
 */

export interface ScoreProbMatrix {
  /** 8×8 matrix, matrix[x][y] = P(HomeGoals=x, AwayGoals=y) */
  matrix: number[][];
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  overUnder: Record<number, { over: number; under: number }>;
  btts: { yes: number; no: number };
  asianHandicap: (line: number) => number;
}

const MAX_SCORE = 8;

/** Precomputed factorials 0!..7! for numerical stability. */
const FACTORIALS: readonly number[] = [
  1, 1, 2, 6, 24, 120, 720, 5040,
];

/** Poisson PMF: P(X=k) = λ^k e^{-λ} / k! */
function poissonPMF(lambda: number, k: number): number {
  if (lambda < 0 || k < 0 || k > 7) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / FACTORIALS[k];
}

/**
 * Dixon-Coles low-score adjustment factor τ_ρ(x, y).
 *
 *   ρ = 0  → independent Poisson (τ = 1 everywhere)
 *   ρ < 0  → boosts probability of low-scoring draws (0,0) and (1,1)
 *
 * Formula from Dixon & Coles (1997):
 *   τ(0,0) = 1 - λ1·λ2·ρ
 *   τ(1,0) = 1 + λ2·ρ
 *   τ(0,1) = 1 + λ1·ρ
 *   τ(1,1) = 1 - ρ
 *   τ(others) = 1.0
 */
function tauRho(lambdaHome: number, lambdaAway: number, rho: number, x: number, y: number): number {
  if (x === 0 && y === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (x === 1 && y === 0) return 1 + lambdaAway * rho;
  if (x === 0 && y === 1) return 1 + lambdaHome * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1.0;
}

/**
 * Build the full Dixon-Coles bivariate Poisson probability matrix and derive markets.
 */
export function buildBivariatePoisson(
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
): ScoreProbMatrix {
  // Guard against nonsensical inputs
  if (lambdaHome <= 0 || lambdaAway <= 0) {
    throw new Error("lambdaHome and lambdaAway must be positive");
  }
  if (rho < -1 || rho > 1) {
    throw new Error("rho must be in [-1, 1]");
  }

  // Step 1: Raw unnormalized matrix
  const raw: number[][] = [];
  for (let x = 0; x < MAX_SCORE; x++) {
    raw[x] = [];
    for (let y = 0; y < MAX_SCORE; y++) {
      const independent = poissonPMF(lambdaHome, x) * poissonPMF(lambdaAway, y);
      const adjustment = tauRho(lambdaHome, lambdaAway, rho, x, y);
      raw[x][y] = independent * adjustment;
    }
  }

  // Step 2: Normalize so the full matrix sums to exactly 1.0
  let total = 0;
  for (let x = 0; x < MAX_SCORE; x++) {
    for (let y = 0; y < MAX_SCORE; y++) {
      total += raw[x][y];
    }
  }
  if (total <= 0) {
    throw new Error("Normalized matrix sum is non-positive");
  }

  const matrix: number[][] = [];
  for (let x = 0; x < MAX_SCORE; x++) {
    matrix[x] = [];
    for (let y = 0; y < MAX_SCORE; y++) {
      matrix[x][y] = raw[x][y] / total;
    }
  }

  // Step 3: Derive market probabilities
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let bttsYes = 0;

  const overUnderLines = [1.5, 2.5, 3.5];
  const overUnder: Record<number, { over: number; under: number }> = {};
  for (const line of overUnderLines) {
    overUnder[line] = { over: 0, under: 0 };
  }

  for (let x = 0; x < MAX_SCORE; x++) {
    for (let y = 0; y < MAX_SCORE; y++) {
      const p = matrix[x][y];
      const totalGoals = x + y;

      if (x > y) homeWinProb += p;
      else if (x === y) drawProb += p;
      else awayWinProb += p;

      if (x >= 1 && y >= 1) bttsYes += p;

      for (const line of overUnderLines) {
        if (totalGoals > line) overUnder[line].over += p;
        else overUnder[line].under += p;
      }
    }
  }

  const bttsNo = 1 - bttsYes;

  // Asian Handicap cover probability: P(home - away + line > 0)
  const asianHandicap = (line: number): number => {
    let cover = 0;
    for (let x = 0; x < MAX_SCORE; x++) {
      for (let y = 0; y < MAX_SCORE; y++) {
        if (x - y + line > 0) {
          cover += matrix[x][y];
        }
      }
    }
    return cover;
  };

  return {
    matrix,
    homeWinProb,
    drawProb,
    awayWinProb,
    overUnder,
    btts: { yes: bttsYes, no: bttsNo },
    asianHandicap,
  };
}
