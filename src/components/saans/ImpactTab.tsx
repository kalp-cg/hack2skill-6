import { ChevronDown, ChevronUp, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AirSnapshot, CommuteMode, ImpactReport, SaansProfile, WhatIfInputs } from '../../types/saans';
import { layout, surface, text } from '../ui/styles';

interface ImpactTabProps {
  profile: SaansProfile;
  air: AirSnapshot;
  whatIf: WhatIfInputs;
  report: ImpactReport;
  completedCount: number;
  onChangeWhatIf: (next: WhatIfInputs) => void;
}

const COMMUTE_LABELS: Array<{ value: CommuteMode; label: string }> = [
  { value: 'metro', label: 'Electric Metro' },
  { value: 'carpool', label: '3x Carpool' },
  { value: 'bus', label: 'AC / CNG Bus' },
  { value: 'car', label: 'Solo Car' },
  { value: 'bike', label: 'Two-Wheeler' },
  { value: 'cycle', label: 'Cycle' },
];

export function ImpactTab({ profile, air, whatIf, report, completedCount, onChangeWhatIf }: ImpactTabProps) {
  const [showFormulas, setShowFormulas] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Row: Smog Score + 7-Day Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className={`${surface.panel} lg:col-span-5 flex flex-col justify-between`}>
          <div>
            <p className="text-xs font-semibold text-teal-800 dark:text-teal-400">
              Direct Impact Explainer · Why This Matters
            </p>
            <h1 className={text.pageTitle}>Your Smog Score</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-6xl font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                {report.smogScore}
              </span>
              <span className="font-mono text-lg font-semibold text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Combines your indoor filtration, N95 mask compliance, low-emission commute, and{' '}
              <strong className="font-mono">{completedCount}</strong> completed daily plan actions.
            </p>
          </div>

          {/* "If you do these 3 things" Highlight */}
          <div className="mt-6 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-300">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Top-3 Habit Projection</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              If you do these 3 things (Metro/Carpool + 12h Purifier/Seal + N95), you cut{' '}
              <span className="font-mono text-teal-800 dark:text-teal-300 tabular-nums">{report.top3CutPct}%</span> of
              your daily PM2.5 exposure.
            </p>
          </div>
        </section>

        {/* Weekly Trend Chart */}
        <section className={`${surface.panel} lg:col-span-7`}>
          <div className={layout.headerRowBottom}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">7-Day Smog Score Trend</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Higher Smog Score directly tracks lower 24-hour inhaled PM2.5 in {air.city.name}.
              </p>
            </div>
            <span className="font-mono text-xs text-teal-800 dark:text-teal-400 tabular-nums">
              Indoor PM2.5: {report.baselineIndoorPm25} → {report.projectedIndoorPm25} µg/m³
            </span>
          </div>

          <div className="mt-4 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.weeklyTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="smogScoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Smog Score"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  fill="url(#smogScoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 4 Quantified Direct Impact Metric Cards */}
      <section aria-label="Quantified personal impact metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={surface.tile}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Exposure Cut (24h Avg)</div>
          <div className="mt-1.5 font-mono text-3xl font-bold text-teal-800 dark:text-teal-400 tabular-nums">
            -{report.exposureCutPct}%
          </div>
          <div className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            -{report.pm25AvoidedUgM3} µg/m³ avoided
          </div>
        </div>

        <div className={surface.tile}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Cigarette-Equivalent*</div>
          <div className="mt-1.5 font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            -{report.cigarettesAvoidedPerWeekApprox}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">approx. cigarettes avoided / week</div>
        </div>

        <div className={surface.tile}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">CO₂ Emissions Saved</div>
          <div className="mt-1.5 font-mono text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {report.monthlyCo2SavedKg} kg
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            per month ({profile.commuteDistanceKm} km trip)
          </div>
        </div>

        <div className={surface.tile}>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Money Saved (INR)</div>
          <div className="mt-1.5 font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            ₹{report.monthlyMoneySavedInr.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">per month on transit &amp; fuel</div>
        </div>
      </section>

      {/* Interactive What-If Simulator */}
      <section className={surface.panel}>
        <div className={text.eyebrow}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>Interactive What-If Simulator</span>
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
          Test Your Habits &amp; See Instant Exposure Math
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Adjust commute mode, purifier runtime, N95 mask compliance, and clean cooking/sealing to watch your Smog Score
          and lung dose respond live.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Commute Mode Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              1. Simulated Commute Mode ({profile.commuteDistanceKm} km one-way)
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COMMUTE_LABELS.map((item) => {
                const active = whatIf.commuteMode === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeWhatIf({ ...whatIf, commuteMode: item.value })}
                    className={`min-h-[42px] rounded-xl border px-3 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      active
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-3 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={whatIf.cleanCookingAndSeal}
                onChange={(e) => onChangeWhatIf({ ...whatIf, cleanCookingAndSeal: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span>Run kitchen chimney + damp-cloth draft sealing + zero indoor incense (-28% indoor PM2.5)</span>
            </label>
          </div>

          {/* Sliders: Purifier Hours & N95 Mask */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim-purifier-hours" className="font-semibold text-slate-700 dark:text-slate-200">
                  2. Indoor HEPA / DIY Purifier Runtime
                </label>
                <span className="font-mono font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                  {whatIf.purifierHours} hrs / day
                </span>
              </div>
              <input
                id="sim-purifier-hours"
                type="range"
                min={0}
                max={24}
                step={1}
                value={whatIf.purifierHours}
                onChange={(e) => onChangeWhatIf({ ...whatIf, purifierHours: Number(e.target.value) })}
                className="mt-2 w-full accent-teal-700"
              />
              <div className="flex justify-between font-mono text-[11px] text-slate-500">
                <span>0h (None)</span>
                <span>8h (Sleep)</span>
                <span>16h (Home)</span>
                <span>24h (All Day)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="sim-mask-pct" className="font-semibold text-slate-700 dark:text-slate-200">
                  3. Fitted N95 / N99 Mask Outdoors
                </label>
                <span className="font-mono font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                  {whatIf.maskCompliancePct}% of outdoor time
                </span>
              </div>
              <input
                id="sim-mask-pct"
                type="range"
                min={0}
                max={100}
                step={5}
                value={whatIf.maskCompliancePct}
                onChange={(e) => onChangeWhatIf({ ...whatIf, maskCompliancePct: Number(e.target.value) })}
                className="mt-2 w-full accent-teal-700"
              />
              <div className="flex justify-between font-mono text-[11px] text-slate-500">
                <span>0%</span>
                <span>50% (Commute)</span>
                <span>100% (All Outdoor)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable "How we calculated this" Transparency Panel */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          aria-expanded={showFormulas}
          onClick={() => setShowFormulas((prev) => !prev)}
          className="flex min-h-[56px] w-full items-center justify-between px-6 py-4 text-left cursor-pointer"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              How we calculated this (Formulas &amp; Assumptions)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All numbers are computed deterministically in code before AI narration—zero hallucinated math.
            </p>
          </div>
          {showFormulas ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
          )}
        </button>

        {showFormulas && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-5 space-y-4">
            {report.formulas.map((f) => (
              <div key={f.name} className={surface.inset}>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</div>
                <div className="mt-1 font-mono text-xs text-teal-800 dark:text-teal-400">{f.formula}</div>
                <p className={text.note}>{f.assumption}</p>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              *Berkeley Earth rule of thumb (~22 µg/m³ PM2.5 over 24h ≈ 1 cigarette) is labeled as an epidemiological
              approximation for public intuition, not clinical diagnosis.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
