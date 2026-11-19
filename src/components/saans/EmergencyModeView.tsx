import { ShieldAlert, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AirSnapshot, BestWorstHours, MemberRisk, SaansProfile } from '../../types/saans';

interface EmergencyModeViewProps {
  air: AirSnapshot;
  profile: SaansProfile;
  bestWorstHours: BestWorstHours;
  memberRisks: MemberRisk[];
  onExitEmergencyView: () => void;
}

export function EmergencyModeView({
  air,
  profile,
  bestWorstHours,
  memberRisks,
  onExitEmergencyView,
}: EmergencyModeViewProps) {
  const kidNames = profile.kids.map((k) => `${k.name} (${k.age}y)`).join(', ');

  const top5Actions = [
    'Keep all windows and balcony doors latched tight right now; press damp rolled towels across door/window gaps.',
    profile.hasPurifier
      ? 'Run your True HEPA purifier continuously on Medium/High in the main bedroom (30 cm off walls).'
      : 'Concentrate the family into one sealed interior room; avoid all incense, agarbatti, frying, or open flames.',
    kidNames
      ? `Cancel outdoor play, sports, and early morning school walks for ${kidNames}; keep rescue inhalers handy.`
      : 'Skip all outdoor running, brisk walking, or cycling—even healthy lungs absorb heavy PM2.5 dose above AQI 300.',
    'Wear a snug N95/KF94/N99 mask (pinch nose bridge tightly; no surgical/cloth masks) for any unavoidable outdoor step.',
    `If anyone has wheezing, chest tightness, or shortness of breath at rest, contact a doctor or clinic immediately.`,
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-300 dark:border-rose-800 bg-rose-700 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-100">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <span>Smog Emergency Mode · AQI &gt; 300</span>
          </div>
          <button
            type="button"
            onClick={onExitEmergencyView}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs font-semibold text-white hover:bg-white/25 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Full Dashboard</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-6">
          <div>
            <div className="font-mono text-6xl font-bold tabular-nums">{air.aqi}</div>
            <div className="text-sm font-medium text-rose-100">
              {air.city.name} · PM2.5 {air.pm25} µg/m³
            </div>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-rose-50">
            Hazardous winter inversion is trapping toxic fine smoke near ground level (~{air.mixingHeightM} m mixing height). Follow the 5 high-priority protections below until air improves.
          </p>
        </div>
      </div>

      {/* Top 5 Emergency Actions */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Top 5 Immediate Protective Actions
        </h2>
        <ol className="mt-4 space-y-3">
          {top5Actions.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 text-sm text-slate-800 dark:text-slate-200"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-700 font-mono text-xs font-bold text-white">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* School / Outdoor Advisory & Nearest Cleaner-Air Hours */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Household &amp; School Advisory
          </h3>
          <ul className="mt-3 space-y-3">
            {memberRisks.map((mr) => (
              <li
                key={mr.memberLabel}
                className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0 last:pb-0 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {mr.memberLabel}
                  </span>
                  <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">
                    {mr.risk} Risk
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{mr.guidance}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Clock className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
              <span>Nearest Cleaner-Air Hours</span>
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Today’s Dip</div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {bestWorstHours.bestStartLabel} – {bestWorstHours.bestEndLabel}
                </div>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  Est. AQI {bestWorstHours.bestAvgAqi}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Tomorrow Best</div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {bestWorstHours.tomorrowBestLabel}
                </div>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  Est. AQI {bestWorstHours.tomorrowBestAqi}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              30-Second N95 / N99 Seal Check
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>Mold nose wire firmly; check that exhaled air does not fog glasses.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>Ensure chin and cheek edges stay flush (cloth/surgical masks leak &gt;60%).</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
