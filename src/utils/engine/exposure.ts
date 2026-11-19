/** Exposure, purifier sizing, commute and What-If impact maths (all assumptions documented in the README). */
import type {
  AirSnapshot,
  CommuteMode,
  CommuteOptionComparison,
  ImpactReport,
  SaansProfile,
  WhatIfInputs,
} from '../../types/saans.js';

/** Required clean-air delivery rate per sq ft: ~5 air changes/hour at an 8.5 ft ceiling. */
export const CADR_M3H_PER_SQFT = 1.35;
const ROOM_SQFT = { min: 40, max: 1200 };

/** Daily breathing volume: ~20 h indoors and ~4 h commuting/outdoors, 15 m³ in total. */
const BREATHING_M3 = { indoor: 12.5, outdoor: 2.5 };
const DAILY_BREATHING_M3 = BREATHING_M3.indoor + BREATHING_M3.outdoor;

/** Real-world filtration of a well-fitted N95 respirator. */
const N95_FILTRATION = 0.85;
/** Indoor PM2.5 reduction from running a HEPA purifier all 24 hours. */
const PURIFIER_MAX_REDUCTION = 0.58;
/** Indoor PM2.5 reduction from chimney use, draft sealing and no incense. */
const CLEAN_COOKING_SEAL_REDUCTION = 0.28;
/** Berkeley Earth rule of thumb: ~22 µg/m³ for 24 h (≈330 µg inhaled) ≈ 1 cigarette. */
const UG_INHALED_PER_CIGARETTE = 330;
const WEEKS_PER_MONTH = 4.3;

interface CommuteBenchmark {
  label: string;
  inrPerKm: number;
  speedKmh: number;
  co2GPerKm: number;
  /** Commuter PM2.5 relative to ambient (in-cabin filtering vs. roadside exposure). */
  pmFactor: number;
}

/** Indian urban transport benchmarks used by the commute comparison and the What-If simulator. */
const COMMUTE_BENCHMARKS: Record<CommuteMode, CommuteBenchmark> = {
  car: { label: 'Solo Petrol Car', inrPerKm: 11.5, speedKmh: 22, co2GPerKm: 175, pmFactor: 0.95 },
  bike: { label: 'Petrol Two-Wheeler', inrPerKm: 3.4, speedKmh: 27, co2GPerKm: 62, pmFactor: 1.45 },
  carpool: { label: '3-Person Carpool', inrPerKm: 4.0, speedKmh: 21, co2GPerKm: 58, pmFactor: 0.9 },
  metro: { label: 'Electric Metro + Walk', inrPerKm: 3.2, speedKmh: 34, co2GPerKm: 28, pmFactor: 0.62 },
  bus: { label: 'AC Electric / CNG Bus', inrPerKm: 2.2, speedKmh: 20, co2GPerKm: 42, pmFactor: 0.78 },
  cycle: { label: 'Cycle (Low-AQI Days)', inrPerKm: 0.4, speedKmh: 15, co2GPerKm: 0, pmFactor: 1.55 },
  walk: { label: 'Walk (Short Trips)', inrPerKm: 0, speedKmh: 5, co2GPerKm: 0, pmFactor: 1.25 },
};
const COMPARED_MODES: CommuteMode[] = ['car', 'metro', 'carpool', 'bus', 'bike', 'cycle'];

const round1 = (value: number) => Math.round(value * 10) / 10;

export function computeRoomCadr(roomSqFt: number): number {
  const safeSqFt = Math.max(ROOM_SQFT.min, Math.min(ROOM_SQFT.max, roomSqFt));
  return Math.round(safeSqFt * CADR_M3H_PER_SQFT);
}

export function estimateBaselineIndoorPm25(outdoorPm25: number, profile: SaansProfile): number {
  let infiltration = profile.homeType === 'flat' ? 0.62 : 0.72;
  if (profile.windowExposure === 'main_road') infiltration += 0.08;
  if (profile.windowExposure === 'park_facing') infiltration -= 0.06;
  if (profile.floorNumber >= 6) infiltration -= 0.04;
  if (profile.hasPurifier) infiltration *= 0.56;

  let indoorAdditions = 0;
  if (profile.cookingFuel === 'lpg') indoorAdditions += 11;
  if (profile.cookingFuel === 'biomass') indoorAdditions += 38;
  if (profile.heating === 'wood_coal') indoorAdditions += 32;

  return Math.max(5, Math.round((outdoorPm25 * Math.max(0.25, infiltration) + indoorAdditions) * 10) / 10);
}

