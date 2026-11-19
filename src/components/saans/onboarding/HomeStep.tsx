import type { CommuteMode, CookingFuel, HeatingType, HomeType, SaansProfile } from '../../../types/saans';
import { fieldInputClass, fieldLabelClass, type OnboardingStepProps } from './types';

/** Step 3: commute, cooking fuel, heating and home exposure (drives cost, CO2 and indoor PM2.5 maths). */
export function HomeStep({ profile, setProfile }: OnboardingStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">3. Commute, Kitchen &amp; Home Setup</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Powers exact INR savings, CO₂ avoided, and room-by-room indoor air hacks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ob-commute" className={fieldLabelClass}>
            Primary Commute Mode
          </label>
          <select
            id="ob-commute"
            value={profile.commuteMode}
            onChange={(e) => setProfile((p) => ({ ...p, commuteMode: e.target.value as CommuteMode }))}
            className={fieldInputClass}
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
          <label htmlFor="ob-dist" className={fieldLabelClass}>
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
            className={`${fieldInputClass} font-mono`}
          />
        </div>

        <div>
          <label htmlFor="ob-wfh" className={fieldLabelClass}>
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
            className={`${fieldInputClass} font-mono`}
          />
        </div>

        <div>
          <label htmlFor="ob-cook" className={fieldLabelClass}>
            Cooking Fuel
          </label>
          <select
            id="ob-cook"
            value={profile.cookingFuel}
            onChange={(e) => setProfile((p) => ({ ...p, cookingFuel: e.target.value as CookingFuel }))}
            className={fieldInputClass}
          >
            <option value="lpg">LPG / Piped Gas</option>
            <option value="induction">Electric / Induction</option>
            <option value="biomass">Biomass / Wood / Coal</option>
          </select>
        </div>

        <div>
          <label htmlFor="ob-heat" className={fieldLabelClass}>
            Winter Heating
          </label>
          <select
            id="ob-heat"
            value={profile.heating}
            onChange={(e) => setProfile((p) => ({ ...p, heating: e.target.value as HeatingType }))}
            className={fieldInputClass}
          >
            <option value="none">None / Warm Blankets</option>
            <option value="electric_heater">Electric Room Heater / Oil Radiator</option>
            <option value="wood_coal">Wood / Coal Sigri / Fireplace</option>
          </select>
        </div>

        <div>
          <label htmlFor="ob-home" className={fieldLabelClass}>
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
  );
}
