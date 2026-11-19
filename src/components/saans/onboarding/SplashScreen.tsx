import { ChevronRight, Flame } from 'lucide-react';
import { LANG_LABELS, UI_COPY } from '../../../data/i18n';
import type { AppLanguage } from '../../../types/saans';
import { surface } from '../../ui/styles';

interface SplashScreenProps {
  language: AppLanguage;
  onChangeLanguage: (language: AppLanguage) => void;
  onStartSetup: () => void;
  onTryDemo: () => void;
}

/** First screen: value proposition, language choice, and the two ways in (setup or instant demo). */
export function SplashScreen({ language, onChangeLanguage, onStartSetup, onTryDemo }: SplashScreenProps) {
  const copy = UI_COPY[language];
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SaansSaathi</span>
        </div>

        <fieldset
          aria-label="Choose language"
          className="min-w-0 flex items-center gap-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1"
        >
          {(['en', 'hi', 'gu'] as AppLanguage[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onChangeLanguage(code)}
              aria-pressed={language === code}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                language === code
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {LANG_LABELS[code]}
            </button>
          ))}
        </fieldset>
      </div>

      <main className="mx-auto my-auto w-full max-w-2xl py-10">
        <div className={`${surface.panel} sm:p-10`}>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">SaansSaathi · {copy.tagline}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Breathe safer through winter smog—together.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{copy.splashSubtitle}</p>

          <div className="mt-6 grid grid-cols-1 gap-3 border-y border-slate-200 dark:border-slate-800 py-5 sm:grid-cols-3 text-sm">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Personalized Plans</div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Calibrated for kids, elders, asthma, commute &amp; kitchen fuel.
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Quantified Impact</div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Real µg/m³, kg CO₂, ₹ INR saved &amp; cigarette-equivalent math.
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Grounded &amp; Offline-Ready</div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                CPCB, WHO 2021 &amp; ICMR citations with EN / हिन्दी / ગુજરાતી voice.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStartSetup}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer transition-colors"
            >
              <span>{copy.startSetup}</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onTryDemo}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-5 text-sm font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950 cursor-pointer transition-colors"
            >
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span>{copy.tryDemoSevere}</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-2xl text-center text-xs text-slate-500 dark:text-slate-400">
        {copy.medicalDisclaimer}
      </footer>
    </div>
  );
}
