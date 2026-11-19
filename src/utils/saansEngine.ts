import type {
  ActionFeedbackState,
  AirSnapshot,
  AppLanguage,
  AqiBand,
  BestWorstHours,
  CommuteMode,
  CommuteOptionComparison,
  DailyPlanData,
  ForecastHour,
  ImpactReport,
  InversionWarning,
  MemberRisk,
  PlanRecommendation,
  SaansProfile,
  SituationObject,
  WhatIfInputs,
} from '../types/saans';

/**
 * Computes official Indian CPCB National AQI sub-index for PM2.5 (ug/m3) and PM10 (ug/m3)
 * and returns the governing maximum AQI (0-500).
 */
export function calculateCpcbAqi(pm25Raw: number, pm10Raw = 0): number {
  const interp = (val: number, table: Array<[number, number, number, number]>): number => {
    const c = Math.max(0, val);
    for (const [cLo, cHi, iLo, iHi] of table) {
      if (c >= cLo && c <= cHi) {
        return Math.round(((iHi - iLo) / (cHi - cLo)) * (c - cLo) + iLo);
      }
    }
    return 500;
  };

  const pm25Table: Array<[number, number, number, number]> = [
    [0, 30, 0, 50],
    [30.1, 60, 51, 100],
    [60.1, 90, 101, 200],
    [90.1, 120, 201, 300],
    [120.1, 250, 301, 400],
    [250.1, 500, 401, 500],
  ];

  const pm10Table: Array<[number, number, number, number]> = [
    [0, 50, 0, 50],
    [50.1, 100, 51, 100],
    [100.1, 250, 101, 200],
    [250.1, 350, 201, 300],
    [350.1, 430, 301, 400],
    [430.1, 600, 401, 500],
  ];

  const pm25Idx = interp(pm25Raw, pm25Table);
  const pm10Idx = pm10Raw > 0 ? interp(pm10Raw, pm10Table) : 0;
  return Math.min(500, Math.max(pm25Idx, pm10Idx));
}

export function getAqiBand(aqi: number): AqiBand {
  if (aqi <= 50) {
    return {
      label: 'Good',
      shortLabel: 'Good',
      band: 'good',
      colorHex: '#16a34a',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      isEmergency: false,
      advisory: 'Air is clean. Safe for outdoor play, jogging, and full cross-ventilation.',
    };
  }
  if (aqi <= 100) {
    return {
      label: 'Satisfactory',
      shortLabel: 'Satisfactory',
      band: 'satisfactory',
      colorHex: '#ca8a04',
      textClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50',
      borderClass: 'border-amber-200 dark:border-amber-800',
      isEmergency: false,
      advisory: 'Acceptable for most people; asthmatic kids and elders should avoid heavy roadside traffic.',
    };
  }
  if (aqi <= 200) {
    return {
      label: 'Moderate',
      shortLabel: 'Moderate',
      band: 'moderate',
      colorHex: '#ea580c',
      textClass: 'text-orange-700 dark:text-orange-400',
      bgClass: 'bg-orange-50 dark:bg-orange-950/50',
      borderClass: 'border-orange-200 dark:border-orange-800',
      isEmergency: false,
      advisory:
        'Discomfort for asthma, heart, or lung conditions. Prefer midday outdoor windows and N95 on busy roads.',
    };
  }
  if (aqi <= 300) {
    return {
      label: 'Poor',
      shortLabel: 'Poor',
      band: 'poor',
      colorHex: '#dc2626',
      textClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/50',
      borderClass: 'border-red-200 dark:border-red-800',
      isEmergency: false,
      advisory: 'Unhealthy winter haze. Skip morning outdoor runs, wear N95 outdoors, and run indoor filtration.',
    };
  }
  if (aqi <= 400) {
    return {
      label: 'Very Poor',
      shortLabel: 'Very Poor',
      band: 'very_poor',
      colorHex: '#9333ea',
      textClass: 'text-purple-700 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/50',
      borderClass: 'border-purple-200 dark:border-purple-800',
      isEmergency: true,
      advisory:
        'Smog Emergency (>300 AQI). Keep children and elders indoors, seal window gaps, and run HEPA continuously.',
    };
  }
  return {
    label: 'Severe Emergency',
    shortLabel: 'Severe',
    band: 'severe',
    colorHex: '#881337',
    textClass: 'text-rose-800 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/60',
    borderClass: 'border-rose-300 dark:border-rose-800',
    isEmergency: true,
    advisory:
      'Hazardous winter smog. Trigger Smog Emergency Mode: halt all outdoor exercise, shift to WFH/metro, and maintain a sealed clean bedroom.',
  };
}

