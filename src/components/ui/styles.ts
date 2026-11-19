/**
 * Shared Tailwind class tokens so repeated surfaces and text roles stay visually consistent
 * and can be restyled in one place.
 */
export const surface = {
  /** Top-level content card. */
  panel: 'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6',
  /** Secondary card inside a panel. */
  tile: 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5',
  /** Tinted box for grouped details. */
  inset: 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4',
  /** Plain outlined box. */
  outline: 'rounded-2xl border border-slate-200 dark:border-slate-800 p-4',
  /** Compact outlined box. */
  outlineCompact: 'rounded-xl border border-slate-200 dark:border-slate-800 p-3',
} as const;

export const text = {
  /** Large page/section heading. */
  pageTitle: 'mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white',
  /** Small teal label with an icon, shown above a heading. */
  eyebrow: 'flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-400',
  eyebrowTight: 'flex items-center gap-1.5 text-xs font-semibold text-teal-800 dark:text-teal-400',
  /** Supporting paragraph under a heading or metric. */
  note: 'mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300',
  /** Numeric metric value. */
  metric: 'mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums',
  /** Icon + label row in muted text. */
  iconRow: 'flex items-center gap-1.5 text-slate-700 dark:text-slate-300',
} as const;

export const layout = {
  /** Heading on the left, actions on the right (stacked on phones). */
  headerRow: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
  headerRowBottom: 'flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between',
} as const;
