import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Flame,
  RefreshCw,
} from 'lucide-react';
import {
  ActionFeedbackState,
  AirSnapshot,
  AppLanguage,
  AqiBand,
  BestWorstHours,
  DailyPlanData,
  InversionWarning,
  MemberRisk,
  PlanRecommendation,
  SaansProfile,
} from '../../types/saans';
import { UI_COPY } from '../../data/i18n';
import { AqiRingGauge } from './AqiRingGauge';

interface TodayTabProps {
  language: AppLanguage;
  profile: SaansProfile;
  air: AirSnapshot;
  band: AqiBand;
  inversion: InversionWarning;
  bestWorstHours: BestWorstHours;
  memberRisks: MemberRisk[];
  plan: DailyPlanData;
  feedback: ActionFeedbackState;
  isGeneratingPlan: boolean;
  planError: string | null;
  isLoadingAir: boolean;
  demoSevereMode: boolean;
  onToggleDemoSevere: () => void;
  onRefreshAir: () => void;
  onGenerateAiPlan: () => void;
  onOpenEmergency: () => void;
  onSelectAction: (action: PlanRecommendation) => void;
  onOpenFullPlan: () => void;
}

export function TodayTab({
  language,
  profile,
  air,
  band,
  inversion,
  bestWorstHours,
  memberRisks,
  plan,
  feedback,
  isGeneratingPlan,
  planError,
  isLoadingAir,
  demoSevereMode,
  onToggleDemoSevere,
  onRefreshAir,
  onGenerateAiPlan,
  onOpenEmergency,
  onSelectAction,
  onOpenFullPlan,
}: TodayTabProps) {
  const copy = UI_COPY[language];
  const kidName = profile.kids[0]?.name;
  const warmGreeting = kidName
    ? `Let's keep ${kidName}'s lungs safe today, ${profile.userName || 'Friend'}.`
    : `Let's keep your family's lungs safe today, ${profile.userName || 'Friend'}.`;

  // Compact 48h series (every 2 hours for clean mobile & desktop rendering)
  const chartData = air.forecast48h
    .filter((_, idx) => idx % 2 === 0)
    .map((pt) => ({
      name: `${pt.dayLabel === 'Today' ? 'D1' : 'D2'} ${pt.label}`,
      shortLabel: pt.label,
      aqi: pt.aqi,
      pm25: pt.pm25,
    }));

  return (
    <div className="space-y-6">
      {/* Smog Emergency Mode Banner when AQI > 300 */}
      {band.isEmergency && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-700 p-4 text-white sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold">{copy.emergencyBanner}</div>
              <p className="text-xs text-rose-100">
                CPCB AQI {air.aqi} in {air.city.name}. Tap for minimal top-5 emergency checklist &amp; mask guide.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[42px] rounded-xl bg-white px-4 text-xs font-bold text-rose-800 hover:bg-rose-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copy.emergencyBtn}
          </button>
        </div>
      )}

      {/* Human Greeting + Demo Scenario Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {air.city.name} ({air.city.area}) ·{' '}
            {air.source === 'demo-delhi-severe'
              ? 'Demo: Delhi Winter Smog'
              : air.source === 'open-meteo-live'
                ? 'Live Open-Meteo Telemetry'
                : 'Cached Offline Baseline'}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {warmGreeting}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleDemoSevere}
            aria-pressed={demoSevereMode}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              demoSevereMode
                ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{demoSevereMode ? 'Exit Delhi Demo' : 'Demo: Delhi Winter Smog'}</span>
          </button>

          <button
            type="button"
            onClick={onRefreshAir}
            disabled={isLoadingAir}
            aria-label="Refresh live AQI"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAir ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Hero Grid: Left AQI Ring & AI Summary | Right Inversion & Best Outdoor Window */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-7">
          <AqiRingGauge air={air} band={band} />

          {/* One-line AI Summary */}
          <div className={`mt-6 rounded-2xl border p-4 ${band.bgClass} ${band.borderClass}`}>
            <div className={`text-xs font-semibold ${band.textClass}`}>SaansSaathi Daily Brief</div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
              {plan.oneLineSummary}
            </p>
          </div>
        </section>

        {/* Right Side: Best Hour to Go Out + Thermal Inversion + Household Risks */}
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-5">
          <div className="space-y-4">
            {/* Best Time to Go Out */}
            <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-900 dark:text-teal-300">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.bestTimeOut}</span>
                </span>
                <span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300 tabular-nums">
                  Est. AQI {bestWorstHours.bestAvgAqi}
                </span>
              </div>
              <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {bestWorstHours.bestStartLabel} – {bestWorstHours.bestEndLabel}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Avoid peak trapping around {bestWorstHours.worstLabel} (AQI {bestWorstHours.worstAqi}). Tomorrow’s cleanest window: {bestWorstHours.tomorrowBestLabel}.
              </p>
            </div>

            {/* Winter Inversion / Low Mixing-Height Warning */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {inversion.headline}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    inversion.severity === 'Severe'
                      ? 'text-rose-700 dark:text-rose-400'
                      : inversion.severity === 'Moderate'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {inversion.severity}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {inversion.explanation}
              </p>
            </div>
          </div>

          {/* Household Member Risk Matrix */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Household Protection Radar
            </div>
            <div className="mt-2 space-y-2">
              {memberRisks.slice(0, 3).map((mr) => (
                <div key={mr.memberLabel} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {mr.memberLabel}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      mr.risk === 'Critical'
                        ? 'text-rose-700 dark:text-rose-400'
                        : mr.risk === 'High'
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-teal-700 dark:text-teal-400'
                    }`}
                  >
                    {mr.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 48-Hour AQI Forecast Chart (Recharts) */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              48-Hour AQI Forecast
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plan errands, school runs, and window airing around afternoon smog dips (CPCB scale).
            </p>
          </div>
          <span className="font-mono text-xs text-teal-700 dark:text-teal-400 tabular-nums">
            Best window today: {bestWorstHours.bestStartLabel}–{bestWorstHours.bestEndLabel}
          </span>
        </div>

        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={band.colorHex} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={band.colorHex} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={3}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'dataMax + 30']}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={300} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Emergency 300', position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }} />
              <Area
                type="monotone"
                dataKey="aqi"
                name="CPCB AQI"
                stroke={band.colorHex}
                strokeWidth={2.5}
                fill="url(#aqiAreaFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Today's Smog Plan Preview + 5-Minute Win */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {copy.todaysPlanTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any card for Why, Engine Impact, Citation &amp; one-tap check-in ·{' '}
              {plan.source === 'gemini-ai' ? 'AI Personalized (RAG)' : 'Deterministic Baseline'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGenerateAiPlan}
              disabled={isGeneratingPlan}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isGeneratingPlan ? 'Personalizing...' : copy.generateAiPlan}</span>
            </button>
            <button
              type="button"
              onClick={onOpenFullPlan}
              className="inline-flex min-h-[42px] items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>All Hacks</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {planError && (
          <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-800 dark:text-rose-300">
            {planError}
          </p>
        )}

        {plan.adaptedNote && (
          <p className="mt-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 p-3 text-xs text-teal-900 dark:text-teal-200">
            {plan.adaptedNote}
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {plan.blocks.map((block) => {
            const isDone = feedback.doneIds.includes(block.id);
            const isSkipped = feedback.skippedIds.includes(block.id);
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => onSelectAction(block)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 -mx-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      isDone
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {block.period}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{block.timeRange}</span>
                      <span>·</span>
                      <span>{block.effort}</span>
                      {isSkipped && <span className="text-amber-700 dark:text-amber-400">· Skipped</span>}
                    </div>
                    <div
                      className={`mt-0.5 text-sm font-semibold ${
                        isDone
                          ? 'text-teal-800 dark:text-teal-300 line-through'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {block.action}
                    </div>
                    <div className="mt-1 font-mono text-xs text-teal-700 dark:text-teal-400 tabular-nums">
                      -{block.impact.pm25_ug} µg/m³ · {block.impact.co2_kg} kg CO₂ · ₹{block.impact.inr}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Today's 5-Minute Win */}
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
          <div className="text-xs font-semibold text-teal-800 dark:text-teal-400">
            Today’s 5-Minute Win
          </div>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{plan.todaysWin}</p>
        </div>
      </section>
    </div>
  );
}
