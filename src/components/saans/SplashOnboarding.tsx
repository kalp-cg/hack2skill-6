import { ChevronLeft, ChevronRight, Flame, LocateFixed, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { LANG_LABELS, UI_COPY } from '../../data/i18n';
import { INDIAN_CITIES } from '../../data/saansData';
import type {
  AppLanguage,
  CityInfo,
  CommuteMode,
  CookingFuel,
  GoalType,
  HealthCondition,
  HeatingType,
  HomeType,
  SaansProfile,
} from '../../types/saans';

interface SplashOnboardingProps {
  language: AppLanguage;
  initialProfile: SaansProfile;
  onChangeLanguage: (lang: AppLanguage) => void;
  onComplete: (profile: SaansProfile, enableDemoSevere?: boolean) => void;
}

export function SplashOnboarding({ language, initialProfile, onChangeLanguage, onComplete }: SplashOnboardingProps) {
  const [stage, setStage] = useState<'splash' | 'wizard'>('splash');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [profile, setProfile] = useState<SaansProfile>(initialProfile);

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CityInfo[]>([]);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState(6);

  const copy = UI_COPY[language];

  async function handleAutoDetectGps() {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported in this browser. Pick a city below.');
      return;
    }
    setGeoStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resp = await fetch(`/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await resp.json();
          if (data.city) {
            setProfile((p) => ({ ...p, city: data.city }));
            setGeoStatus(`Detected: ${data.city.name} (${data.city.area})`);
          }
        } catch {
          setGeoStatus('Could not resolve area name; please select a city below.');
        }
      },
      () => {
        setGeoStatus('Location access declined. Search or select your city below.');
      },
      { timeout: 6000 }
    );
  }

  async function handleSearchCity(e: FormEvent) {
    e.preventDefault();
    if (cityQuery.trim().length < 2) return;
    setGeoStatus('Searching cities...');
    try {
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(cityQuery.trim())}`);
      const data = await resp.json();
      if (resp.ok && data.results?.length > 0) {
        setCityResults(data.results);
        setGeoStatus(null);
      } else {
        setCityResults([]);
        setGeoStatus('No matching city found. Try a nearby major city.');
      }
    } catch {
      setGeoStatus('Search temporarily unavailable. Pick one of the presets below.');
    }
  }

  function toggleCondition(cond: HealthCondition) {
    setProfile((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond],
    }));
  }

  function handleAddKid() {
    const clean = newKidName.trim();
    if (!clean) return;
    setProfile((prev) => ({
      ...prev,
      kids: [...prev.kids, { name: clean, age: Math.max(1, Math.min(17, newKidAge)) }],
    }));
    setNewKidName('');
  }

  if (stage === 'splash') {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SaansSaathi</span>
          </div>

          <fieldset
            aria-label="Choose language"
            className="min-w-0 flex items-center gap-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1"
          >
            {(['en', 'hi', 'gu'] as AppLanguage[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLanguage(code)}
                aria-pressed={language === code}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  language === code
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {LANG_LABELS[code]}
              </button>
            ))}
          </fieldset>
        </div>

        <main className="mx-auto my-auto w-full max-w-2xl py-10">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10">
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">SaansSaathi · {copy.tagline}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Breathe safer through winter smog—together.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{copy.splashSubtitle}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 border-y border-slate-200 dark:border-slate-800 py-5 sm:grid-cols-3 text-sm">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Personalized Plans</div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Calibrated for kids, elders, asthma, commute &amp; kitchen fuel.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Quantified Impact</div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Real µg/m³, kg CO₂, ₹ INR saved &amp; cigarette-equivalent math.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Grounded &amp; Offline-Ready</div>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  CPCB, WHO 2021 &amp; ICMR citations with EN / हिन्दी / ગુજરાતી voice.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStage('wizard')}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer transition-colors"
              >
                <span>{copy.startSetup}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onComplete({ ...profile, completedOnboarding: true }, true)}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-5 text-sm font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950 cursor-pointer transition-colors"
              >
                <Flame className="h-4 w-4" aria-hidden="true" />
                <span>{copy.tryDemoSevere}</span>
              </button>
            </div>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-2xl text-center text-xs text-slate-500 dark:text-slate-400">
          {copy.medicalDisclaimer}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Progress Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-base font-bold text-slate-900 dark:text-white">SaansSaathi</span>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Step {step} of 4 · ~60s setup
          </span>
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-teal-700 transition-all duration-200" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
          {/* STEP 1: LOCATION */}
          {step === 1 && (
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
                    <Search
                      className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
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
                        <span className="truncate text-[11px] text-slate-500 dark:text-slate-400 w-full">
                          {c.state}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HOUSEHOLD */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">2. Who are we protecting?</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Children, elders, and asthma/heart sensitivities change safe exposure limits.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="ob-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your First Name
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    value={profile.userName}
                    onChange={(e) => setProfile((p) => ({ ...p, userName: e.target.value }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="ob-adults" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Adults
                  </label>
                  <input
                    id="ob-adults"
                    type="number"
                    min={1}
                    max={10}
                    value={profile.adults}
                    onChange={(e) => setProfile((p) => ({ ...p, adults: Math.max(1, Number(e.target.value) || 1) }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="ob-elders" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Elders (60+ yrs)
                  </label>
                  <input
                    id="ob-elders"
                    type="number"
                    min={0}
                    max={8}
                    value={profile.elders}
                    onChange={(e) => setProfile((p) => ({ ...p, elders: Math.max(0, Number(e.target.value) || 0) }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Kids list */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Children in Household (Optional — personalizes school &amp; play safety)
                </div>
                {profile.kids.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.kids.map((k, idx) => (
                      <div
                        key={`${k.name}-${k.age}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium"
                      >
                        <span>
                          {k.name} ({k.age} yrs)
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${k.name}`}
                          onClick={() =>
                            setProfile((p) => ({
                              ...p,
                              kids: p.kids.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    aria-label="Child name"
                    value={newKidName}
                    onChange={(e) => setNewKidName(e.target.value)}
                    placeholder="Child name (e.g., Aarav)"
                    className="h-10 flex-1 min-w-[140px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  />
                  <input
                    type="number"
                    aria-label="Child age"
                    min={1}
                    max={17}
                    value={newKidAge}
                    onChange={(e) => setNewKidAge(Number(e.target.value) || 5)}
                    className="h-10 w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddKid}
                    className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Child
                  </button>
                </div>
              </div>

              {/* Health conditions & pets */}
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Health Sensitivities
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['asthma', 'Asthma'],
                      ['copd', 'COPD / Lung'],
                      ['heart', 'Heart / BP'],
                      ['pregnancy', 'Pregnancy'],
                    ] as Array<[HealthCondition, string]>
                  ).map(([id, label]) => {
                    const active = profile.conditions.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCondition(id)}
                        className={`min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 flex min-h-[44px] items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.hasPets}
                    onChange={(e) => setProfile((p) => ({ ...p, hasPets: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700"
                  />
                  <span>We have pets (dogs / cats) that go outdoors</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: LIFESTYLE & HOME */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  3. Commute, Kitchen &amp; Home Setup
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Powers exact INR savings, CO₂ avoided, and room-by-room indoor air hacks.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ob-commute"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Primary Commute Mode
                  </label>
                  <select
                    id="ob-commute"
                    value={profile.commuteMode}
                    onChange={(e) => setProfile((p) => ({ ...p, commuteMode: e.target.value as CommuteMode }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  >
                    <option value="car">Petrol / Diesel Car</option>
                    <option value="bike">Motorbike / Scooter</option>
                    <option value="metro">Metro Rail</option>
                    <option value="bus">City Bus</option>
                    <option value="carpool">Carpool</option>
                    <option value="cycle">Cycle</option>
                    <option value="walk">Walk</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ob-dist" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    One-Way Commute Distance (km)
                  </label>
                  <input
                    id="ob-dist"
                    type="number"
                    min={1}
                    max={80}
                    value={profile.commuteDistanceKm}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        commuteDistanceKm: Math.max(1, Number(e.target.value) || 5),
                      }))
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 font-mono text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ob-wfh" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Work-From-Home Days / Week
                  </label>
                  <input
                    id="ob-wfh"
                    type="number"
                    min={0}
                    max={5}
                    value={profile.wfhDaysPerWeek}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        wfhDaysPerWeek: Math.max(0, Math.min(5, Number(e.target.value) || 0)),
                      }))
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 font-mono text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="ob-cook" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cooking Fuel
                  </label>
                  <select
                    id="ob-cook"
                    value={profile.cookingFuel}
                    onChange={(e) => setProfile((p) => ({ ...p, cookingFuel: e.target.value as CookingFuel }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  >
                    <option value="lpg">LPG / Piped Gas</option>
                    <option value="induction">Electric / Induction</option>
                    <option value="biomass">Biomass / Wood / Coal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ob-heat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Winter Heating
                  </label>
                  <select
                    id="ob-heat"
                    value={profile.heating}
                    onChange={(e) => setProfile((p) => ({ ...p, heating: e.target.value as HeatingType }))}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                  >
                    <option value="none">None / Warm Blankets</option>
                    <option value="electric_heater">Electric Room Heater / Oil Radiator</option>
                    <option value="wood_coal">Wood / Coal Sigri / Fireplace</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ob-home" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Home Type &amp; Window Exposure
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <select
                      id="ob-home"
                      value={profile.homeType}
                      onChange={(e) => setProfile((p) => ({ ...p, homeType: e.target.value as HomeType }))}
                      className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-sm"
                    >
                      <option value="flat">Flat / Apt</option>
                      <option value="house">House</option>
                    </select>
                    <select
                      aria-label="Window facing"
                      value={profile.windowExposure}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          windowExposure: e.target.value as SaansProfile['windowExposure'],
                        }))
                      }
                      className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-sm"
                    >
                      <option value="main_road">Main Road</option>
                      <option value="courtyard">Courtyard</option>
                      <option value="park_facing">Park Facing</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasPurifier}
                  onChange={(e) => setProfile((p) => ({ ...p, hasPurifier: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700"
                />
                <span>We already have a HEPA air purifier at home</span>
              </label>
            </div>
          )}

          {/* STEP 4: GOALS */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  4. What matters most to your family?
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  SaansSaathi ranks your daily plan and alerts around your primary goal.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    ['health', 'Protect Health First', 'Minimize PM2.5 exposure for kids, elders & lungs.'],
                    ['emissions', 'Cut Community Emissions', 'Prioritize clean transit, zero-burn & RWA impact.'],
                    ['money', 'Save Money (Free / Low-Cost)', 'Zero-cost hacks and transit swaps that save ₹ INR.'],
                    ['all', 'All Three Balanced', 'Best mix of lung protection, CO₂ reduction & savings.'],
                  ] as Array<[GoalType, string, string]>
                ).map(([id, title, desc]) => {
                  const active = profile.goal === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setProfile((p) => ({ ...p, goal: id }))}
                      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
                      <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">{desc}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label htmlFor="ob-alert" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Smart Alert AQI Threshold (notify when AQI crosses {profile.alertThresholdAqi})
                </label>
                <input
                  id="ob-alert"
                  type="range"
                  min={100}
                  max={350}
                  step={25}
                  value={profile.alertThresholdAqi}
                  onChange={(e) => setProfile((p) => ({ ...p, alertThresholdAqi: Number(e.target.value) }))}
                  className="mt-2 w-full accent-teal-700"
                />
                <div className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>100 (Moderate)</span>
                  <span>200 (Poor)</span>
                  <span>300+ (Emergency)</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <button
              type="button"
              onClick={() => (step === 1 ? setStage('splash') : setStep((s) => (s - 1) as 1 | 2 | 3 | 4))}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onComplete({ ...profile, completedOnboarding: true }, false)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                <span>Open My Dashboard</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
