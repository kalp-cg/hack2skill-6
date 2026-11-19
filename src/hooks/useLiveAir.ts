import { useCallback, useEffect, useState } from 'react';
import { getFallbackAirSnapshot } from '../data/saansData';
import { fetchLiveAir } from '../lib/api';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage';
import type { AirSnapshot, CityInfo } from '../types/saans';

/**
 * Live AQI telemetry for `city`, refreshed whenever the city changes while `enabled`.
 * Offline-first: starts from the last cached reading and keeps it if a refresh fails.
 */
export function useLiveAir(city: CityInfo, enabled: boolean) {
  const [liveAir, setLiveAir] = useState<AirSnapshot>(
    () => readJson<AirSnapshot | null>(STORAGE_KEYS.cachedAir, null) ?? getFallbackAirSnapshot(city)
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await fetchLiveAir(city);
      setLiveAir(snapshot);
      writeJson(STORAGE_KEYS.cachedAir, snapshot);
    } catch {
      // Keep the cached reading for the same city; otherwise show typical values for the new one.
      setLiveAir((previous) => (previous.city.id === city.id ? previous : getFallbackAirSnapshot(city)));
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { liveAir, isLoading, refresh };
}
