import type { AirSnapshot, ForecastHour } from '../types/saans.js';
import { calculateCpcbAqi } from '../utils/saansEngine.js';

/** Live telemetry the API returns; the client attaches the selected city. */
export type LiveAirTelemetry = Omit<AirSnapshot, 'city'>;

export interface OpenMeteoAirQuality {
  current?: { time?: string; pm2_5?: number; pm10?: number; nitrogen_dioxide?: number; ozone?: number };
  hourly?: { time?: string[]; pm2_5?: Array<number | null>; pm10?: Array<number | null> };
}

export interface OpenMeteoWeather {
  current?: { temperature_2m?: number; relative_humidity_2m?: number; wind_speed_10m?: number };
  hourly?: { boundary_layer_height?: Array<number | null> };
}

/** Typical urban winter readings, used only when a field is missing from the upstream response. */
const DEFAULTS = { pm25: 45, pm10: 75, no2: 28, o3: 34, tempC: 18, humidityPct: 62, windKmh: 7.5 };
const FORECAST_HOURS = 48;

const round1 = (value: number) => Math.round(value * 10) / 10;

export function airQualityUrl(lat: number, lon: number): string {
  return (
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    '&current=pm2_5,pm10,nitrogen_dioxide,ozone&hourly=pm2_5,pm10&forecast_days=2&timezone=auto'
  );
}

export function weatherUrl(lat: number, lon: number): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=boundary_layer_height&forecast_days=1&timezone=auto'
  );
}

function toForecast(hourly: OpenMeteoAirQuality['hourly'], fallbackPm25: number, fallbackPm10: number): ForecastHour[] {
  const pm25 = hourly?.pm2_5 ?? [];
  const pm10 = hourly?.pm10 ?? [];
  return (hourly?.time ?? []).slice(0, FORECAST_HOURS).map((iso, idx) => {
    const label = iso.includes('T') ? iso.split('T')[1].slice(0, 5) : `${String(idx % 24).padStart(2, '0')}:00`;
    const hourPm25 = round1(pm25[idx] ?? fallbackPm25);
    const hourPm10 = round1(pm10[idx] ?? fallbackPm10);
    return {
      isoTime: iso,
      label,
      dayLabel: idx < 24 ? 'Today' : 'Tomorrow',
      hourIndex: idx,
      hourOfDay: Number(label.slice(0, 2)) || idx % 24,
      pm25: hourPm25,
      pm10: hourPm10,
      aqi: calculateCpcbAqi(hourPm25, hourPm10),
    };
  });
}

/**
 * Mixing height (m) for the current hour. Without boundary-layer data it is estimated from wind:
 * calm air means a low lid that traps smog (never below 180 m).
 */
function mixingHeight(weather: OpenMeteoWeather | null, hourOfDay: number): number {
  const heights = (weather?.hourly?.boundary_layer_height ?? []).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  const measured = heights[Math.min(hourOfDay, Math.max(0, heights.length - 1))];
  const windKmh = weather?.current?.wind_speed_10m ?? 7;
  return Math.round(measured ?? Math.max(180, 140 + windKmh * 32));
}

/** Converts raw Open-Meteo responses into the app's telemetry, with CPCB AQI computed by the engine. */
export function toLiveTelemetry(
  aq: OpenMeteoAirQuality,
  weather: OpenMeteoWeather | null,
  now: Date = new Date()
): LiveAirTelemetry {
  const pm25 = round1(aq.current?.pm2_5 ?? DEFAULTS.pm25);
  const pm10 = round1(aq.current?.pm10 ?? DEFAULTS.pm10);
  return {
    source: 'open-meteo-live',
    updatedAt: aq.current?.time ?? now.toISOString(),
    aqi: calculateCpcbAqi(pm25, pm10),
    pm25,
    pm10,
    no2: round1(aq.current?.nitrogen_dioxide ?? DEFAULTS.no2),
    o3: round1(aq.current?.ozone ?? DEFAULTS.o3),
    tempC: round1(weather?.current?.temperature_2m ?? DEFAULTS.tempC),
    humidityPct: Math.round(weather?.current?.relative_humidity_2m ?? DEFAULTS.humidityPct),
    windKmh: round1(weather?.current?.wind_speed_10m ?? DEFAULTS.windKmh),
    mixingHeightM: mixingHeight(weather, now.getHours()),
    forecast48h: toForecast(aq.hourly, pm25, pm10),
  };
}