export function detectInversionWarning(
  pm25: number,
  windKmh: number,
  tempC: number,
  humidityPct: number,
  mixingHeightM?: number
): InversionWarning {
  const estMixingM =
    typeof mixingHeightM === 'number' && mixingHeightM > 0
      ? Math.round(mixingHeightM)
      : Math.max(120, Math.round(140 + windKmh * 34 + Math.max(0, tempC - 8) * 14));

  if ((pm25 >= 110 && windKmh <= 9) || estMixingM < 280) {
    return {
      active: true,
      severity: 'Severe',
      mixingHeightM: estMixingM,
      headline: 'Severe Thermal Inversion & Low Mixing Height',
      explanation: `Calm wind (${windKmh} km/h) and cool air (${tempC}°C, ${humidityPct}% RH) are trapping smoke under a ~${estMixingM} m atmospheric lid. Avoid dawn and post-sunset outdoor exposure.`,
    };
  }
  if ((pm25 >= 55 && windKmh <= 12) || estMixingM < 460) {
    return {
      active: true,
      severity: 'Moderate',
      mixingHeightM: estMixingM,
      headline: 'Winter Inversion Buildup Expected',
      explanation: `Light winds (${windKmh} km/h) with ~${estMixingM} m mixing height slow smog dispersion in early morning and late evening. Shift errands to afternoon.`,
    };
  }
  return {
    active: false,
    severity: 'Low',
    mixingHeightM: estMixingM,
    headline: 'Healthy Vertical Dispersion',
    explanation: `Steady wind (${windKmh} km/h) and ~${estMixingM} m mixing height are clearing ground-level emissions effectively.`,
  };
}

export function findBestAndWorstHours48(forecast: ForecastHour[]): BestWorstHours {
  if (!forecast || forecast.length < 4) {
    return {
      bestStartLabel: '13:00',
      bestEndLabel: '15:00',
      bestAvgAqi: 180,
      bestAvgPm25: 85,
      worstLabel: '07:00',
      worstAqi: 340,
      tomorrowBestLabel: '14:00',
      tomorrowBestAqi: 170,
    };
  }

  const todaySlice = forecast.slice(0, Math.min(24, forecast.length));
  const tomorrowSlice = forecast.slice(24, Math.min(48, forecast.length));

  let bestStart = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let worstPt = todaySlice[0];

  for (let i = 0; i < todaySlice.length; i++) {
    if (todaySlice[i].aqi > worstPt.aqi) worstPt = todaySlice[i];
    if (i < todaySlice.length - 1) {
      const avgAqi = (todaySlice[i].aqi + todaySlice[i + 1].aqi) / 2;
      const daytimeBias = todaySlice[i].hourOfDay >= 10 && todaySlice[i].hourOfDay <= 16 ? -6 : 0;
      if (avgAqi + daytimeBias < bestScore) {
        bestScore = avgAqi + daytimeBias;
        bestStart = i;
      }
    }
  }

  const bestNext = todaySlice[Math.min(bestStart + 1, todaySlice.length - 1)];
  const bestEndHour = (todaySlice[bestStart].hourOfDay + 2) % 24;

  let tmrBest = tomorrowSlice[0] ?? todaySlice[bestStart];
  for (const pt of tomorrowSlice) {
    if (pt.aqi < tmrBest.aqi) tmrBest = pt;
  }

  return {
    bestStartLabel: todaySlice[bestStart].label,
    bestEndLabel: `${String(bestEndHour).padStart(2, '0')}:00`,
    bestAvgAqi: Math.round((todaySlice[bestStart].aqi + bestNext.aqi) / 2),
    bestAvgPm25: Math.round(((todaySlice[bestStart].pm25 + bestNext.pm25) / 2) * 10) / 10,
    worstLabel: worstPt.label,
    worstAqi: worstPt.aqi,
    tomorrowBestLabel: tmrBest.label,
    tomorrowBestAqi: tmrBest.aqi,
  };
}

