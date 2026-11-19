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

export function computeWhatIfImpact(
  profile: SaansProfile,
  air: AirSnapshot,
  whatIf: WhatIfInputs,
  completedActionsCount: number
): ImpactReport {
  const baselineIndoorPm25 = estimateBaselineIndoorPm25(air.pm25, profile);

  // Indoor reduction from purifier hours (0..24) + clean cooking/draft sealing
  const purifierFactor = (Math.min(24, Math.max(0, whatIf.purifierHours)) / 24) * PURIFIER_MAX_REDUCTION;
  const cookingSealFactor = whatIf.cleanCookingAndSeal ? CLEAN_COOKING_SEAL_REDUCTION : 0;
  const remainingIndoor = (1 - purifierFactor) * (1 - cookingSealFactor);
  const projectedIndoorPm25 = Math.max(6, Math.round(baselineIndoorPm25 * remainingIndoor * 10) / 10);

  // Outdoor commute exposure factor with chosen mode + N95 mask compliance (N95 removes ~85% when fitted)
  const commuteOptions = computeCommuteAlternatives(
    profile.commuteDistanceKm,
    profile.commuteMode,
    air.pm25,
    profile.wfhDaysPerWeek
  );
  const currentCommute = commuteOptions.find((c) => c.mode === profile.commuteMode) ?? commuteOptions[0];
  const chosenCommute = commuteOptions.find((c) => c.mode === whatIf.commuteMode) ?? currentCommute;

  const maskEfficiency = (Math.min(100, Math.max(0, whatIf.maskCompliancePct)) / 100) * N95_FILTRATION;
  const outdoorEffectiveBefore = currentCommute.commutePm25UgM3;
  const outdoorEffectiveAfter = Math.round(chosenCommute.commutePm25UgM3 * (1 - maskEfficiency) * 10) / 10;

  const dailyBeforeUg = Math.round(
    baselineIndoorPm25 * BREATHING_M3.indoor + outdoorEffectiveBefore * BREATHING_M3.outdoor
  );
  const dailyAfterUg = Math.round(
    projectedIndoorPm25 * BREATHING_M3.indoor + outdoorEffectiveAfter * BREATHING_M3.outdoor
  );
  const dailyInhaledAvoidedUg = Math.max(0, dailyBeforeUg - dailyAfterUg);

  const avg24hBefore = dailyBeforeUg / DAILY_BREATHING_M3;
  const avg24hAfter = dailyAfterUg / DAILY_BREATHING_M3;
  const pm25AvoidedUgM3 = Math.max(0, Math.round((avg24hBefore - avg24hAfter) * 10) / 10);
  const exposureCutPct =
    dailyBeforeUg > 0 ? Math.min(92, Math.max(0, Math.round((dailyInhaledAvoidedUg / dailyBeforeUg) * 100))) : 0;

  const cigarettesAvoidedPerWeekApprox = round1((dailyInhaledAvoidedUg * 7) / UG_INHALED_PER_CIGARETTE);

  // Monthly CO2 & INR savings
  const cookingCo2 = whatIf.cleanCookingAndSeal && profile.cookingFuel !== 'induction' ? 18 : 0;
  const cookingInr = whatIf.cleanCookingAndSeal ? 380 : 0;
  const monthlyCo2SavedKg = Math.round((chosenCommute.monthlyCo2SavedKg + cookingCo2) * 10) / 10;
  const monthlyMoneySavedInr = Math.round(chosenCommute.monthlySavingsInr + cookingInr);

  // Smog Score 0..100: rewards protective habits, completed actions, and low-emission transport
  const habitPoints =
    (whatIf.purifierHours / 24) * 28 +
    (whatIf.maskCompliancePct / 100) * 24 +
    (whatIf.cleanCookingAndSeal ? 18 : 0) +
    (chosenCommute.recommended ? 16 : 6) +
    Math.min(14, completedActionsCount * 3.5);
  const smogScore = Math.max(12, Math.min(100, Math.round(habitPoints)));

  // Deterministic 7-day trend anchored to current smogScore
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  const offsets = [-18, -14, -10, -7, -4, -2, 0];
  const weeklyTrend = days.map((day, idx) => {
    const s = Math.max(18, Math.min(100, smogScore + offsets[idx]));
    const exp = Math.max(12, Math.round(avg24hBefore * (1 - (s / 100) * 0.68)));
    return { day, score: s, exposureUg: exp };
  });

  // "If you do these 3 things" benchmark: metro/carpool, ~12 h purifier (65% of its max effect)
  // with clean cooking & sealing, and an N95 worn 90% of the time outdoors.
  const top3AfterIndoor = Math.max(
    6,
    baselineIndoorPm25 * (1 - PURIFIER_MAX_REDUCTION * 0.65) * (1 - CLEAN_COOKING_SEAL_REDUCTION)
  );
  const top3AfterOutdoor = air.pm25 * COMMUTE_BENCHMARKS.metro.pmFactor * (1 - N95_FILTRATION * 0.9);
  const top3DailyAfter = top3AfterIndoor * BREATHING_M3.indoor + top3AfterOutdoor * BREATHING_M3.outdoor;
  const top3CutPct =
    dailyBeforeUg > 0
      ? Math.min(88, Math.max(25, Math.round(((dailyBeforeUg - top3DailyAfter) / dailyBeforeUg) * 100)))
      : 54;

  return {
    smogScore,
    weeklyTrend,
    baselineIndoorPm25,
    projectedIndoorPm25,
    exposureCutPct,
    pm25AvoidedUgM3,
    dailyInhaledAvoidedUg,
    cigarettesAvoidedPerWeekApprox,
    monthlyCo2SavedKg,
    monthlyMoneySavedInr,
    top3CutPct,
    formulas: [
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
    ],
  };
}
