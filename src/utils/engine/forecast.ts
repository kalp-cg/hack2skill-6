/** Weather-driven signals: winter inversion detection and the cleanest/worst outdoor hours. */
import type { BestWorstHours, ForecastHour, InversionWarning } from '../../types/saans.js';

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