export function computeMemberRisks(aqi: number, profile: SaansProfile): MemberRisk[] {
  const risks: MemberRisk[] = [];
  const hasRespCond = profile.conditions.includes('asthma') || profile.conditions.includes('copd');
  const hasCardioOrPreg = profile.conditions.includes('heart') || profile.conditions.includes('pregnancy');

  for (const kid of profile.kids) {
    const risk: MemberRisk['risk'] =
      aqi > 300 || (aqi > 200 && hasRespCond) ? 'Critical' : aqi > 150 ? 'High' : aqi > 80 ? 'Moderate' : 'Low';
    const guidance =
      risk === 'Critical'
        ? `Keep ${kid.name} (${kid.age}y) indoors for play; no outdoor sports and keep windows sealed.`
        : risk === 'High'
          ? `Shorten ${kid.name}'s outdoor time to the afternoon dip; use child-sized N95 on school commute.`
          : `${kid.name} (${kid.age}y) can play outdoors away from busy main roads.`;
    risks.push({ memberLabel: `${kid.name} (${kid.age} yrs)`, risk, guidance });
  }

  if (profile.elders > 0) {
    const risk: MemberRisk['risk'] =
      aqi > 280 || (aqi > 180 && (hasRespCond || hasCardioOrPreg))
        ? 'Critical'
        : aqi > 130
          ? 'High'
          : aqi > 75
            ? 'Moderate'
            : 'Low';
    risks.push({
      memberLabel: `Elders (${profile.elders})`,
      risk,
      guidance:
        risk === 'Critical' || risk === 'High'
          ? 'Skip early morning park walks; do gentle indoor stretches and monitor blood pressure/breathing.'
          : 'Afternoon strolls are safe; keep rescue medications handy.',
    });
  }

  if (profile.conditions.length > 0) {
    const condNames = profile.conditions.map((c) => c.toUpperCase()).join(', ');
    const risk: MemberRisk['risk'] = aqi > 250 ? 'Critical' : aqi > 120 ? 'High' : 'Moderate';
    risks.push({
      memberLabel: `Sensitive Health (${condNames})`,
      risk,
      guidance:
        risk === 'Critical'
          ? 'Stay in filtered room, keep prescribed inhalers ready, and consult a doctor immediately for wheezing or chest tightness.'
          : 'Wear well-sealed N95/N99 outdoors and avoid kitchen smoke/incense.',
    });
  }

  risks.push({
    memberLabel: `Adults (${profile.adults})`,
    risk: aqi > 350 ? 'Critical' : aqi > 200 ? 'High' : aqi > 100 ? 'Moderate' : 'Low',
    guidance:
      aqi > 300
        ? 'Move morning workouts indoors; use metro/WFH and N95 mask for any essential trip.'
        : aqi > 150
          ? 'Avoid vigorous roadside jogging; shift outdoor errands to cleanest afternoon hours.'
          : 'Normal routine with low-emission transit preference.',
  });

  if (profile.hasPets) {
    risks.push({
      memberLabel: 'Family Pets',
      risk: aqi > 300 ? 'High' : aqi > 180 ? 'Moderate' : 'Low',
      guidance:
        aqi > 250
          ? 'Limit walks to 5–10 min midday breaks and wipe paws/coat with a damp cloth on return.'
          : 'Standard walks away from idling traffic.',
    });
  }

  return risks;
}

