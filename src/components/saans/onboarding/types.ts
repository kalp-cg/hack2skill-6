import type { Dispatch, SetStateAction } from 'react';
import type { SaansProfile } from '../../../types/saans';

/** Every wizard step edits the draft profile owned by SplashOnboarding. */
export interface OnboardingStepProps {
  profile: SaansProfile;
  setProfile: Dispatch<SetStateAction<SaansProfile>>;
}

export const fieldLabelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300';
export const fieldInputClass =
  'mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm';