export function computeCommuteAlternatives(
  distanceOneWayKm: number,
  currentMode: CommuteMode,
  outdoorPm25: number,
  wfhDaysPerWeek: number
): CommuteOptionComparison[] {
  const commuteDaysPerMonth = Math.max(4, Math.round((5 - Math.min(4, wfhDaysPerWeek)) * WEEKS_PER_MONTH));
  const roundTripKm = Math.max(2, distanceOneWayKm * 2);

  const currentSpec = COMMUTE_BENCHMARKS[currentMode] ?? COMMUTE_BENCHMARKS.car;
  const currentMonthlyCost = Math.round(roundTripKm * currentSpec.inrPerKm * commuteDaysPerMonth);
  const currentMonthlyCo2Kg = (roundTripKm * currentSpec.co2GPerKm * commuteDaysPerMonth) / 1000;

  return COMPARED_MODES.map((mode) => {
    const s = COMMUTE_BENCHMARKS[mode];
    const monthlyCostInr = Math.round(roundTripKm * s.inrPerKm * commuteDaysPerMonth);
    const monthlyCo2Kg = (roundTripKm * s.co2GPerKm * commuteDaysPerMonth) / 1000;
    const oneWayMins = Math.max(8, Math.round((distanceOneWayKm / s.speedKmh) * 60));
    const commutePm25UgM3 = Math.round(outdoorPm25 * s.pmFactor * 10) / 10;

    return {
      mode,
      label: s.label,
      monthlyCostInr,
      monthlySavingsInr: Math.max(0, currentMonthlyCost - monthlyCostInr),
      oneWayMins,
      commutePm25UgM3,
      monthlyCo2SavedKg: Math.max(0, Math.round((currentMonthlyCo2Kg - monthlyCo2Kg) * 10) / 10),
      isCurrent: mode === currentMode,
      recommended:
        outdoorPm25 > 120
          ? mode === 'metro' || mode === 'carpool'
          : mode === 'metro' || mode === 'bus' || (distanceOneWayKm <= 6 && mode === 'cycle'),
    };
  });
}

/** "How we calculated this" explainer, generated from the same constants the maths uses. */
const FORMULA_EXPLAINERS: ImpactReport['formulas'] = [
  {
    name: '24-Hour Exposure & Dose Model',
    formula: `Daily Inhaled PM2.5 (µg) = (Indoor PM2.5 × ${BREATHING_M3.indoor} m³) + (Commute PM2.5 × (1 − MaskEff) × ${BREATHING_M3.outdoor} m³)`,
    assumption: `Assumes ${DAILY_BREATHING_M3} m³/day average breathing volume (20h indoor, 4h commute/outdoors). Fitted N95 filtration efficiency = ${N95_FILTRATION * 100}% real-world seal.`,
  },
  {
    name: 'Cigarette-Equivalent (Approximation)',
    formula: `Cigarettes/week ≈ (Daily Inhaled PM2.5 Avoided × 7) ÷ ${UG_INHALED_PER_CIGARETTE} µg`,
    assumption:
      'Based on Berkeley Earth rule of thumb: ~22 µg/m³ PM2.5 for 24 hours (330 µg inhaled) ≈ 1 cigarette. Explicitly an epidemiological approximation, not medical advice.',
  },
  {
    name: 'CO₂ & Monthly INR Savings',
    formula: 'Savings = RoundTripKm × CommuteDays/mo × (BaselineFactor − ChosenModeFactor)',
    assumption:
      'Uses Indian urban benchmarks: Petrol car ₹11.5/km & 175g CO₂/km; Metro ₹3.2/km & 28g CO₂/km; Carpool (3x) ₹4.0/km & 58g CO₂/km; Bus ₹2.2/km & 42g CO₂/km.',
  },
  {
    name: 'Purifier CADR Room Sizing',
    formula: `Required CADR (m³/h) = Room Area (sq ft) × ${CADR_M3H_PER_SQFT}`,
    assumption:
      'Targets 4.8–5 Air Changes per Hour (ACH) for a standard 8.5 ft Indian apartment ceiling during severe smog.',
  },
];

