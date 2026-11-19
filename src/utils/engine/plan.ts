/** Situation object for the LLM and the deterministic (offline / fallback) daily plan. */
import type {
  ActionFeedbackState,
  AirSnapshot,
  AppLanguage,
  DailyPlanData,
  PlanRecommendation,
  SaansProfile,
  SituationObject,
  WhatIfInputs,
} from '../../types/saans.js';
import { getAqiBand } from './aqi.js';
import { computeCommuteAlternatives, computeRoomCadr, computeWhatIfImpact } from './exposure.js';
import { detectInversionWarning, findBestAndWorstHours48 } from './forecast.js';
import { computeMemberRisks } from './risk.js';

export function buildSituationObject(
  profile: SaansProfile,
  air: AirSnapshot,
  feedback: ActionFeedbackState,
  language: AppLanguage
): SituationObject {
  const band = getAqiBand(air.aqi);
  const inversion = detectInversionWarning(air.pm25, air.windKmh, air.tempC, air.humidityPct, air.mixingHeightM);
  const bestWorstHours = findBestAndWorstHours48(air.forecast48h);
  const memberRisks = computeMemberRisks(air.aqi, profile);
  const commuteAlternatives = computeCommuteAlternatives(
    profile.commuteDistanceKm,
    profile.commuteMode,
    air.pm25,
    profile.wfhDaysPerWeek
  );
  const defaultWhatIf: WhatIfInputs = {
    commuteMode: profile.commuteMode,
    purifierHours: profile.hasPurifier ? 12 : 0,
    maskCompliancePct: air.aqi > 200 ? 75 : 30,
    cleanCookingAndSeal: true,
  };
  const report = computeWhatIfImpact(profile, air, defaultWhatIf, feedback.doneIds.length);

  return {
    profile,
    air: {
      city: `${air.city.name}, ${air.city.state}`,
      source: air.source,
      updatedAt: air.updatedAt,
      aqi: air.aqi,
      band: band.label,
      isEmergency: band.isEmergency,
      pm25: air.pm25,
      pm10: air.pm10,
      no2: air.no2,
      o3: air.o3,
      tempC: air.tempC,
      humidityPct: air.humidityPct,
      windKmh: air.windKmh,
      mixingHeightM: inversion.mixingHeightM,
    },
    inversion,
    bestWorstHours,
    memberRisks,
    commuteAlternatives,
    engineEstimates: {
      baselineIndoorPm25: report.baselineIndoorPm25,
      smogScore: report.smogScore,
      recommendedCadr150SqFt: computeRoomCadr(150),
    },
    feedbackSummary: {
      completedCount: feedback.doneIds.length,
      skippedIds: feedback.skippedIds,
      dislikedIds: Object.entries(feedback.thumbs)
        .filter(([, v]) => v === 'down')
        .map(([k]) => k),
    },
    language,
  };
}

/** Smog Emergency Mode threshold (CPCB "Very Poor" and above). */
const EMERGENCY_AQI = 300;
/** Berkeley Earth rule of thumb: breathing ~22 µg/m³ PM2.5 for a day ≈ smoking one cigarette. */
const UG_M3_PER_DAILY_CIGARETTE = 22;
/** Above this AQI even the cleanest window only justifies a brief airing. */
const BRIEF_AIRING_AQI = 260;

/**
 * Share of the relevant PM2.5 level each action avoids, with a floor so a clean day still shows a
 * meaningful number. Calibrated against the exposure model in exposure.ts.
 */
