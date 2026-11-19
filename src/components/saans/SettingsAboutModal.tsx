import { useEffect, useState } from 'react';
import { X, Moon, Sun, Eye, Type as TypeIcon, RotateCcw, Flame, Cpu, CheckCircle2 } from 'lucide-react';
import { AppLanguage, SaansProfile } from '../../types/saans';
import { LANG_LABELS } from '../../data/i18n';
import { INDIAN_CITIES } from '../../data/saansData';
import { PWAInstallButton } from './PwaControls';

interface SettingsAboutModalProps {
  isOpen: boolean;
  initialView: 'settings' | 'about';
  language: AppLanguage;
  profile: SaansProfile;
  darkMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  demoSevereMode: boolean;
  onClose: () => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onUpdateProfile: (next: SaansProfile) => void;
  onToggleDarkMode: () => void;
  onToggleLargeText: () => void;
  onToggleHighContrast: () => void;
  onToggleDemoSevere: () => void;
  onRedoOnboarding: () => void;
}

const PROBLEM_MAPPING = [
  {
    pillar: '1. Low-Emission Daily Routines',
    features: 'Today’s 5-block Smog Plan (Morning/Commute/Afternoon/Evening/Night), best-hour scheduling, no-idling, wet mopping & daily streaks.',
  },
  {
    pillar: '2. Indoor Air Quality Hacks',
    features: 'Room-wise Indoor Air Playbook (Bedroom, Kitchen, Kids’ Room), CADR room calculator, DIY MERV-13 filter guide, damp-cloth sealing & indoor-plant/cloth-mask myth-busting.',
  },
  {
    pillar: '3. Sustainable Alternatives',
    features: 'Commute Comparator (car vs metro vs carpool vs bus vs bike vs cycle in ₹ INR, mins, PM2.5 & CO₂), clean cooking swaps & RWA zero waste-burning circles.',
  },
  {
    pillar: '4. Location + Lifestyle Personalization',
    features: '60-second onboarding (GPS/city search, kids’ ages, elders, asthma/COPD/heart/pregnancy, pets, commute km, WFH, kitchen fuel, floor & window facing) + adaptive plan feedback loop.',
  },
  {
    pillar: '5. Explaining Direct Impact',
    features: 'Your Smog Score (0–100) + 7-day trend, What-If Simulator sliders, exact µg/m³ avoided, kg CO₂, ₹ INR saved, Berkeley Earth cigarette-equivalent approximation & expandable “How we calculated this” formulas.',
  },
];

export function SettingsAboutModal({
  isOpen,
  initialView,
  language,
  profile,
  darkMode,
  largeText,
  highContrast,
  demoSevereMode,
  onClose,
  onChangeLanguage,
  onUpdateProfile,
  onToggleDarkMode,
  onToggleLargeText,
  onToggleHighContrast,
  onToggleDemoSevere,
  onRedoOnboarding,
}: SettingsAboutModalProps) {
  const [view, setView] = useState<'settings' | 'about'>(initialView);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings and About SaansSaathi"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setView('settings')}
              className={`min-h-[38px] rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                view === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Settings &amp; Accessibility
            </button>
            <button
              type="button"
              onClick={() => setView('about')}
              className={`min-h-[38px] rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                view === 'about'
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              About &amp; How It Works
            </button>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {view === 'settings' ? (
          <div className="mt-5 space-y-6">
            {/* City & Alert Threshold */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-city" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Active City
                </label>
                <select
                  id="settings-city"
                  value={profile.city.id}
                  onChange={(e) => {
                    const found = INDIAN_CITIES.find((c) => c.id === e.target.value);
                    if (found) onUpdateProfile({ ...profile, city: found });
                  }}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="settings-threshold" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Smart Alert Threshold (AQI ≥ {profile.alertThresholdAqi})
                </label>
                <input
                  id="settings-threshold"
                  type="range"
                  min={100}
                  max={350}
                  step={25}
                  value={profile.alertThresholdAqi}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, alertThresholdAqi: Number(e.target.value) })
                  }
                  className="mt-3 w-full accent-teal-700"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Language (UI + AI + Voice)
              </div>
              <div className="mt-2 flex gap-2">
                {(['en', 'hi', 'gu'] as AppLanguage[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={language === code}
                    onClick={() => onChangeLanguage(code)}
                    className={`min-h-[42px] flex-1 rounded-xl border text-xs font-semibold cursor-pointer ${
                      language === code
                        ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {LANG_LABELS[code]}
                  </button>
                ))}
              </div>
            </div>

            {/* Display & Accessibility Toggles */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Display &amp; Accessibility
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  aria-pressed={darkMode}
                  onClick={onToggleDarkMode}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    darkMode
                      ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{darkMode ? 'Dark Mode On' : 'Dark Mode Off'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={largeText}
                  onClick={onToggleLargeText}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    largeText
                      ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <TypeIcon className="h-4 w-4" />
                  <span>{largeText ? 'Large Text On' : 'Large Text'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={highContrast}
                  onClick={onToggleHighContrast}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
                    highContrast
                      ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>{highContrast ? 'High Contrast On' : 'High Contrast'}</span>
                </button>
              </div>
            </div>

            {/* Demo Mode & Profile Reset */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={onToggleDemoSevere}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold cursor-pointer ${
                  demoSevereMode
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>{demoSevereMode ? 'Exit Delhi Smog Demo' : 'Enable Demo: Delhi Winter Smog'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRedoOnboarding();
                }}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Edit Full Household Profile</span>
              </button>
            </div>

            {/* PWA Install & Offline Data Note */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <PWAInstallButton />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Privacy &amp; Low-Bandwidth Design: Your household profile, streaks, last live AQI reading, and daily smog plan are cached locally on your device so SaansSaathi works reliably on 3G or offline.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Problem Statement Mapping */}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How SaansSaathi Maps to the Urban Air Quality Challenge
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Every capability in SaansSaathi maps directly to the five core evaluation pillars:
              </p>

              <div className="mt-3 space-y-2.5">
                {PROBLEM_MAPPING.map((item) => (
                  <div
                    key={item.pillar}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.pillar}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.features}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visible AI Architecture Diagram */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Cpu className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>Visible GenAI + Deterministic + RAG Architecture</span>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-teal-300">
{`[1. Live Data Layer]
 Open-Meteo AQ + Weather + GPS/Nominatim (+ Offline/Delhi Demo Fallback)
                          │
                          ▼
[2. SituationObject Context Builder]
 Merges Household Profile + 48h Forecast + Inversion + Feedback History
                          │
                          ▼
[3. Deterministic Engine (Zero Hallucinated Math)]
 CPCB AQI · CADR (sq ft × 1.35) · INR/CO₂/PM2.5 · Berkeley Earth Cig Eq.
                          │
                          ▼
[4. Local Knowledge Base RAG Retriever]
 CPCB GRAP · WHO 2021 · MoHFW/ICMR Advisory · EPA Indoor Air & Masks
                          │
                          ▼
[5. Gemini Structured JSON Schema + Safety Guardrails]
 Personalized 5-Block Plan + EN/HI/GU Grounded Chat + Feedback Adaptation`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