/** Smog Score points: protective habits, low-emission transport and completed plan actions (max 100). */
const SMOG_SCORE = {
  purifierMax: 28,
  maskMax: 24,
  cleanCooking: 18,
  recommendedCommute: 16,
  otherCommute: 6,
  perCompletedAction: 3.5,
  completedActionsMax: 14,
  floor: 12,
};
/** Monthly savings from switching to covered/electric cooking and sealing drafts. */
const CLEAN_COOKING_SAVINGS = { co2Kg: 18, inr: 380 };
/** Projected indoor PM2.5 never drops below this: no home is perfectly sealed. */
const MIN_INDOOR_PM25 = 6;
/** Exposure-cut percentages are capped to stay within what the evidence supports. */
const MAX_EXPOSURE_CUT_PCT = 92;
const TOP3_CUT_RANGE = { min: 25, max: 88, whenNoBaseline: 54 };
/** "Three things" benchmark: ~12 h purifier (65% of max effect), N95 worn 90% of outdoor time. */
const TOP3_PURIFIER_EFFECT = 0.65;
const TOP3_MASK_COMPLIANCE = 0.9;

const TREND_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
/** Illustrative climb towards today's score (deterministic, so the chart is stable between renders). */
const TREND_OFFSETS = [-18, -14, -10, -7, -4, -2, 0];

/** PM2.5 inhaled over a day (µg) for given indoor and commute/outdoor concentrations. */
function dailyDoseUg(indoorPm25: number, outdoorPm25: number): number {
  return indoorPm25 * BREATHING_M3.indoor + outdoorPm25 * BREATHING_M3.outdoor;
}

function projectIndoorPm25(baselineIndoorPm25: number, whatIf: WhatIfInputs): number {
  const purifierFactor = (Math.min(24, Math.max(0, whatIf.purifierHours)) / 24) * PURIFIER_MAX_REDUCTION;
  const cookingSealFactor = whatIf.cleanCookingAndSeal ? CLEAN_COOKING_SEAL_REDUCTION : 0;
  return Math.max(MIN_INDOOR_PM25, round1(baselineIndoorPm25 * (1 - purifierFactor) * (1 - cookingSealFactor)));
}

function smogScore(whatIf: WhatIfInputs, commuteRecommended: boolean, completedActions: number): number {
  const points =
    (whatIf.purifierHours / 24) * SMOG_SCORE.purifierMax +
    (whatIf.maskCompliancePct / 100) * SMOG_SCORE.maskMax +
    (whatIf.cleanCookingAndSeal ? SMOG_SCORE.cleanCooking : 0) +
    (commuteRecommended ? SMOG_SCORE.recommendedCommute : SMOG_SCORE.otherCommute) +
    Math.min(SMOG_SCORE.completedActionsMax, completedActions * SMOG_SCORE.perCompletedAction);
  return Math.max(SMOG_SCORE.floor, Math.min(100, Math.round(points)));
}

function weeklyTrend(score: number, avgPm25Before: number): ImpactReport['weeklyTrend'] {
  return TREND_DAYS.map((day, idx) => {
    const dayScore = Math.max(18, Math.min(100, score + TREND_OFFSETS[idx]));
    return {
      day,
      score: dayScore,
      exposureUg: Math.max(12, Math.round(avgPm25Before * (1 - (dayScore / 100) * 0.68))),
    };
  });
}

