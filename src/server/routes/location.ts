import { Router } from 'express';
import type { CityInfo } from '../../types/saans.js';
import { TtlLruCache } from '../cache.js';
import { GEOCODE_CACHE } from '../config.js';
import { fetchJson } from '../http.js';
import { validateCoordinates, validateGeocodeQuery } from '../security.js';

interface OpenMeteoGeocodeResponse {
  results?: Array<{ id: number; name: string; admin1?: string; country?: string; latitude: number; longitude: number }>;
}

interface NominatimReverseResponse {
  address?: { city?: string; town?: string; suburb?: string; neighbourhood?: string; state?: string; country?: string };
}

/** City search (Open-Meteo geocoding) and GPS reverse geocoding (Nominatim). */
export function locationRouter(): Router {
  const router = Router();
  const searchCache = new TtlLruCache<CityInfo[]>(GEOCODE_CACHE);

  router.get('/geocode', async (req, res) => {
    const validated = validateGeocodeQuery(req.query.q);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    const cacheKey = validated.query.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT').json({ results: cached });
      return;
    }
    try {
      const data = await fetchJson<OpenMeteoGeocodeResponse>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(validated.query)}&count=6&language=en&format=json`
      );
      const results: CityInfo[] = (data.results ?? []).map((item) => ({
        id: `geo-${item.id}`,
        name: item.name,
        area: item.admin1 ?? item.name,
        state: item.country ?? '',
        lat: item.latitude,
        lon: item.longitude,
      }));
      searchCache.set(cacheKey, results);
      res.setHeader('X-Cache', 'MISS').json({ results });
    } catch {
      res.status(503).json({ error: 'City search temporarily unavailable.' });
    }
  });

  router.get('/reverse-geocode', async (req, res) => {
    const coords = validateCoordinates(req.query.lat, req.query.lon);
    if (!coords.ok) {
      res.status(400).json({ error: coords.error });
      return;
    }
    const { lat, lon } = coords;
    const id = `gps-${lat.toFixed(2)}-${lon.toFixed(2)}`;
    try {
      const { address = {} } = await fetchJson<NominatimReverseResponse>(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=12`,
        { headers: { 'User-Agent': 'SaansSaathi-AirQualityApp/1.0' } }
      );
      res.json({
        city: {
          id,
          name: address.city || address.town || address.state || 'Your Location',
          area: address.suburb || address.neighbourhood || 'Local Area',
          state: address.state || address.country || '',
          lat,
          lon,
        },
      });
    } catch {
      // Coordinates alone are still usable for AQI, so degrade to a generic label instead of failing.
      res.json({
        city: {
          id,
          name: 'Detected Location',
          area: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
          state: 'GPS',
          lat,
          lon,
        },
      });
    }
  });

  return router;
}
