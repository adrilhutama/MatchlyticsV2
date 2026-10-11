/**
 * De-vigging (margin removal) engine.
 *
 * Two algorithms:
 *  - Shin's Method for 3-way (1X2) markets.
 *  - Power Method (log-odds) for 2-way markets (Over/Under, Spreads).
 *
 * Both return normalized probabilities summing to exactly 1.0.
 */

export interface DevigResult3Way {
  pHome: number;
  pDraw: number;
  pAway: number;
}

export interface DevigResult2Way {
  prob1: number;
  prob2: number;
}

const MAX_ITERATIONS = 1000;
const PRECISION = 1e-10;

// ---------------------------------------------------------------------------
// Shin's Method — 3-Way Markets (1X2)
// ---------------------------------------------------------------------------
// Solves for the insider-trading proportion z via bisection:
//   Σ sqrt(z² + 4(1-z)·π_i² / Σπ) = 2 - z
// where π_i = 1/odd_i (implied probabilities from bookmaker odds).
// ---------------------------------------------------------------------------

function shinEquation(z: number, implied: number[]): number {
  const sumImplied = implied.reduce((a, b) => a + b, 0);
  let lhs = 0;
  for (const pi of implied) {
    const inside = z * z + 4 * (1 - z) * (pi * pi) / sumImplied;
    lhs += Math.sqrt(Math.max(0, inside));
  }
  return lhs - (2 - z);
}

/**
 * Remove vig from 3-way bookmaker odds using Shin's method.
 * @param odds Array of [homeOdd, drawOdd, awayOdd], each > 1.
 * @returns Normalized true probabilities [pHome, pDraw, pAway].
 */
export function devigShin(odds: [number, number, number]): DevigResult3Way {
  const implied: number[] = odds.map((o) => 1 / o);

  // Fallback: proportional normalization
  const sumImplied = implied.reduce((a, b) => a + b, 0);
  const fallback: DevigResult3Way = {
    pHome: implied[0] / sumImplied,
    pDraw: implied[1] / sumImplied,
    pAway: implied[2] / sumImplied,
  };

  // Binary search for z ∈ [0, 1)
  let lo = 0;
  let hi = 1 - PRECISION;
  let fLo = shinEquation(lo, implied);
  const fHi = shinEquation(hi, implied);

  if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) {
    return fallback;
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const fMid = shinEquation(mid, implied);
    if (!isFinite(fMid)) break;
    if (Math.abs(fMid) < PRECISION) {
      lo = mid;
      break;
    }
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }

  const z = lo;

  // Convert z back to true probabilities
  const normalized = implied.map((pi) => {
    const piNorm = pi / sumImplied;
    return Math.sqrt(z * z + 4 * (1 - z) * piNorm * piNorm);
  });
  const zSum = normalized.reduce((a, b) => a + b, 0);

  return {
    pHome: normalized[0] / zSum,
    pDraw: normalized[1] / zSum,
    pAway: normalized[2] / zSum,
  };
}

// ---------------------------------------------------------------------------
// Power Method — 2-Way Markets (Over/Under, Spreads)
// ---------------------------------------------------------------------------
// Finds exponent k such that Σ (1/odd_i)^k = 1.0, then returns
// prob_i = (1/odd_i)^k / Σ(1/odd_j)^k  (which simplifies to just (1/odd_i)^k
// because the sum is already 1.0 by construction).
// ---------------------------------------------------------------------------

function powerEquation(k: number, odds: [number, number]): number {
  return Math.pow(1 / odds[0], k) + Math.pow(1 / odds[1], k) - 1;
}

/**
 * Remove vig from 2-way bookmaker odds using the Power Method.
 * @param odds Array of [odd1, odd2], each > 1.
 * @returns { prob1, prob2 } normalized probabilities summing to 1.0.
 */
export function devigPower(odds: [number, number]): DevigResult2Way {
  // Edge case: invalid odds
  if (odds[0] <= 1 || odds[1] <= 1 || !isFinite(odds[0]) || !isFinite(odds[1])) {
    return { prob1: 0.5, prob2: 0.5 };
  }

  const inv1 = 1 / odds[0];
  const inv2 = 1 / odds[1];

  // Fallback: proportional normalization
  const sumInv = inv1 + inv2;
  const fallback: DevigResult2Way = {
    prob1: inv1 / sumInv,
    prob2: inv2 / sumInv,
  };

  // k=1 gives sum = inv1 + inv2 (>1 with vig). We need k>1 to bring sum to 1.
  // At k→∞, sum → max(inv1, inv2) < 1 (since both inv < 1).
  // So there is a unique k in (1, ∞).
  let lo = 1.0;
  let hi = 100.0;

  // Expand hi until equation is negative
  while (powerEquation(hi, odds) > 0 && hi < 1e12) {
    hi *= 2;
  }

  let fLo = powerEquation(lo, odds);
  const fHi = powerEquation(hi, odds);

  if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) {
    return fallback;
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const fMid = powerEquation(mid, odds);
    if (!isFinite(fMid)) break;
    if (Math.abs(fMid) < PRECISION) {
      lo = mid;
      break;
    }
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }

  const k = lo;
  const p1 = Math.pow(inv1, k);
  const p2 = Math.pow(inv2, k);
  const total = p1 + p2;

  return {
    prob1: total > 0 ? p1 / total : 0.5,
    prob2: total > 0 ? p2 / total : 0.5,
  };
}
