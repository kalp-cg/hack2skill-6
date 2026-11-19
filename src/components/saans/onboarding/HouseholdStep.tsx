import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { HealthCondition } from '../../../types/saans';
import { surface } from '../../ui/styles';
import { fieldInputClass, fieldLabelClass, type OnboardingStepProps } from './types';

const CONDITIONS: Array<[HealthCondition, string]> = [
  ['asthma', 'Asthma'],
  ['copd', 'COPD / Lung'],
  ['heart', 'Heart / BP'],
  ['pregnancy', 'Pregnancy'],
];

/** Step 2: who lives at home (kids, elders, health sensitivities, pets). */
export function HouseholdStep({ profile, setProfile }: OnboardingStepProps) {
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState(6);

  function toggleCondition(condition: HealthCondition) {
    setProfile((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  }

  function handleAddKid() {
    const name = newKidName.trim();
    if (!name) return;
    setProfile((prev) => ({ ...prev, kids: [...prev.kids, { name, age: Math.max(1, Math.min(17, newKidAge)) }] }));
    setNewKidName('');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">2. Who are we protecting?</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Children, elders, and asthma/heart sensitivities change safe exposure limits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ob-name" className={fieldLabelClass}>
            Your First Name
          </label>
          <input
            id="ob-name"
            type="text"
            value={profile.userName}
            onChange={(e) => setProfile((p) => ({ ...p, userName: e.target.value }))}
            className={fieldInputClass}
          />
        </div>
        <div>
          <label htmlFor="ob-adults" className={fieldLabelClass}>
            Adults
          </label>
          <input
            id="ob-adults"
            type="number"
            min={1}
            max={10}
            value={profile.adults}
            onChange={(e) => setProfile((p) => ({ ...p, adults: Math.max(1, Number(e.target.value) || 1) }))}
            className={`${fieldInputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="ob-elders" className={fieldLabelClass}>
            Elders (60+ yrs)
          </label>
          <input
            id="ob-elders"
            type="number"
            min={0}
            max={8}
            value={profile.elders}
            onChange={(e) => setProfile((p) => ({ ...p, elders: Math.max(0, Number(e.target.value) || 0) }))}
            className={`${fieldInputClass} font-mono`}
          />
        </div>
      </div>

      {/* Kids list */}
      <div className={`${surface.outline} space-y-3`}>
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
        <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Health Sensitivities</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONDITIONS.map(([id, label]) => {
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
  );
}