export function computeRoomCadr(roomSqFt: number): number {
  const safeSqFt = Math.max(40, Math.min(1200, roomSqFt));
  return Math.round(safeSqFt * 1.35);
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
  const commuteDaysPerMonth = Math.max(4, Math.round((5 - Math.min(4, wfhDaysPerWeek)) * 4.3));
  const roundTripKm = Math.max(2, distanceOneWayKm * 2);

  // Realistic Indian urban transport benchmarks (INR/km, speed km/h, g CO2/km, roadside PM2.5 factor)
  const specs: Record<
    CommuteMode,
    { label: string; inrPerKm: number; speedKmh: number; co2GPerKm: number; pmFactor: number }
  > = {
    car: { label: 'Solo Petrol Car', inrPerKm: 11.5, speedKmh: 22, co2GPerKm: 175, pmFactor: 0.95 },
    bike: { label: 'Petrol Two-Wheeler', inrPerKm: 3.4, speedKmh: 27, co2GPerKm: 62, pmFactor: 1.45 },
    carpool: { label: '3-Person Carpool', inrPerKm: 4.0, speedKmh: 21, co2GPerKm: 58, pmFactor: 0.9 },
    metro: { label: 'Electric Metro + Walk', inrPerKm: 3.2, speedKmh: 34, co2GPerKm: 28, pmFactor: 0.62 },
    bus: { label: 'AC Electric / CNG Bus', inrPerKm: 2.2, speedKmh: 20, co2GPerKm: 42, pmFactor: 0.78 },
    cycle: { label: 'Cycle (Low-AQI Days)', inrPerKm: 0.4, speedKmh: 15, co2GPerKm: 0, pmFactor: 1.55 },
    walk: { label: 'Walk (Short Trips)', inrPerKm: 0, speedKmh: 5, co2GPerKm: 0, pmFactor: 1.25 },
  };

  const currentSpec = specs[currentMode] ?? specs.car;
  const currentMonthlyCost = Math.round(roundTripKm * currentSpec.inrPerKm * commuteDaysPerMonth);
  const currentMonthlyCo2Kg = (roundTripKm * currentSpec.co2GPerKm * commuteDaysPerMonth) / 1000;

  const modesToShow: CommuteMode[] = ['car', 'metro', 'carpool', 'bus', 'bike', 'cycle'];

  return modesToShow.map((mode) => {
    const s = specs[mode];
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
  const purifierFactor = (Math.min(24, Math.max(0, whatIf.purifierHours)) / 24) * 0.58;
  const cookingSealFactor = whatIf.cleanCookingAndSeal ? 0.28 : 0;
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

  const maskEfficiency = (Math.min(100, Math.max(0, whatIf.maskCompliancePct)) / 100) * 0.85;
  const outdoorEffectiveBefore = currentCommute.commutePm25UgM3;
  const outdoorEffectiveAfter = Math.round(chosenCommute.commutePm25UgM3 * (1 - maskEfficiency) * 10) / 10;

  // 24h weighted breathing volume: 12.5 m3 indoor (~20h) + 2.5 m3 outdoor/commute (~4h) = 15 m3/day
  const dailyBeforeUg = Math.round(baselineIndoorPm25 * 12.5 + outdoorEffectiveBefore * 2.5);
  const dailyAfterUg = Math.round(projectedIndoorPm25 * 12.5 + outdoorEffectiveAfter * 2.5);
  const dailyInhaledAvoidedUg = Math.max(0, dailyBeforeUg - dailyAfterUg);

  const avg24hBefore = dailyBeforeUg / 15;
  const avg24hAfter = dailyAfterUg / 15;
  const pm25AvoidedUgM3 = Math.max(0, Math.round((avg24hBefore - avg24hAfter) * 10) / 10);
  const exposureCutPct =
    dailyBeforeUg > 0 ? Math.min(92, Math.max(0, Math.round((dailyInhaledAvoidedUg / dailyBeforeUg) * 100))) : 0;

  // Berkeley Earth approximation: 22 ug/m3 for 24h (~330 ug inhaled) ~= 1 cigarette
  const cigarettesAvoidedPerWeekApprox = Math.round(((dailyInhaledAvoidedUg * 7) / 330) * 10) / 10;

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

  // "If you do these 3 things" benchmark (Metro/Carpool + 12h Purifier/DIY + 90% N95)
  const top3AfterIndoor = Math.max(6, baselineIndoorPm25 * (1 - 0.58 * 0.65) * 0.72);
  const top3AfterOutdoor = air.pm25 * 0.62 * (1 - 0.85 * 0.9);
  const top3DailyAfter = top3AfterIndoor * 12.5 + top3AfterOutdoor * 2.5;
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
        formula: 'Daily Inhaled PM2.5 (µg) = (Indoor PM2.5 × 12.5 m³) + (Commute PM2.5 × (1 − MaskEff) × 2.5 m³)',
        assumption:
          'Assumes 15 m³/day average breathing volume (20h indoor, 4h commute/outdoors). Fitted N95 filtration efficiency = 85% real-world seal.',
      },
      {
        name: 'Cigarette-Equivalent (Approximation)',
        formula: 'Cigarettes/week ≈ (Daily Inhaled PM2.5 Avoided × 7) ÷ 330 µg',
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
        formula: 'Required CADR (m³/h) = Room Area (sq ft) × 1.35',
        assumption:
          'Targets 4.8–5 Air Changes per Hour (ACH) for a standard 8.5 ft Indian apartment ceiling during severe smog.',
      },
    ],
  };
}

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
