import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { AppLanguage, SaansProfile } from '../../types/saans';
import { GoalsStep } from './onboarding/GoalsStep';
import { HomeStep } from './onboarding/HomeStep';
import { HouseholdStep } from './onboarding/HouseholdStep';
import { LocationStep } from './onboarding/LocationStep';
import { SplashScreen } from './onboarding/SplashScreen';

interface SplashOnboardingProps {
  language: AppLanguage;
  initialProfile: SaansProfile;
  onChangeLanguage: (lang: AppLanguage) => void;
  onComplete: (profile: SaansProfile, enableDemoSevere?: boolean) => void;
}

const STEPS = [LocationStep, HouseholdStep, HomeStep, GoalsStep];

/** Splash screen, then a 4-step (~60 s) wizard that builds the household profile. */
export function SplashOnboarding({ language, initialProfile, onChangeLanguage, onComplete }: SplashOnboardingProps) {
  const [stage, setStage] = useState<'splash' | 'wizard'>('splash');
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<SaansProfile>(initialProfile);

  const finish = (enableDemoSevere: boolean) => onComplete({ ...profile, completedOnboarding: true }, enableDemoSevere);

  if (stage === 'splash') {
    return (
      <SplashScreen
        language={language}
        onChangeLanguage={onChangeLanguage}
        onStartSetup={() => setStage('wizard')}
        onTryDemo={() => finish(true)}
      />
    );
  }

  const CurrentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Progress Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-base font-bold text-slate-900 dark:text-white">SaansSaathi</span>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Step {step} of {STEPS.length} · ~60s setup
          </span>
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-teal-700 transition-all duration-200"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
          <CurrentStep profile={profile} setProfile={setProfile} />

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <button
              type="button"
              onClick={() => (step === 1 ? setStage('splash') : setStep(step - 1))}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </button>

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finish(false)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                <span>Open My Dashboard</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
