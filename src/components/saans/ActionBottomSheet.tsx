import { Check, SkipForward, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import type { PlanRecommendation } from '../../types/saans';
import { ModalShell } from '../ui/ModalShell';

interface ActionBottomSheetProps {
  action: PlanRecommendation | null;
  isDone: boolean;
  isSkipped: boolean;
  thumb?: 'up' | 'down';
  onClose: () => void;
  onMarkDone: (id: string) => void;
  onMarkSkip: (id: string) => void;
  onThumb: (id: string, vote: 'up' | 'down') => void;
}

export function ActionBottomSheet({
  action,
  isDone,
  isSkipped,
  thumb,
  onClose,
  onMarkDone,
  onMarkSkip,
  onThumb,
}: ActionBottomSheetProps) {
  if (!action) return null;

  const categoryLabel =
    action.category === 'routine'
      ? 'Low-Emission Routine'
      : action.category === 'indoor'
        ? 'Indoor Air Hack'
        : 'Sustainable Alternative';

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="sheet-action-title"
      panelClassName="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[88vh] overflow-y-auto"
    >
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-teal-800 dark:text-teal-400">
            {action.period} · {action.timeRange} · {categoryLabel} · Effort: {action.effort}
          </p>
          <h2 id="sheet-action-title" className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
            {action.action}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close action details"
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Why */}
      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Why This Works</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">{action.why}</p>
        </div>

        {/* Quantified Direct Impact */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Quantified Direct Impact (Engine-Computed)
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-[11px] text-slate-500">PM2.5 Avoided</div>
              <div className="mt-0.5 font-mono text-base font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                -{action.impact.pm25_ug} µg/m³
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-[11px] text-slate-500">CO₂ Saved</div>
              <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                {action.impact.co2_kg} kg
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-[11px] text-slate-500">Money Saved</div>
              <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                ₹{action.impact.inr}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div className="text-[11px] text-slate-500">Cig. Approx*</div>
              <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                -{action.impact.cigarettes_approx}
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            *Berkeley Earth rule-of-thumb approximation (~22 µg/m³ PM2.5 for 24h ≈ 1 cigarette).
          </p>
        </div>

        {/* Evidence Source & Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Source: </span>
            {action.evidence_source} · Confidence: {action.confidence}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Helpful suggestion"
              aria-pressed={thumb === 'up'}
              onClick={() => onThumb(action.id, 'up')}
              className={`flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border cursor-pointer ${
                thumb === 'up'
                  ? 'border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Not practical for me"
              aria-pressed={thumb === 'down'}
              onClick={() => onThumb(action.id, 'down')}
              className={`flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border cursor-pointer ${
                thumb === 'down'
                  ? 'border-rose-700 bg-rose-50 dark:bg-rose-950 text-rose-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Primary CTAs */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onMarkDone(action.id);
            onClose();
          }}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer transition-colors"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>{isDone ? 'Completed' : 'Do It Now (+Smog Score)'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onMarkSkip(action.id);
            onClose();
          }}
          className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          <span>{isSkipped ? 'Skipped' : 'Skip (Adapt)'}</span>
        </button>
      </div>
    </ModalShell>
  );
}
