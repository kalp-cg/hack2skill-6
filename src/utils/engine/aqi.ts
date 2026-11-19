/** Official Indian CPCB National AQI: sub-index breakpoints and display bands. */
import type { AqiBand } from '../../types/saans.js';

/** One CPCB segment: concentrations [cLow, cHigh] map linearly onto index values [iLow, iHigh]. */
interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const segment = (cLow: number, cHigh: number, iLow: number, iHigh: number): Breakpoint => ({
  cLow,
  cHigh,
  iLow,
  iHigh,
});

/** 24-hour PM2.5 breakpoints (µg/m³), CPCB National Air Quality Index. */
const PM25_BREAKPOINTS: Breakpoint[] = [
  segment(0, 30, 0, 50),
  segment(30.1, 60, 51, 100),
  segment(60.1, 90, 101, 200),
  segment(90.1, 120, 201, 300),
  segment(120.1, 250, 301, 400),
  segment(250.1, 500, 401, 500),
];

/** 24-hour PM10 breakpoints (µg/m³), CPCB National Air Quality Index. */
const PM10_BREAKPOINTS: Breakpoint[] = [
  segment(0, 50, 0, 50),
  segment(50.1, 100, 51, 100),
  segment(100.1, 250, 101, 200),
  segment(250.1, 350, 201, 300),
  segment(350.1, 430, 301, 400),
  segment(430.1, 600, 401, 500),
];

export const MAX_AQI = 500;

/** Sub-index for one pollutant. Concentrations between published segments use the next segment up. */
function subIndex(concentration: number, breakpoints: Breakpoint[]): number {
  const c = Math.max(0, concentration);
  const bp = breakpoints.find(({ cHigh }) => c <= cHigh);
  if (!bp) return MAX_AQI;
  return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow);
}

/**
 * Official Indian CPCB National AQI for PM2.5 and PM10 (µg/m³): the governing (maximum)
 * sub-index, capped at 500. PM10 is ignored when it is not provided.
 */
export function calculateCpcbAqi(pm25: number, pm10 = 0): number {
  const pm10Index = pm10 > 0 ? subIndex(pm10, PM10_BREAKPOINTS) : 0;
  return Math.min(MAX_AQI, Math.max(subIndex(pm25, PM25_BREAKPOINTS), pm10Index));
}

/** Display bands, ordered by their inclusive upper AQI bound. "Very Poor" and above trigger Smog Emergency Mode. */
const AQI_BANDS: Array<{ maxAqi: number } & AqiBand> = [
  {
    maxAqi: 50,
    label: 'Good',
    shortLabel: 'Good',
    band: 'good',
    colorHex: '#16a34a',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    isEmergency: false,
    advisory: 'Air is clean. Safe for outdoor play, jogging, and full cross-ventilation.',
  },
  {
    maxAqi: 100,
    label: 'Satisfactory',
    shortLabel: 'Satisfactory',
    band: 'satisfactory',
    colorHex: '#ca8a04',
    textClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    borderClass: 'border-amber-200 dark:border-amber-800',
    isEmergency: false,
    advisory: 'Acceptable for most people; asthmatic kids and elders should avoid heavy roadside traffic.',
  },
  {
    maxAqi: 200,
    label: 'Moderate',
    shortLabel: 'Moderate',
    band: 'moderate',
    colorHex: '#ea580c',
    textClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/50',
    borderClass: 'border-orange-200 dark:border-orange-800',
    isEmergency: false,
    advisory: 'Discomfort for asthma, heart, or lung conditions. Prefer midday outdoor windows and N95 on busy roads.',
  },
  {
    maxAqi: 300,
    label: 'Poor',
    shortLabel: 'Poor',
    band: 'poor',
    colorHex: '#dc2626',
    textClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/50',
    borderClass: 'border-red-200 dark:border-red-800',
    isEmergency: false,
    advisory: 'Unhealthy winter haze. Skip morning outdoor runs, wear N95 outdoors, and run indoor filtration.',
  },
  {
    maxAqi: 400,
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
  },
  {
    maxAqi: Number.POSITIVE_INFINITY,
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
  },
];

/** CPCB category, colours and advisory for an AQI value. */
export function getAqiBand(aqi: number): AqiBand {
  // The last band is unbounded, so `find` always succeeds.
  const { maxAqi: _upperBound, ...band } = AQI_BANDS.find(({ maxAqi }) => aqi <= maxAqi) as (typeof AQI_BANDS)[number];
  return band;
}
