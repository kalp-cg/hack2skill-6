import { LocateFixed, MapPin, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { INDIAN_CITIES } from '../../../data/saansData';
import { reverseGeocode, searchCities } from '../../../lib/api';
import type { CityInfo } from '../../../types/saans';
import type { OnboardingStepProps } from './types';

/** Step 1: home location via GPS, free-text search or a preset city. */
export function LocationStep({ profile, setProfile }: OnboardingStepProps) {
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityInfo[]>([]);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  function handleAutoDetectGps() {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported in this browser. Pick a city below.');
      return;
    }
    setGeoStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const city = await reverseGeocode(coords.latitude, coords.longitude);
          setProfile((p) => ({ ...p, city }));
          setGeoStatus(`Detected: ${city.name} (${city.area})`);
        } catch {
          setGeoStatus('Could not resolve area name; please select a city below.');
        }
      },
      () => setGeoStatus('Location access declined. Search or select your city below.'),
      { timeout: 6000 }
    );
  }

  async function handleSearchCity(e: FormEvent) {
    e.preventDefault();
    const query = cityQuery.trim();
    if (query.length < 2) return;
    setGeoStatus('Searching cities...');
    try {
      const results = await searchCities(query);
      setCityResults(results);
      setGeoStatus(results.length > 0 ? null : 'No matching city found. Try a nearby major city.');
    } catch {
      setGeoStatus('Search temporarily unavailable. Pick one of the presets below.');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">1. Where is your home?</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          We fetch live local AQI, 48-hour forecast, and winter thermal inversion alerts for your area.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAutoDetectGps}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 px-4 text-sm font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-100 cursor-pointer"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          <span>Auto-Detect Location</span>
        </button>

        <form onSubmit={handleSearchCity} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <label htmlFor="onboard-city-search" className="sr-only">
              Search city or neighborhood
            </label>
            <input
              id="onboard-city-search"
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search city (e.g., Jaipur, Pune, Patna)..."
              className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {geoStatus && <p className="text-xs font-medium text-teal-800 dark:text-teal-300">{geoStatus}</p>}

      {cityResults.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {cityResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setProfile((p) => ({ ...p, city: c }));
                setCityResults([]);
              }}
              className="flex w-full min-h-[44px] items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
            >
              <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
              <span className="text-xs text-slate-500">
                {c.area}, {c.state}
              </span>
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Selected: {profile.city.name} ({profile.city.area})
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INDIAN_CITIES.map((c) => {
            const active = profile.city.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, city: c }))}
                className={`flex min-h-[48px] flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {c.name}
                </span>
                <span className="truncate text-[11px] text-slate-500 dark:text-slate-400 w-full">{c.state}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
