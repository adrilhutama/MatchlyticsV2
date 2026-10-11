/**
 * Expected Value & Bankroll Sizing engine.
 *
 * Implements:
 *  - calculateEV:          Fair-probability × odds − 1
 *  - calculateKellyStake:  Fractional Kelly criterion (default Quarter Kelly)
 */

/**
 * Expected value of a bet given a fair (true) probability and bookmaker odds.
 *
 * EV = (fairProb × bookmakerOdd) − 1
 *
 * @param fairProb  The model's estimated true probability (0..1).
 * @param bookmakerOdd  Decimal odds offered by the bookmaker (> 1).
 * @returns EV as a decimal fraction (e.g. 0.10 means +10% expected return).
 */
export function calculateEV(fairProb: number, bookmakerOdd: number): number {
  if (fairProb < 0 || fairProb > 1 || bookmakerOdd <= 1) return -Infinity;
  return fairProb * bookmakerOdd - 1;
}

/**
 * Fractional Kelly stake fraction.
 *
 * Full Kelly:  f* = (b·P − q) / b,   where b = odds − 1, q = 1 − P
 * Fractional: stake = f* × fraction   (clamped to ≥ 0)
 *
 * @param fairProb  The model's estimated true probability (0..1).
 * @param bookmakerOdd  Decimal odds offered by the bookmaker (> 1).
 * @param fraction  Kelly fraction; default 0.25 (Quarter Kelly).
 * @returns Stake fraction of bankroll (0..1), or 0 if no edge.
 */
export function calculateKellyStake(
  fairProb: number,
  bookmakerOdd: number,
  fraction = 0.25,
): number {
  if (fairProb < 0 || fairProb > 1 || bookmakerOdd <= 1) return 0;
  if (fraction <= 0 || fraction > 1) return 0;

  const b = bookmakerOdd - 1;
  const q = 1 - fairProb;
  const fullKelly = (b * fairProb - q) / b;

  return Math.max(0, fullKelly * fraction);
}
