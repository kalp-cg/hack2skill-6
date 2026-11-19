import type { GoalType } from '../../../types/saans';
import { fieldLabelClass, type OnboardingStepProps } from './types';

const GOALS: Array<[GoalType, string, string]> = [
  ['health', 'Protect Health First', 'Minimize PM2.5 exposure for kids, elders & lungs.'],
  ['emissions', 'Cut Community Emissions', 'Prioritize clean transit, zero-burn & RWA impact.'],
  ['money', 'Save Money (Free / Low-Cost)', 'Zero-cost hacks and transit swaps that save ₹ INR.'],
  ['all', 'All Three Balanced', 'Best mix of lung protection, CO₂ reduction & savings.'],
];

/** Step 4: primary goal (ranks the plan) and the smart-alert AQI threshold. */
export function GoalsStep({ profile, setProfile }: OnboardingStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">4. What matters most to your family?</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          SaansSaathi ranks your daily plan and alerts around your primary goal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOALS.map(([id, title, desc]) => {
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
        <label htmlFor="ob-alert" className={fieldLabelClass}>
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
  );
}
