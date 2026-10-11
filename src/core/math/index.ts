/**
 * Quant Math Core — Public API
 *
 * Re-exports all types and functions from sub-modules.
 */

export type { ScoreProbMatrix } from "./bivariate-poisson.js";
export { buildBivariatePoisson } from "./bivariate-poisson.js";

export type { DevigResult3Way, DevigResult2Way } from "./devig.js";
export { devigShin, devigPower } from "./devig.js";

export { calculateEV, calculateKellyStake } from "./ev-engine.js";

export type { HTFTResult } from "./metrics.js";
export {
  calculateHalfTimeMatrix,
  calculatePoissonTotals,
  calculateBrierScore,
} from "./metrics.js";
