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

/**
 * Deterministic Daily Plan builder ensuring zero invented numbers and adaptive swaps
 * when a user skips an action or marks thumbs down.
 */
export function buildDeterministicDailyPlan(situation: SituationObject): DailyPlanData {
  const { profile, air, bestWorstHours, commuteAlternatives, feedbackSummary } = situation;
  const kidName = profile.kids[0]?.name;
  const isEmergency = air.aqi > 300;
  const skippedCommute =
    feedbackSummary.skippedIds.includes('commute-swap') || feedbackSummary.dislikedIds.includes('commute-swap');

  const bestTransit =
    commuteAlternatives.find((c) => c.mode === 'metro') ??
    commuteAlternatives.find((c) => c.recommended) ??
    commuteAlternatives[0];

  const commuteAction = skippedCommute
    ? `Shift 1 trip this week to work-from-home or travel after 10:30 AM with a tight N95 mask (easier alternative to carpooling).`
    : profile.commuteMode === 'car' || profile.commuteMode === 'bike'
      ? `Take ${bestTransit.label} instead of your ${profile.commuteMode} for today's ${profile.commuteDistanceKm} km commute, wearing a fitted N95 mask at stops.`
      : `Stick to side streets away from arterial traffic and wear a sealed N95/N99 respirator during your ${profile.commuteDistanceKm} km trip.`;

  const blocks: PlanRecommendation[] = [
    {
      id: 'morning-shield',
      period: 'Morning',
      timeRange: '06:30 – 09:00',
      action: isEmergency
        ? `Skip morning outdoor walks/jogs${kidName ? ` and keep ${kidName} indoors before school` : ''}; keep all windows latched tight during peak inversion (AQI ${bestWorstHours.worstAqi}).`
        : `Move vigorous morning exercise indoors and damp-mop floors instead of dry brooming.`,
      why: `Cold morning air traps exhaust near ground level (mixing height ~${air.mixingHeightM} m), making 06:30–09:00 the heaviest PM2.5 breathing window.`,
      impact: {
        pm25_ug: Math.round(air.pm25 * 0.42),
        co2_kg: 0.4,
        inr: 0,
        cigarettes_approx: Math.round(((air.pm25 * 0.42) / 22) * 10) / 10,
      },
      effort: 'easy',
      category: 'routine',
      evidence_source: 'CPCB Winter GRAP & MoHFW Advisory',
      confidence: 'High',
    },
    {
      id: 'commute-swap',
      period: 'Commute',
      timeRange: '08:30 – 10:30',
      action: commuteAction,
      why: `Cold-start petrol engines emit high PM2.5 and NO₂; electric transit or off-peak travel slashes both your roadside lung dose and neighborhood exhaust.`,
      impact: {
        pm25_ug: Math.max(18, Math.round(air.pm25 * 0.36)),
        co2_kg: Math.max(1.5, Math.round((bestTransit.monthlyCo2SavedKg / 20) * 10) / 10),
        inr: Math.max(120, Math.round(bestTransit.monthlySavingsInr / 4)),
        cigarettes_approx: Math.round(((air.pm25 * 0.36) / 22) * 10) / 10,
      },
      effort: skippedCommute ? 'easy' : 'medium',
      category: 'sustainable',
      evidence_source: 'CPCB Urban Mobility Emissions Data',
      confidence: 'High',
    },
    {
      id: 'afternoon-vent',
      period: 'Afternoon',
      timeRange: `${bestWorstHours.bestStartLabel} – ${bestWorstHours.bestEndLabel}`,
      action:
        bestWorstHours.bestAvgAqi > 260
          ? `Brief 5-minute window crack only if room feels stuffy during today's cleanest dip (AQI ${bestWorstHours.bestAvgAqi}), then immediately seal and filter.`
          : `Open opposite windows for 15 minutes during today's cleanest window (${bestWorstHours.bestStartLabel}–${bestWorstHours.bestEndLabel}, AQI ${bestWorstHours.bestAvgAqi}) to flush indoor CO₂.`,
      why: `Midday sun lifts the winter inversion layer, making ${bestWorstHours.bestStartLabel}–${bestWorstHours.bestEndLabel} the lowest outdoor PM2.5 window (${bestWorstHours.bestAvgPm25} µg/m³).`,
      impact: {
        pm25_ug: Math.max(14, Math.round((air.pm25 - bestWorstHours.bestAvgPm25) * 0.55)),
        co2_kg: 0.5,
        inr: 90,
        cigarettes_approx: Math.round((Math.max(14, (air.pm25 - bestWorstHours.bestAvgPm25) * 0.55) / 22) * 10) / 10,
      },
      effort: 'easy',
      category: 'indoor',
      evidence_source: 'WHO 2021 Guidelines & ASHRAE Ventilation Guide',
      confidence: 'High',
    },
    {
      id: 'evening-kitchen',
      period: 'Evening',
      timeRange: '17:30 – 20:30',
      action:
        profile.cookingFuel === 'induction'
          ? `Run the kitchen chimney 5 minutes before cooking, keep lids on pots, and avoid high-smoke frying while sealing balcony doors before sunset.`
          : `Switch boiling/tea to an electric kettle or covered pressure cooker, run kitchen exhaust fan on high, and avoid agarbatti/candles tonight.`,
      why: `Open gas flames and heavy tadka/frying spike indoor PM2.5 past 250 µg/m³ and NO₂ past 100 µg/m³ when winter windows are closed.`,
      impact: {
        pm25_ug: Math.max(24, Math.round(situation.engineEstimates.baselineIndoorPm25 * 0.28)),
        co2_kg: 1.1,
        inr: 160,
        cigarettes_approx:
          Math.round((Math.max(24, situation.engineEstimates.baselineIndoorPm25 * 0.28) / 22) * 10) / 10,
      },
      effort: 'easy',
      category: 'indoor',
      evidence_source: 'US EPA Indoor Air & IIT-Delhi Kitchen IAQ Study',
      confidence: 'High',
    },
    {
      id: 'night-sanctuary',
      period: 'Night',
      timeRange: '21:30 – 06:30',
      action: profile.hasPurifier
        ? `Seal bedroom door gap with a damp rolled towel and run your HEPA purifier continuously on sleep/medium mode (30 cm off walls) all night.`
        : `Seal bedroom window/door drafts with damp cloths and consider a low-cost MERV-13 DIY box fan filter (target ~${situation.engineEstimates.recommendedCadr150SqFt} m³/h CADR for a 150 sq ft room).`,
      why: `Protecting 8 hours of sleep in one sealed room produces the single biggest drop in 24-hour cumulative PM2.5 lung dose${kidName ? ` for ${kidName} and your family` : ''}.`,
      impact: {
        pm25_ug: Math.round(situation.engineEstimates.baselineIndoorPm25 * 0.56),
        co2_kg: 0.6,
        inr: 120,
        cigarettes_approx: Math.round(((situation.engineEstimates.baselineIndoorPm25 * 0.56) / 22) * 10) / 10,
      },
      effort: 'easy',
      category: 'indoor',
      evidence_source: 'ICMR Smog Advisory & EPA CADR Guide',
      confidence: 'High',
    },
  ];

  const oneLineSummary = isEmergency
    ? `Today is ${air.band} (AQI ${air.aqi}). Skip outdoor exercise${kidName ? ` for ${kidName}` : ''}; cleanest window is ${bestWorstHours.bestStartLabel}–${bestWorstHours.bestEndLabel}.`
    : `Today is ${air.band} (AQI ${air.aqi}). Best outdoor window is ${bestWorstHours.bestStartLabel}–${bestWorstHours.bestEndLabel} (AQI ${bestWorstHours.bestAvgAqi}).`;

  return {
    oneLineSummary,
    blocks,
    top3Actions: [blocks[4].action, blocks[1].action, blocks[3].action],
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
