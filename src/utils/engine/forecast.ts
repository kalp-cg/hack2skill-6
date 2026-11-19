/** Weather-driven signals: winter inversion detection and the cleanest/worst outdoor hours. */
import type { BestWorstHours, ForecastHour, InversionWarning } from '../../types/saans.js';

/**
 * A low mixing height (the atmospheric "lid") plus calm wind traps smoke near the ground.
 * Either a heavy-PM + calm-wind combination or a low lid on its own raises the warning.
 */
const SEVERE_INVERSION = { minPm25: 110, maxWindKmh: 9, maxMixingHeightM: 280 };
const MODERATE_INVERSION = { minPm25: 55, maxWindKmh: 12, maxMixingHeightM: 460 };

/** Mixing-height estimate when no boundary-layer reading exists: wind and warmth both lift the lid. */
function estimateMixingHeight(windKmh: number, tempC: number): number {
  return Math.max(120, Math.round(140 + windKmh * 34 + Math.max(0, tempC - 8) * 14));
}

export function detectInversionWarning(
  pm25: number,
  windKmh: number,
  tempC: number,
  humidityPct: number,
  mixingHeightM?: number
): InversionWarning {
  const lidM =
    typeof mixingHeightM === 'number' && mixingHeightM > 0
      ? Math.round(mixingHeightM)
      : estimateMixingHeight(windKmh, tempC);
  const matches = (t: typeof SEVERE_INVERSION) =>
    (pm25 >= t.minPm25 && windKmh <= t.maxWindKmh) || lidM < t.maxMixingHeightM;

  if (matches(SEVERE_INVERSION)) {
    return {
      active: true,
      severity: 'Severe',
      mixingHeightM: lidM,
      headline: 'Severe Thermal Inversion & Low Mixing Height',
      explanation: `Calm wind (${windKmh} km/h) and cool air (${tempC}°C, ${humidityPct}% RH) are trapping smoke under a ~${lidM} m atmospheric lid. Avoid dawn and post-sunset outdoor exposure.`,
    };
  }
  if (matches(MODERATE_INVERSION)) {
    return {
      active: true,
      severity: 'Moderate',
      mixingHeightM: lidM,
      headline: 'Winter Inversion Buildup Expected',
      explanation: `Light winds (${windKmh} km/h) with ~${lidM} m mixing height slow smog dispersion in early morning and late evening. Shift errands to afternoon.`,
    };
  }
  return {
    active: false,
    severity: 'Low',
    mixingHeightM: lidM,
    headline: 'Healthy Vertical Dispersion',
    explanation: `Steady wind (${windKmh} km/h) and ~${lidM} m mixing height are clearing ground-level emissions effectively.`,
  };
}

/** Typical Delhi winter pattern, used when fewer than 4 forecast hours are available. */
const TYPICAL_WINTER_HOURS: BestWorstHours = {
  bestStartLabel: '13:00',
  bestEndLabel: '15:00',
  bestAvgAqi: 180,
  bestAvgPm25: 85,
  worstLabel: '07:00',
  worstAqi: 340,
  tomorrowBestLabel: '14:00',
  tomorrowBestAqi: 170,
};

/** Daytime hours get a small bonus: people can actually use a 10:00–16:00 window. */
const DAYTIME_HOURS = { from: 10, to: 16 };
const DAYTIME_BONUS_AQI = 6;

/** Index of the start of the cleanest 2-hour window, favouring daytime on near-ties. */
function cleanestWindowStart(hours: ForecastHour[]): number {
  let bestStart = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < hours.length - 1; i++) {
    const isDaytime = hours[i].hourOfDay >= DAYTIME_HOURS.from && hours[i].hourOfDay <= DAYTIME_HOURS.to;
    const score = (hours[i].aqi + hours[i + 1].aqi) / 2 - (isDaytime ? DAYTIME_BONUS_AQI : 0);
    if (score < bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }
  return bestStart;
}

/** First hour with the most extreme AQI (`pickHigher` true = worst, false = cleanest). */
function extremeHour(hours: ForecastHour[], pickHigher: boolean): ForecastHour {
  return hours.reduce((pick, hour) => ((pickHigher ? hour.aqi > pick.aqi : hour.aqi < pick.aqi) ? hour : pick));
}

/** Best 2-hour outdoor window and worst hour today, plus tomorrow's cleanest hour, from a 48-hour forecast. */
export function findBestAndWorstHours48(forecast: ForecastHour[]): BestWorstHours {
  if (!forecast || forecast.length < 4) return TYPICAL_WINTER_HOURS;

  const today = forecast.slice(0, 24);
  const tomorrow = forecast.slice(24, 48);
  const start = cleanestWindowStart(today);
  const first = today[start];
  const second = today[Math.min(start + 1, today.length - 1)];
  const worst = extremeHour(today, true);
  const tomorrowBest = tomorrow.length > 0 ? extremeHour(tomorrow, false) : first;

  return {
    bestStartLabel: first.label,
    bestEndLabel: `${String((first.hourOfDay + 2) % 24).padStart(2, '0')}:00`,
    bestAvgAqi: Math.round((first.aqi + second.aqi) / 2),
    bestAvgPm25: Math.round(((first.pm25 + second.pm25) / 2) * 10) / 10,
    worstLabel: worst.label,
    worstAqi: worst.aqi,
    tomorrowBestLabel: tomorrowBest.label,
    tomorrowBestAqi: tomorrowBest.aqi,
  };
}