const EFFECT = {
  morningShield: { share: 0.42 },
  commuteSwap: { share: 0.36, floorUg: 18 },
  afternoonAiring: { share: 0.55, floorUg: 14 },
  eveningKitchen: { share: 0.28, floorUg: 24 },
  nightSanctuary: { share: 0.56 },
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const cigarettes = (pm25Ug: number) => round1(pm25Ug / UG_M3_PER_DAILY_CIGARETTE);

type BlockContext = Pick<SituationObject, 'profile' | 'air' | 'bestWorstHours' | 'engineEstimates'> & {
  kidName?: string;
};

function morningBlock({ air, bestWorstHours, kidName }: BlockContext): PlanRecommendation {
  const avoided = air.pm25 * EFFECT.morningShield.share;
  return {
    id: 'morning-shield',
    period: 'Morning',
    timeRange: '06:30 – 09:00',
    action:
      air.aqi > EMERGENCY_AQI
        ? `Skip morning outdoor walks/jogs${kidName ? ` and keep ${kidName} indoors before school` : ''}; keep all windows latched tight during peak inversion (AQI ${bestWorstHours.worstAqi}).`
        : 'Move vigorous morning exercise indoors and damp-mop floors instead of dry brooming.',
    why: `Cold morning air traps exhaust near ground level (mixing height ~${air.mixingHeightM} m), making 06:30–09:00 the heaviest PM2.5 breathing window.`,
    impact: { pm25_ug: Math.round(avoided), co2_kg: 0.4, inr: 0, cigarettes_approx: cigarettes(avoided) },
    effort: 'easy',
    category: 'routine',
    evidence_source: 'CPCB Winter GRAP & MoHFW Advisory',
    confidence: 'High',
  };
}

function commuteAction(profile: BlockContext['profile'], transitLabel: string, skipped: boolean): string {
  if (skipped) {
    return 'Shift 1 trip this week to work-from-home or travel after 10:30 AM with a tight N95 mask (easier alternative to carpooling).';
  }
  if (profile.commuteMode === 'car' || profile.commuteMode === 'bike') {
    return `Take ${transitLabel} instead of your ${profile.commuteMode} for today's ${profile.commuteDistanceKm} km commute, wearing a fitted N95 mask at stops.`;
  }
  return `Stick to side streets away from arterial traffic and wear a sealed N95/N99 respirator during your ${profile.commuteDistanceKm} km trip.`;
}

function commuteBlock(
  { profile, air }: BlockContext,
  commuteAlternatives: SituationObject['commuteAlternatives'],
  skipped: boolean
): PlanRecommendation {
  const transit =
    commuteAlternatives.find((c) => c.mode === 'metro') ??
    commuteAlternatives.find((c) => c.recommended) ??
    commuteAlternatives[0];
  const avoided = air.pm25 * EFFECT.commuteSwap.share;
  return {
    id: 'commute-swap',
    period: 'Commute',
    timeRange: '08:30 – 10:30',
    action: commuteAction(profile, transit.label, skipped),
    why: 'Cold-start petrol engines emit high PM2.5 and NO₂; electric transit or off-peak travel slashes both your roadside lung dose and neighborhood exhaust.',
    impact: {
      pm25_ug: Math.max(EFFECT.commuteSwap.floorUg, Math.round(avoided)),
      co2_kg: Math.max(1.5, round1(transit.monthlyCo2SavedKg / 20)),
      inr: Math.max(120, Math.round(transit.monthlySavingsInr / 4)),
      cigarettes_approx: cigarettes(avoided),
    },
    effort: skipped ? 'easy' : 'medium',
    category: 'sustainable',
    evidence_source: 'CPCB Urban Mobility Emissions Data',
    confidence: 'High',
  };
}

function afternoonBlock({ air, bestWorstHours: w }: BlockContext): PlanRecommendation {
  const window = `${w.bestStartLabel}–${w.bestEndLabel}`;
  const avoided = Math.max(EFFECT.afternoonAiring.floorUg, (air.pm25 - w.bestAvgPm25) * EFFECT.afternoonAiring.share);
  return {
    id: 'afternoon-vent',
    period: 'Afternoon',
    timeRange: `${w.bestStartLabel} – ${w.bestEndLabel}`,
    action:
      w.bestAvgAqi > BRIEF_AIRING_AQI
        ? `Brief 5-minute window crack only if room feels stuffy during today's cleanest dip (AQI ${w.bestAvgAqi}), then immediately seal and filter.`
        : `Open opposite windows for 15 minutes during today's cleanest window (${window}, AQI ${w.bestAvgAqi}) to flush indoor CO₂.`,
    why: `Midday sun lifts the winter inversion layer, making ${window} the lowest outdoor PM2.5 window (${w.bestAvgPm25} µg/m³).`,
    impact: {
      pm25_ug: Math.max(
        EFFECT.afternoonAiring.floorUg,
        Math.round((air.pm25 - w.bestAvgPm25) * EFFECT.afternoonAiring.share)
      ),
      co2_kg: 0.5,
      inr: 90,
      cigarettes_approx: cigarettes(avoided),
    },
    effort: 'easy',
    category: 'indoor',
    evidence_source: 'WHO 2021 Guidelines & ASHRAE Ventilation Guide',
    confidence: 'High',
  };
}

function eveningBlock({ profile, engineEstimates }: BlockContext): PlanRecommendation {
  const raw = engineEstimates.baselineIndoorPm25 * EFFECT.eveningKitchen.share;
  return {
    id: 'evening-kitchen',
    period: 'Evening',
    timeRange: '17:30 – 20:30',
    action:
      profile.cookingFuel === 'induction'
        ? 'Run the kitchen chimney 5 minutes before cooking, keep lids on pots, and avoid high-smoke frying while sealing balcony doors before sunset.'
        : 'Switch boiling/tea to an electric kettle or covered pressure cooker, run kitchen exhaust fan on high, and avoid agarbatti/candles tonight.',
    why: 'Open gas flames and heavy tadka/frying spike indoor PM2.5 past 250 µg/m³ and NO₂ past 100 µg/m³ when winter windows are closed.',
    impact: {
      pm25_ug: Math.max(EFFECT.eveningKitchen.floorUg, Math.round(raw)),
      co2_kg: 1.1,
      inr: 160,
      cigarettes_approx: cigarettes(Math.max(EFFECT.eveningKitchen.floorUg, raw)),
    },
    effort: 'easy',
    category: 'indoor',
    evidence_source: 'US EPA Indoor Air & IIT-Delhi Kitchen IAQ Study',
    confidence: 'High',
  };
}

function nightBlock({ profile, engineEstimates, kidName }: BlockContext): PlanRecommendation {
  const avoided = engineEstimates.baselineIndoorPm25 * EFFECT.nightSanctuary.share;
  return {
    id: 'night-sanctuary',
    period: 'Night',
    timeRange: '21:30 – 06:30',
    action: profile.hasPurifier
      ? 'Seal bedroom door gap with a damp rolled towel and run your HEPA purifier continuously on sleep/medium mode (30 cm off walls) all night.'
      : `Seal bedroom window/door drafts with damp cloths and consider a low-cost MERV-13 DIY box fan filter (target ~${engineEstimates.recommendedCadr150SqFt} m³/h CADR for a 150 sq ft room).`,
    why: `Protecting 8 hours of sleep in one sealed room produces the single biggest drop in 24-hour cumulative PM2.5 lung dose${kidName ? ` for ${kidName} and your family` : ''}.`,
    impact: { pm25_ug: Math.round(avoided), co2_kg: 0.6, inr: 120, cigarettes_approx: cigarettes(avoided) },
    effort: 'easy',
    category: 'indoor',
    evidence_source: 'ICMR Smog Advisory & EPA CADR Guide',
    confidence: 'High',
  };
}

/**
 * Deterministic five-block daily plan: every number comes from the engine, never the LLM.
 * It doubles as the offline / AI-unavailable fallback and adapts when the user skips or
 * thumbs-down the commute swap.
 */
export function buildDeterministicDailyPlan(situation: SituationObject): DailyPlanData {
  const { profile, air, bestWorstHours: w, commuteAlternatives, feedbackSummary } = situation;
  const context: BlockContext = { ...situation, kidName: profile.kids[0]?.name };
  const skippedCommute = [...feedbackSummary.skippedIds, ...feedbackSummary.dislikedIds].includes('commute-swap');

  const [morning, commute, afternoon, evening, night] = [
    morningBlock(context),
    commuteBlock(context, commuteAlternatives, skippedCommute),
    afternoonBlock(context),
    eveningBlock(context),
    nightBlock(context),
  ];

  const window = `${w.bestStartLabel}–${w.bestEndLabel}`;
  const oneLineSummary =
    air.aqi > EMERGENCY_AQI
      ? `Today is ${air.band} (AQI ${air.aqi}). Skip outdoor exercise${context.kidName ? ` for ${context.kidName}` : ''}; cleanest window is ${window}.`
      : `Today is ${air.band} (AQI ${air.aqi}). Best outdoor window is ${window} (AQI ${w.bestAvgAqi}).`;

  return {
    oneLineSummary,
    blocks: [morning, commute, afternoon, evening, night],
    top3Actions: [night.action, commute.action, evening.action],
    todaysWin:
      'Press a damp rolled towel under the bedroom door and turn on the kitchen chimney 5 minutes before dinner (takes 2 minutes).',
    adaptedNote: skippedCommute
      ? 'Adapted from your feedback: since you skipped the previous commute swap, we replaced it with an easier off-peak/WFH option.'
      : undefined,
    generatedAt: new Date().toISOString(),
    source: 'deterministic-engine',
    ragSources: [
      'CPCB National AQI & GRAP',
      'WHO 2021 Air Quality Guidelines',
      'MoHFW / ICMR Smog Advisory',
      'US EPA Indoor Air & CADR Guide',
    ],
  };
}
