/**
 * SaansSaathi deterministic engine: every number shown to users (AQI, exposure, cost, CO2) is
 * computed here, never by the LLM. Unit-tested in saansEngine.test.ts.
 */
export { calculateCpcbAqi, getAqiBand } from './engine/aqi.js';
export {
  computeCommuteAlternatives,
  computeRoomCadr,
  computeWhatIfImpact,
  estimateBaselineIndoorPm25,
} from './engine/exposure.js';
export { detectInversionWarning, findBestAndWorstHours48 } from './engine/forecast.js';
export { buildDeterministicDailyPlan, buildSituationObject } from './engine/plan.js';
export { computeMemberRisks } from './engine/risk.js';