/** Exposure cut if the household adopts the three headline habits (metro, purifier + clean cooking, N95). */
function topThreeHabitsCutPct(baselineIndoorPm25: number, outdoorPm25: number, dailyBeforeUg: number): number {
  if (dailyBeforeUg <= 0) return TOP3_CUT_RANGE.whenNoBaseline;
  const indoorAfter = Math.max(
    MIN_INDOOR_PM25,
    baselineIndoorPm25 * (1 - PURIFIER_MAX_REDUCTION * TOP3_PURIFIER_EFFECT) * (1 - CLEAN_COOKING_SEAL_REDUCTION)
  );
  const outdoorAfter = outdoorPm25 * COMMUTE_BENCHMARKS.metro.pmFactor * (1 - N95_FILTRATION * TOP3_MASK_COMPLIANCE);
  const cut = Math.round(((dailyBeforeUg - dailyDoseUg(indoorAfter, outdoorAfter)) / dailyBeforeUg) * 100);
  return Math.min(TOP3_CUT_RANGE.max, Math.max(TOP3_CUT_RANGE.min, cut));
}

/**
 * What-If simulator: projects the household's daily PM2.5 dose, Smog Score and monthly CO2/INR
 * savings for the chosen commute, purifier hours, mask use and clean-cooking habits.
 */
export function computeWhatIfImpact(
  profile: SaansProfile,
  air: AirSnapshot,
  whatIf: WhatIfInputs,
  completedActionsCount: number
): ImpactReport {
  const baselineIndoorPm25 = estimateBaselineIndoorPm25(air.pm25, profile);
  const projectedIndoorPm25 = projectIndoorPm25(baselineIndoorPm25, whatIf);

  const commuteOptions = computeCommuteAlternatives(
    profile.commuteDistanceKm,
    profile.commuteMode,
    air.pm25,
    profile.wfhDaysPerWeek
  );
  const currentCommute = commuteOptions.find((c) => c.mode === profile.commuteMode) ?? commuteOptions[0];
  const chosenCommute = commuteOptions.find((c) => c.mode === whatIf.commuteMode) ?? currentCommute;
  const maskEfficiency = (Math.min(100, Math.max(0, whatIf.maskCompliancePct)) / 100) * N95_FILTRATION;
  const outdoorAfter = round1(chosenCommute.commutePm25UgM3 * (1 - maskEfficiency));

  const dailyBeforeUg = Math.round(dailyDoseUg(baselineIndoorPm25, currentCommute.commutePm25UgM3));
  const dailyAfterUg = Math.round(dailyDoseUg(projectedIndoorPm25, outdoorAfter));
  const dailyInhaledAvoidedUg = Math.max(0, dailyBeforeUg - dailyAfterUg);
  const avgBefore = dailyBeforeUg / DAILY_BREATHING_M3;
  const avgAfter = dailyAfterUg / DAILY_BREATHING_M3;

  const cookingCo2 =
    whatIf.cleanCookingAndSeal && profile.cookingFuel !== 'induction' ? CLEAN_COOKING_SAVINGS.co2Kg : 0;
  const cookingInr = whatIf.cleanCookingAndSeal ? CLEAN_COOKING_SAVINGS.inr : 0;
  const score = smogScore(whatIf, chosenCommute.recommended, completedActionsCount);

  return {
    smogScore: score,
    weeklyTrend: weeklyTrend(score, avgBefore),
    baselineIndoorPm25,
    projectedIndoorPm25,
    exposureCutPct:
      dailyBeforeUg > 0
        ? Math.min(MAX_EXPOSURE_CUT_PCT, Math.max(0, Math.round((dailyInhaledAvoidedUg / dailyBeforeUg) * 100)))
        : 0,
    pm25AvoidedUgM3: Math.max(0, round1(avgBefore - avgAfter)),
    dailyInhaledAvoidedUg,
    cigarettesAvoidedPerWeekApprox: round1((dailyInhaledAvoidedUg * 7) / UG_INHALED_PER_CIGARETTE),
    monthlyCo2SavedKg: round1(chosenCommute.monthlyCo2SavedKg + cookingCo2),
    monthlyMoneySavedInr: Math.round(chosenCommute.monthlySavingsInr + cookingInr),
    top3CutPct: topThreeHabitsCutPct(baselineIndoorPm25, air.pm25, dailyBeforeUg),
    formulas: FORMULA_EXPLAINERS,
  };
}
