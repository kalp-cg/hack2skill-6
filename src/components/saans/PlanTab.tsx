import { Calculator, CheckCircle2, ChevronRight, Home, Info, Leaf, Route, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ROOM_INDOOR_HACKS } from '../../data/saansData';
import type {
  ActionFeedbackState,
  AirSnapshot,
  CommuteOptionComparison,
  DailyPlanData,
  PlanRecommendation,
  RoomHack,
  SaansProfile,
} from '../../types/saans';
import { computeRoomCadr } from '../../utils/saansEngine';
import { layout, surface, text } from '../ui/styles';

interface PlanTabProps {
  profile: SaansProfile;
  air: AirSnapshot;
  plan: DailyPlanData;
  feedback: ActionFeedbackState;
  commuteAlternatives: CommuteOptionComparison[];
  isGeneratingPlan: boolean;
  planError: string | null;
  onGenerateAiPlan: () => void;
  onSelectAction: (action: PlanRecommendation) => void;
}

type CategoryFilter = 'all' | 'routine' | 'indoor' | 'sustainable';
type RoomFilter = 'bedroom' | 'kitchen' | 'kids_room';

export function PlanTab({
  profile,
  air,
  plan,
  feedback,
  commuteAlternatives,
  isGeneratingPlan,
  planError,
  onGenerateAiPlan,
  onSelectAction,
}: PlanTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [activeRoom, setActiveRoom] = useState<RoomFilter>('bedroom');
  const [roomSqFt, setRoomSqFt] = useState<number>(150);

  const filteredBlocks =
    categoryFilter === 'all' ? plan.blocks : plan.blocks.filter((b) => b.category === categoryFilter);

  const roomHacks: RoomHack[] = ROOM_INDOOR_HACKS.filter((h) => h.room === activeRoom);
  const recommendedCadr = computeRoomCadr(roomSqFt);

  const roomLabels: Record<RoomFilter, string> = {
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    kids_room: "Kids' Room",
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Today's AI Daily Smog Plan */}
      <section className={surface.panel}>
        <div className={layout.headerRow}>
          <div>
            <p className="text-xs font-medium text-teal-800 dark:text-teal-400">
              Morning · Commute · Afternoon · Evening · Night
            </p>
            <h1 className={text.pageTitle}>Today’s Personalized Smog Plan</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Tailored for {air.city.name} (AQI {air.aqi}) · {profile.commuteDistanceKm} km {profile.commuteMode} ·{' '}
              {profile.cookingFuel.toUpperCase()} kitchen
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateAiPlan}
            disabled={isGeneratingPlan}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isGeneratingPlan ? 'Re-Personalizing...' : 'Re-Generate AI Plan'}</span>
          </button>
        </div>

        {/* Category filter tabs */}
        <div
          role="tablist"
          aria-label="Filter daily plan by category"
          className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4"
        >
          {(
            [
              ['all', 'All Blocks'],
              ['routine', 'Low-Emission Routines'],
              ['indoor', 'Indoor Air Hacks'],
              ['sustainable', 'Sustainable Alternatives'],
            ] as Array<[CategoryFilter, string]>
          ).map(([key, label]) => {
            const active = categoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategoryFilter(key)}
                className={`min-h-[40px] rounded-xl px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {planError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-800 dark:text-rose-300"
          >
            {planError}
          </p>
        )}

        {plan.adaptedNote && (
          <div className="mt-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 p-3.5 text-xs text-teal-900 dark:text-teal-200">
            <span className="font-semibold">Feedback Adaptation: </span>
            {plan.adaptedNote}
          </div>
        )}

        {/* Timeline Blocks */}
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredBlocks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No blocks in this category right now. Select “All Blocks” to see your full schedule.
            </p>
          ) : (
            filteredBlocks.map((block) => {
              const isDone = feedback.doneIds.includes(block.id);
              const isSkipped = feedback.skippedIds.includes(block.id);
              const catLabel =
                block.category === 'routine'
                  ? 'Low-Emission Routine'
                  : block.category === 'indoor'
                    ? 'Indoor Air Hack'
                    : 'Sustainable Alternative';

              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => onSelectAction(block)}
                  className="flex w-full items-start justify-between gap-4 py-4 px-2 -mx-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        isDone ? 'text-teal-700 dark:text-teal-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{block.period}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{block.timeRange}</span>
                        <span>·</span>
                        <span>{catLabel}</span>
                        <span>·</span>
                        <span>Effort: {block.effort}</span>
                        {isSkipped && (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">· Skipped</span>
                        )}
                      </div>

                      <div
                        className={`mt-1 text-sm font-semibold ${
                          isDone ? 'text-teal-800 dark:text-teal-300 line-through' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {block.action}
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{block.why}</p>

                      <div className="mt-2 font-mono text-xs font-medium text-teal-800 dark:text-teal-400 tabular-nums">
                        -{block.impact.pm25_ug} µg/m³ PM2.5 · {block.impact.co2_kg} kg CO₂ · ₹{block.impact.inr} · ~
                        {block.impact.cigarettes_approx} cig eq.*
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Section 2: Room-Wise Indoor Air Hacks Engine + CADR Sizing Calculator */}
      <section className={surface.panel}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-400">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Indoor Air Quality Hacks Engine</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Room-by-Room Clean Air Playbook</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evidence-based low-cost hacks, myth-busting, and True HEPA CADR sizing for Indian flats.
            </p>
          </div>

          {/* Room Selector */}
          <div
            role="tablist"
            aria-label="Choose room for indoor air hacks"
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-1"
          >
            {(['bedroom', 'kitchen', 'kids_room'] as RoomFilter[]).map((room) => (
              <button
                key={room}
                type="button"
                role="tab"
                aria-selected={activeRoom === room}
                onClick={() => setActiveRoom(room)}
                className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  activeRoom === room
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {roomLabels[room]}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Purifier CADR Calculator */}
        <div className="mt-5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/35 p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-300">
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>Room Purifier CADR Sizing Calculator (5 Air Changes/Hr)</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label htmlFor="cadr-room-slider" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Room Area: <strong className="font-mono tabular-nums">{roomSqFt} sq ft</strong>
                </label>
                <input
                  id="cadr-room-slider"
                  type="range"
                  min={80}
                  max={450}
                  step={10}
                  value={roomSqFt}
                  onChange={(e) => setRoomSqFt(Number(e.target.value))}
                  className="w-48 flex-1 accent-teal-700"
                />
              </div>
            </div>

            <div className="flex items-baseline gap-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 px-4 py-3">
              <div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Min. True HEPA CADR</div>
                <div className="font-mono text-2xl font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                  {recommendedCadr} m³/h
                </div>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Formula: <span className="font-mono">sq ft × 1.35</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Hack Cards */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {roomHacks.map((hack) => (
            <article
              key={hack.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
            >
              {hack.imageUrl && (
                <div className="h-44 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img src={hack.imageUrl} alt={hack.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {hack.costLabel} · Cut ~{hack.pm25CutPct}% indoor PM2.5 · Effort: {hack.effort}
                </div>
                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">{hack.title}</h3>
                <p className={text.note}>{hack.summary}</p>

                {hack.mythBuster && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 p-3 text-xs text-amber-950 dark:text-amber-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                    <span>{hack.mythBuster}</span>
                  </div>
                )}

                <ol className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {hack.steps.map((stepText, idx) => (
                    <li key={stepText} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{idx + 1}.</span>
                      <span>{stepText}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  Source: {hack.source}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 3: Sustainable Alternatives Recommender */}
      <section className={surface.panel}>
        <div className={layout.headerRowBottom}>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-400">
              <Route className="h-4 w-4" aria-hidden="true" />
              <span>Sustainable Alternatives Recommender</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              Your {profile.commuteDistanceKm} km Commute Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculated for {Math.max(1, 5 - profile.wfhDaysPerWeek)} office days/week at current {air.city.name} PM2.5
              ({air.pm25} µg/m³).
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            Current mode: {profile.commuteMode.toUpperCase()}
          </span>
        </div>

        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard-focusable (WCAG 2.1.1). */}
        <section className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Commute comparison table">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold">Transport Option</th>
                <th className="px-3 py-3 font-semibold text-right">Est. Time</th>
                <th className="px-3 py-3 font-semibold text-right">Monthly Cost</th>
                <th className="px-3 py-3 font-semibold text-right">INR Saved</th>
                <th className="px-3 py-3 font-semibold text-right">Commute PM2.5</th>
                <th className="pl-3 py-3 font-semibold text-right">CO₂ Saved / Mo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {commuteAlternatives.map((opt) => (
                <tr
                  key={opt.mode}
                  className={
                    opt.recommended
                      ? 'bg-teal-50/50 dark:bg-teal-950/30'
                      : opt.isCurrent
                        ? 'bg-slate-50 dark:bg-slate-800/30'
                        : ''
                  }
                >
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {opt.label}
                      {opt.isCurrent && (
                        <span className="ml-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          (Current)
                        </span>
                      )}
                      {opt.recommended && (
                        <span className="ml-2 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                          · Recommended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {opt.oneWayMins} min
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                    ₹{opt.monthlyCostInr.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-semibold tabular-nums text-teal-800 dark:text-teal-400">
                    {opt.monthlySavingsInr > 0 ? `+₹${opt.monthlySavingsInr.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {opt.commutePm25UgM3} µg/m³
                  </td>
                  <td className="pl-3 py-3.5 text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {opt.monthlyCo2SavedKg > 0 ? `${opt.monthlyCo2SavedKg} kg` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Clean Cooking, Heating & Zero-Burn Community Swaps */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5 md:grid-cols-3">
          <div className={surface.outline}>
            <div className={text.eyebrowTight}>
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clean Kitchen Swap</span>
            </div>
            <p className={text.note}>
              Shifting boiling, tea &amp; slow simmering from LPG/biomass to a ₹2,200 induction cooktop cuts indoor NO₂
              by ~55% and saves ~18 kg CO₂/month.
            </p>
          </div>
          <div className={surface.outline}>
            <div className={text.eyebrowTight}>
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Zero Open Waste-Burning</span>
            </div>
            <p className={text.note}>
              Ask RWA security guards to replace night leaf/wood bonfires with electric oil heaters or thermal jackets—1
              bonfire spikes AQI across an entire lane.
            </p>
          </div>
          <div className={surface.outline}>
            <div className={text.eyebrowTight}>
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              <span>EV / CNG &amp; No-Idling</span>
            </div>
            <p className={text.note}>
              Switching off car engines at red lights (&gt;20s) and school pickup queues cuts local roadside PM2.5
              spikes right at children’s breathing height.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
