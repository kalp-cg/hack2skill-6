/** Official Indian CPCB National AQI: sub-index breakpoints and display bands. */
import type { AqiBand } from '../../types/saans.js';

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
