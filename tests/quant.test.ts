import { describe, expect, it } from "vitest";

import {
  buildBivariatePoisson,
  devigShin,
  devigPower,
  calculateEV,
  calculateKellyStake,
  calculateHalfTimeMatrix,
  calculatePoissonTotals,
  calculateBrierScore,
} from "../src/core/math/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert that a number is within tolerance of an expected value. */
function near(actual: number, expected: number, tolerance = 1e-6): void {
  expect(actual, `expected ${actual} ≈ ${expected}`).toBeCloseTo(expected, Math.ceil(-Math.log10(tolerance)) + 2);
}

/** Assert sum of array entries equals 1 within tolerance. */
function sumNearArray(arr: number[], tolerance = 1e-5): void {
  const sum = arr.reduce((a, b) => a + b, 0);
  near(sum, 1.0, tolerance);
}

// ---------------------------------------------------------------------------
// 1. Bivariate Poisson Invariants
// ---------------------------------------------------------------------------

describe("buildBivariatePoisson", () => {
  const lambdaHome = 1.6;
  const lambdaAway = 1.1;
  const rho = -0.08;

  const result = buildBivariatePoisson(lambdaHome, lambdaAway, rho);

  it("matrix is 8×8", () => {
    expect(result.matrix.length).toBe(8);
    for (let x = 0; x < 8; x++) {
      expect(result.matrix[x].length).toBe(8);
    }
  });

  it("all matrix entries are finite and non-negative", () => {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const p = result.matrix[x][y];
        expect(Number.isFinite(p)).toBe(true);
        expect(p >= 0).toBe(true);
      }
    }
  });

  it("sum of all matrix entries ≈ 1.0", () => {
    let total = 0;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        total += result.matrix[x][y];
      }
    }
    near(total, 1.0, 1e-5);
  });

  it("homeWin + drawProb + awayWin ≈ 1.0", () => {
    const sum = result.homeWinProb + result.drawProb + result.awayWinProb;
    near(sum, 1.0, 1e-5);
  });

  it("overUnder thresholds sum to 1.0 each", () => {
    for (const [line, vals] of Object.entries(result.overUnder)) {
      const sum = vals.over + vals.under;
      near(sum, 1.0, 1e-5);
      expect(vals.over >= 0 && vals.over <= 1).toBe(true);
      expect(vals.under >= 0 && vals.under <= 1).toBe(true);
    }
  });

  it("BTTS yes + no = 1.0", () => {
    const sum = result.btts.yes + result.btts.no;
    near(sum, 1.0, 1e-5);
  });

  it("asianHandicap returns values in [0, 1]", () => {
    for (const line of [-1.5, -0.5, 0, 0.5, 1.5]) {
      const cover = result.asianHandicap(line);
      expect(cover >= 0 && cover <= 1).toBe(true);
      expect(Number.isFinite(cover)).toBe(true);
    }
  });

  it("Dixon-Coles (ρ=-0.08) boosts P(0,0) and P(1,1) vs independent Poisson (ρ=0)", () => {
    const dc = buildBivariatePoisson(lambdaHome, lambdaAway, -0.08);
    const ip = buildBivariatePoisson(lambdaHome, lambdaAway, 0);

    expect(dc.matrix[0][0]).toBeGreaterThan(ip.matrix[0][0]);
    expect(dc.matrix[1][1]).toBeGreaterThan(ip.matrix[1][1]);
  });

  it("Dixon-Coles P(1,0) and P(0,1) are lower than independent Poisson", () => {
    const dc = buildBivariatePoisson(lambdaHome, lambdaAway, -0.08);
    const ip = buildBivariatePoisson(lambdaHome, lambdaAway, 0);

    expect(dc.matrix[1][0]).toBeLessThan(ip.matrix[1][0]);
    expect(dc.matrix[0][1]).toBeLessThan(ip.matrix[0][1]);
  });

  it("sanity: home Win prob makes sense for λ_home > λ_away", () => {
    expect(result.homeWinProb).toBeGreaterThan(result.awayWinProb);
  });

  it("throws on non-positive lambdas", () => {
    expect(() => buildBivariatePoisson(0, 1.1, -0.08)).toThrow();
    expect(() => buildBivariatePoisson(-1, 1.1, -0.08)).toThrow();
  });

  it("throws on out-of-range rho", () => {
    expect(() => buildBivariatePoisson(1.6, 1.1, -1.5)).toThrow();
    expect(() => buildBivariatePoisson(1.6, 1.1, 1.5)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. De-vigging Accuracy
// ---------------------------------------------------------------------------

describe("devigShin", () => {
  it("output sums to 1.0 for real bookmaker odds [2.10, 3.40, 3.60]", () => {
    const result = devigShin([2.10, 3.40, 3.60]);
    const sum = result.pHome + result.pDraw + result.pAway;
    near(sum, 1.0, 1e-4);
  });

  it("returns probabilities in (0, 1)", () => {
    const r = devigShin([2.10, 3.40, 3.60]);
    expect(r.pHome > 0 && r.pHome < 1).toBe(true);
    expect(r.pDraw > 0 && r.pDraw < 1).toBe(true);
    expect(r.pAway > 0 && r.pAway < 1).toBe(true);
  });

  it("favorite has highest true probability", () => {
    // 1.50 is the shortest odd → strongest favorite
    const r = devigShin([1.50, 4.50, 5.00]);
    expect(r.pHome).toBeGreaterThan(r.pDraw);
    expect(r.pHome).toBeGreaterThan(r.pAway);
  });

  it("symmetric odds produce symmetric probabilities", () => {
    const r = devigShin([2.00, 3.50, 2.00]);
    near(r.pHome, r.pAway, 1e-6);
  });

  it("output sums to 1.0 for additional inputs", () => {
    const inputs: [number, number, number][] = [
      [1.85, 3.60, 3.80],
      [2.50, 3.20, 2.75],
      [1.40, 4.50, 6.00],
    ];
    for (const odds of inputs) {
      const r = devigShin(odds);
      const sum = r.pHome + r.pDraw + r.pAway;
      near(sum, 1.0, 1e-4);
    }
  });
});

describe("devigPower", () => {
  it("output sums to 1.0 for [1.90, 1.95]", () => {
    const result = devigPower([1.90, 1.95]);
    const sum = result.prob1 + result.prob2;
    near(sum, 1.0, 1e-4);
  });

  it("returns probabilities in (0, 1)", () => {
    const r = devigPower([1.90, 1.95]);
    expect(r.prob1 > 0 && r.prob1 < 1).toBe(true);
    expect(r.prob2 > 0 && r.prob2 < 1).toBe(true);
  });

  it("lower odds → higher probability", () => {
    const r = devigPower([1.50, 2.60]);
    expect(r.prob1).toBeGreaterThan(r.prob2);
  });

  it("symmetric odds produce equal probabilities", () => {
    const r = devigPower([1.90, 1.90]);
    near(r.prob1, 0.5, 1e-6);
    near(r.prob2, 0.5, 1e-6);
  });

  it("output sums to 1.0 for additional inputs", () => {
    const inputs: [number, number][] = [
      [2.10, 1.75],
      [1.45, 2.75],
      [3.00, 1.36],
    ];
    for (const odds of inputs) {
      const r = devigPower(odds);
      const sum = r.prob1 + r.prob2;
      near(sum, 1.0, 1e-4);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. EV & Staking Logic
// ---------------------------------------------------------------------------

describe("calculateEV", () => {
  it("returns +0.10 for P=0.55, Odds=2.00", () => {
    const ev = calculateEV(0.55, 2.00);
    near(ev, 0.10, 1e-6);
  });

  it("returns negative EV when fair prob is too low", () => {
    const ev = calculateEV(0.40, 2.00);
    expect(ev).toBeLessThan(0);
  });

  it("returns zero EV at fair price (P=0.50, Odds=2.00)", () => {
    const ev = calculateEV(0.50, 2.00);
    near(ev, 0.0, 1e-6);
  });

  it("returns -Infinity for invalid inputs", () => {
    expect(calculateEV(-0.1, 2.0)).toBe(-Infinity);
    expect(calculateEV(1.1, 2.0)).toBe(-Infinity);
    expect(calculateEV(0.5, 0.9)).toBe(-Infinity);
  });

  it("positive EV triggers when P × Odds > 1", () => {
    expect(calculateEV(0.60, 2.00)).toBeGreaterThan(0);
    expect(calculateEV(0.60, 1.50)).toBeLessThan(0);
  });
});

describe("calculateKellyStake", () => {
  it("returns 0 when EV is negative", () => {
    const stake = calculateKellyStake(0.40, 2.00);
    expect(stake).toBe(0);
  });

  it("returns 0 when EV is zero", () => {
    const stake = calculateKellyStake(0.50, 2.00);
    expect(stake).toBe(0);
  });

  it("returns positive stake when there is edge", () => {
    const stake = calculateKellyStake(0.55, 2.00);
    expect(stake).toBeGreaterThan(0);
  });

  it("quarter Kelly is 25% of full Kelly", () => {
    const fairProb = 0.60;
    const odds = 2.0;
    const full = calculateKellyStake(fairProb, odds, 1.0);
    const quarter = calculateKellyStake(fairProb, odds, 0.25);
    near(quarter, full * 0.25, 1e-6);
  });

  it("halves Kelly is 50% of full Kelly", () => {
    const fairProb = 0.60;
    const odds = 2.0;
    const full = calculateKellyStake(fairProb, odds, 1.0);
    const half = calculateKellyStake(fairProb, odds, 0.5);
    near(half, full * 0.5, 1e-6);
  });

  it("returns 0 for invalid inputs", () => {
    expect(calculateKellyStake(-0.1, 2.0)).toBe(0);
    expect(calculateKellyStake(1.1, 2.0)).toBe(0);
    expect(calculateKellyStake(0.5, 0.9)).toBe(0);
  });

  it("stake is bounded in [0, 1]", () => {
    for (const p of [0.51, 0.60, 0.70, 0.80, 0.90]) {
      for (const o of [1.5, 2.0, 3.0, 5.0]) {
        const stake = calculateKellyStake(p, o, 0.25);
        expect(stake >= 0 && stake <= 1).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Metrics
// ---------------------------------------------------------------------------

describe("calculateHalfTimeMatrix", () => {
  it("returns a 3×3 matrix", () => {
    const r = calculateHalfTimeMatrix(1.6, 1.1);
    expect(r.matrix.length).toBe(3);
    for (let i = 0; i < 3; i++) {
      expect(r.matrix[i].length).toBe(3);
    }
  });

  it("all entries sum to 1.0", () => {
    const r = calculateHalfTimeMatrix(1.6, 1.1);
    let total = 0;
    for (let ht = 0; ht < 3; ht++) {
      for (let ft = 0; ft < 3; ft++) {
        total += r.matrix[ht][ft];
      }
    }
    near(total, 1.0, 1e-5);
  });

  it("all entries are finite and non-negative", () => {
    const r = calculateHalfTimeMatrix(1.6, 1.1);
    for (let ht = 0; ht < 3; ht++) {
      for (let ft = 0; ft < 3; ft++) {
        expect(Number.isFinite(r.matrix[ht][ft])).toBe(true);
        expect(r.matrix[ht][ft] >= 0).toBe(true);
      }
    }
  });

  it("HT=Home, FT=Home is the most likely scenario when λ_home > λ_away", () => {
    const r = calculateHalfTimeMatrix(1.8, 1.0);
    let maxVal = 0;
    let maxCell = [0, 0] as [number, number];
    for (let ht = 0; ht < 3; ht++) {
      for (let ft = 0; ft < 3; ft++) {
        if (r.matrix[ht][ft] > maxVal) {
          maxVal = r.matrix[ht][ft];
          maxCell = [ht, ft];
        }
      }
    }
    expect(maxCell).toEqual([0, 0]);
  });

  it("throws on non-positive lambdas", () => {
    expect(() => calculateHalfTimeMatrix(0, 1.1)).toThrow();
    expect(() => calculateHalfTimeMatrix(-1, 1.1)).toThrow();
  });
});

describe("calculatePoissonTotals", () => {
  it("returns over + under = 1.0 for each line", () => {
    const result = calculatePoissonTotals(9.5, [8.5, 9.5, 10.5]);
    for (const [line, vals] of Object.entries(result)) {
      const sum = vals.over + vals.under;
      near(sum, 1.0, 1e-5);
    }
  });

  it("lower lines have higher over probability", () => {
    const result = calculatePoissonTotals(9.5, [7.5, 8.5, 9.5, 10.5]);
    const lines = Object.keys(result).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < lines.length; i++) {
      expect(result[lines[i]].over).toBeLessThanOrEqual(result[lines[i - 1]].over);
    }
  });

  it("throws on non-positive expectedMean", () => {
    expect(() => calculatePoissonTotals(0, [8.5])).toThrow();
    expect(() => calculatePoissonTotals(-1, [8.5])).toThrow();
  });

  it("produces sensible corner totals for mean=9.5", () => {
    const result = calculatePoissonTotals(9.5, [8.5, 9.5, 10.5]);
    // Over 8.5 should be > 0.5 (mean is 9.5)
    expect(result[8.5].over).toBeGreaterThan(0.5);
    // Over 10.5 should be < 0.5
    expect(result[10.5].over).toBeLessThan(0.5);
  });
});

describe("calculateBrierScore", () => {
  it("returns 0 for perfect predictions", () => {
    const preds: [number, number, number][] = [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 1.0],
    ];
    const outcomes: (0 | 1 | 2)[] = [0, 1, 2];
    const score = calculateBrierScore(preds, outcomes);
    near(score, 0.0, 1e-10);
  });

  it("returns > 0 for imperfect predictions", () => {
    const preds: [number, number, number][] = [
      [0.4, 0.3, 0.3],
      [0.3, 0.4, 0.3],
    ];
    const outcomes: (0 | 1 | 2)[] = [0, 1];
    const score = calculateBrierScore(preds, outcomes);
    expect(score).toBeGreaterThan(0);
  });

  it("returns NaN for mismatched lengths", () => {
    const score = calculateBrierScore([[0.5, 0.3, 0.2]], [0, 1]);
    expect(Number.isNaN(score)).toBe(true);
  });

  it("returns NaN for empty arrays", () => {
    const score = calculateBrierScore([], []);
    expect(Number.isNaN(score)).toBe(true);
  });

  it("score decreases with better predictions", () => {
    const bad: [number, number, number][] = [[0.34, 0.33, 0.33]];
    const good: [number, number, number][] = [[0.90, 0.05, 0.05]];
    const outcome: (0 | 1 | 2)[] = [0];
    expect(calculateBrierScore(good, outcome)).toBeLessThan(
      calculateBrierScore(bad, outcome),
    );
  });
});
