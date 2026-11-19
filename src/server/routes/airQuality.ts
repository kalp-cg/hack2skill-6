import { Router } from 'express';
import { TtlLruCache } from '../cache.js';
import { AQI_CACHE } from '../config.js';
import { fetchJson } from '../http.js';
import {
  airQualityUrl,
  type LiveAirTelemetry,
  type OpenMeteoAirQuality,
  type OpenMeteoWeather,
  toLiveTelemetry,
  weatherUrl,
} from '../openMeteo.js';
import { validateCoordinates } from '../security.js';

/** Live 48-hour AQI + weather telemetry, cached per ~1 km grid cell. */
export function airQualityRouter(): Router {
  const router = Router();
  const cache = new TtlLruCache<LiveAirTelemetry>(AQI_CACHE);

  router.get('/aqi', async (req, res) => {
    const coords = validateCoordinates(req.query.lat, req.query.lon);
    if (!coords.ok) {
      res.status(400).json({ error: coords.error });
      return;
    }
    const { lat, lon } = coords;
    const gridKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = cache.get(gridKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT').json(cached);
      return;
    }
    try {
      // Weather only refines inversion detection, so its failure must not fail the request.
      const [airQuality, weather] = await Promise.all([
        fetchJson<OpenMeteoAirQuality>(airQualityUrl(lat, lon)),
        fetchJson<OpenMeteoWeather>(weatherUrl(lat, lon)).catch(() => null),
      ]);
      const telemetry = toLiveTelemetry(airQuality, weather);
      cache.set(gridKey, telemetry);
      res.setHeader('X-Cache', 'MISS').json(telemetry);
    } catch {
      res.status(503).json({ error: 'Unable to fetch live Open-Meteo AQI & weather data.' });
    }
  });

  return router;
}
