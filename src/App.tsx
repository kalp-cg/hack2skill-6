/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';
import { BarChart3, Bell, CalendarCheck, Info, MessageCircle, Moon, Settings, Sun, Users, Wind, X } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ActionBottomSheet } from './components/saans/ActionBottomSheet';
import { OfflineBanner, PWAInstallButton } from './components/saans/PwaControls';
import { SplashOnboarding } from './components/saans/SplashOnboarding';
import { TodayTab } from './components/saans/TodayTab';
import { SEED_COMMUNITIES } from './data/communities';
import { UI_COPY } from './data/i18n';
import { DEFAULT_SAANS_PROFILE, getDemoDelhiSevereSnapshot, getFallbackAirSnapshot } from './data/saansData';
import type {
  ActionFeedbackState,
  AirSnapshot,
  AppLanguage,
  ChatTurn,
  CommunityGroup,
  DailyPlanData,
  HomeTab,
  PlanRecommendation,
  SaansProfile,
  WhatIfInputs,
} from './types/saans';
import {
  buildDeterministicDailyPlan,
  buildSituationObject,
  computeCommuteAlternatives,
  computeMemberRisks,
  computeWhatIfImpact,
  detectInversionWarning,
  findBestAndWorstHours48,
  getAqiBand,
} from './utils/saansEngine';

// Secondary views load on demand so the first paint only ships the Today tab.
const PlanTab = lazy(() => import('./components/saans/PlanTab').then((m) => ({ default: m.PlanTab })));
const ImpactTab = lazy(() => import('./components/saans/ImpactTab').then((m) => ({ default: m.ImpactTab })));
const AskTab = lazy(() => import('./components/saans/AskTab').then((m) => ({ default: m.AskTab })));
const CommunityTab = lazy(() => import('./components/saans/CommunityTab').then((m) => ({ default: m.CommunityTab })));
const EmergencyModeView = lazy(() =>
  import('./components/saans/EmergencyModeView').then((m) => ({ default: m.EmergencyModeView }))
);
const SettingsAboutModal = lazy(() =>
  import('./components/saans/SettingsAboutModal').then((m) => ({ default: m.SettingsAboutModal }))
);

const STORAGE_KEYS = {
  profile: 'saans_profile_v1',
  lang: 'saans_lang_v1',
  feedback: 'saans_feedback_v1',
  streak: 'saans_streak_v1',
  dark: 'saans_dark_v1',
  largeText: 'saans_large_v1',
  highContrast: 'saans_contrast_v1',
  cachedAir: 'saans_cached_air_v1',
  cachedPlan: 'saans_cached_plan_v1',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const autoStart = urlParams.get('autostart') === '1';
  const startDemoParam = urlParams.get('demo') === '1';

  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = readJson<AppLanguage>(STORAGE_KEYS.lang, 'en');
    return saved === 'hi' || saved === 'gu' ? saved : 'en';
  });

  const [profile, setProfile] = useState<SaansProfile>(() => {
    const saved = readJson<SaansProfile | null>(STORAGE_KEYS.profile, null);
    if (saved) return autoStart ? { ...saved, completedOnboarding: true } : saved;
    return autoStart ? { ...DEFAULT_SAANS_PROFILE, completedOnboarding: true } : DEFAULT_SAANS_PROFILE;
  });

  const [demoSevereMode, setDemoSevereMode] = useState<boolean>(startDemoParam);
  const [activeTab, setActiveTab] = useState<HomeTab>('today');
  const [emergencyViewOpen, setEmergencyViewOpen] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => readJson<boolean>(STORAGE_KEYS.dark, false));
  const [largeText, setLargeText] = useState<boolean>(() => readJson<boolean>(STORAGE_KEYS.largeText, false));
  const [highContrast, setHighContrast] = useState<boolean>(() => readJson<boolean>(STORAGE_KEYS.highContrast, false));

  const [feedback, setFeedback] = useState<ActionFeedbackState>(() =>
    readJson<ActionFeedbackState>(STORAGE_KEYS.feedback, {
      doneIds: [],
      skippedIds: [],
      thumbs: {},
    })
  );
  const [streakDays, setStreakDays] = useState<number>(() => readJson<number>(STORAGE_KEYS.streak, 3));

  const [liveAir, setLiveAir] = useState<AirSnapshot>(() => {
    const cached = readJson<AirSnapshot | null>(STORAGE_KEYS.cachedAir, null);
    return cached ?? getFallbackAirSnapshot(profile.city);
  });
  const [isLoadingAir, setIsLoadingAir] = useState<boolean>(false);

  const [whatIf, setWhatIf] = useState<WhatIfInputs>(() => ({
    commuteMode: profile.commuteMode === 'car' ? 'metro' : profile.commuteMode,
    purifierHours: profile.hasPurifier ? 12 : 8,
    maskCompliancePct: 80,
    cleanCookingAndSeal: true,
  }));

  const [aiPlan, setAiPlan] = useState<DailyPlanData | null>(() =>
    readJson<DailyPlanData | null>(STORAGE_KEYS.cachedPlan, null)
  );
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<PlanRecommendation | null>(null);

  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);
  const [modalState, setModalState] = useState<{ open: boolean; view: 'settings' | 'about' }>({
    open: false,
    view: 'settings',
  });

  const [communities, setCommunities] = useState<CommunityGroup[]>(SEED_COMMUNITIES);
  const [activeCommunityId, setActiveCommunityId] = useState<string>(SEED_COMMUNITIES[0].id);

  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome-saans',
      role: 'assistant',
      text: 'Namaste! I am SaansSaathi, grounded in live local AQI plus CPCB, WHO 2021, and MoHFW/ICMR winter smog guidance. Ask me about school safety, purifier CADR sizing, mask fit, or commute swaps—in English, हिन्दी, or ગુજરાતી.',
      timestamp: new Date().toISOString(),
      dataSource: 'SaansSaathi RAG Knowledge Base',
      confidence: 'High',
      citations: ['CPCB National AQI & GRAP', 'WHO 2021 Air Quality Guidelines'],
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  // Active telemetry snapshot (either Demo Delhi Severe or Live/Cached City)
  const air: AirSnapshot = useMemo(
    () => (demoSevereMode ? getDemoDelhiSevereSnapshot() : liveAir),
    [demoSevereMode, liveAir]
  );

  const band = useMemo(() => getAqiBand(air.aqi), [air.aqi]);
  const inversion = useMemo(
    () => detectInversionWarning(air.pm25, air.windKmh, air.tempC, air.humidityPct, air.mixingHeightM),
    [air]
  );
  const bestWorstHours = useMemo(() => findBestAndWorstHours48(air.forecast48h), [air.forecast48h]);
  const memberRisks = useMemo(() => computeMemberRisks(air.aqi, profile), [air.aqi, profile]);
  const commuteAlternatives = useMemo(
    () => computeCommuteAlternatives(profile.commuteDistanceKm, profile.commuteMode, air.pm25, profile.wfhDaysPerWeek),
    [profile.commuteDistanceKm, profile.commuteMode, profile.wfhDaysPerWeek, air.pm25]
  );

  const impactReport = useMemo(
    () => computeWhatIfImpact(profile, air, whatIf, feedback.doneIds.length),
    [profile, air, whatIf, feedback.doneIds.length]
  );

  const situation = useMemo(
    () => buildSituationObject(profile, air, feedback, language),
    [profile, air, feedback, language]
  );

  const deterministicPlan = useMemo(() => buildDeterministicDailyPlan(situation), [situation]);
  const activePlan: DailyPlanData = aiPlan ?? deterministicPlan;

  // Sync classes on <html> for Dark Mode, Large Text, High Contrast
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('text-scale-large', largeText);
    root.classList.toggle('high-contrast', highContrast);
  }, [darkMode, largeText, highContrast]);

  // Reset scroll to top on tab or emergency view navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: both values are navigation triggers, not inputs.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, emergencyViewOpen]);

  // Persist user preferences & offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.lang, JSON.stringify(language));
      localStorage.setItem(STORAGE_KEYS.feedback, JSON.stringify(feedback));
      localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(streakDays));
      localStorage.setItem(STORAGE_KEYS.dark, JSON.stringify(darkMode));
      localStorage.setItem(STORAGE_KEYS.largeText, JSON.stringify(largeText));
      localStorage.setItem(STORAGE_KEYS.highContrast, JSON.stringify(highContrast));
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, [profile, language, feedback, streakDays, darkMode, largeText, highContrast]);

  // Fetch live AQI from backend Open-Meteo route
  const fetchLiveAir = useCallback(
    async (city = profile.city) => {
      setIsLoadingAir(true);
      try {
        const resp = await fetch(`/api/aqi?lat=${city.lat}&lon=${city.lon}`);
        if (!resp.ok) throw new Error('AQI fetch failed');
        const data = await resp.json();
        const snapshot: AirSnapshot = {
          city,
          source: 'open-meteo-live',
          updatedAt: data.updatedAt || new Date().toISOString(),
          aqi: data.aqi,
          pm25: data.pm25,
          pm10: data.pm10,
          no2: data.no2,
          o3: data.o3,
          tempC: data.tempC,
          humidityPct: data.humidityPct,
          windKmh: data.windKmh,
          mixingHeightM: data.mixingHeightM,
          forecast48h: data.forecast48h,
        };
        setLiveAir(snapshot);
        try {
          localStorage.setItem(STORAGE_KEYS.cachedAir, JSON.stringify(snapshot));
        } catch {
          // ignore
        }
      } catch {
        setLiveAir((prev) => (prev.city.id === city.id ? prev : getFallbackAirSnapshot(city)));
      } finally {
        setIsLoadingAir(false);
      }
    },
    [profile.city]
  );

  useEffect(() => {
    if (profile.completedOnboarding && !demoSevereMode) {
      void fetchLiveAir(profile.city);
    }
  }, [profile.completedOnboarding, profile.city, demoSevereMode, fetchLiveAir]);

  // Load community groups from server
  useEffect(() => {
    fetch('/api/community')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.communities?.length) {
          setCommunities(d.communities);
        }
      })
      .catch(() => {
        // Keep seeded communities offline
      });
  }, []);

  // Generate AI Daily Plan via Gemini + RAG (/api/plan)
  async function handleGenerateAiPlan() {
    setIsGeneratingPlan(true);
    setPlanError(null);
    try {
      const resp = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.plan) {
        throw new Error(data.error || 'Could not personalize plan right now.');
      }
      setAiPlan(data.plan);
      try {
        localStorage.setItem(STORAGE_KEYS.cachedPlan, JSON.stringify(data.plan));
      } catch {
        // ignore
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI planner.';
      setPlanError(`${msg} Showing deterministic engine plan below.`);
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  // Action feedback handlers
  function handleMarkDone(actionId: string) {
    setFeedback((prev) => {
      const already = prev.doneIds.includes(actionId);
      if (!already) {
        try {
          confetti({
            particleCount: 55,
            spread: 60,
            origin: { y: 0.72 },
          });
        } catch {
          // ignore headless canvas issues
        }
        setStreakDays((s) => (prev.doneIds.length === 0 ? s + 1 : s));
      }
      return {
        ...prev,
        doneIds: already ? prev.doneIds : [...prev.doneIds, actionId],
        skippedIds: prev.skippedIds.filter((id) => id !== actionId),
      };
    });
  }

  function handleMarkSkip(actionId: string) {
    setFeedback((prev) => ({
      ...prev,
      doneIds: prev.doneIds.filter((id) => id !== actionId),
      skippedIds: prev.skippedIds.includes(actionId) ? prev.skippedIds : [...prev.skippedIds, actionId],
    }));
    // Clear cached AI plan so deterministic adaptation immediately shows easier swap
    setAiPlan(null);
  }

  function handleThumb(actionId: string, vote: 'up' | 'down') {
    setFeedback((prev) => ({
      ...prev,
      thumbs: { ...prev.thumbs, [actionId]: vote },
    }));
  }

  // Conversational Chat handler (/api/chat)
  async function handleSendChat(text: string) {
    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userTurn]);
    setIsSendingChat(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          situation,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.answer) {
        throw new Error(data.error || 'Assistant temporarily unavailable.');
      }

      const botTurn: ChatTurn = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: data.answer,
        timestamp: data.timestamp || new Date().toISOString(),
        dataSource: data.dataSource,
        confidence: data.confidence,
        citations: data.citations,
      };
      setChatMessages((prev) => [...prev, botTurn]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error reaching assistant.';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: msg,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  }

  // Community handlers (/api/community)
  async function handleCreateCommunity(name: string, type: CommunityGroup['type']) {
    const resp = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name,
        type,
        city: air.city.name,
        memberName: `${profile.userName || 'Your'} Household`,
        co2SavedKg: Math.max(12, Math.round(impactReport.monthlyCo2SavedKg)),
        smogScore: impactReport.smogScore,
      }),
    });
    const data = await resp.json();
    if (resp.ok && data.communities) {
      setCommunities(data.communities);
      if (data.community?.id) setActiveCommunityId(data.community.id);
    }
  }

  async function handleJoinCommunity(id: string) {
    const resp = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        communityId: id,
        memberName: `${profile.userName || 'Your'} Household`,
        co2SavedKg: Math.max(8, Math.round(impactReport.monthlyCo2SavedKg / 2)),
        smogScore: impactReport.smogScore,
      }),
    });
    const data = await resp.json();
    if (resp.ok && data.communities) {
      setCommunities(data.communities);
      setActiveCommunityId(id);
    }
  }

  // Show Splash & 4-Step Onboarding for first-time users
  if (!profile.completedOnboarding) {
    return (
      <SplashOnboarding
        language={language}
        initialProfile={profile}
        onChangeLanguage={setLanguage}
        onComplete={(completedProfile, enableDemoSevere) => {
          setProfile(completedProfile);
          if (enableDemoSevere) {
            setDemoSevereMode(true);
          }
          setAiPlan(null);
        }}
      />
    );
  }

  const copy = UI_COPY[language];
  const showThresholdAlert = !alertDismissed && !band.isEmergency && air.aqi >= profile.alertThresholdAqi;

  const navItems: Array<{ id: HomeTab; label: string; icon: typeof Wind }> = [
    { id: 'today', label: copy.tabs.today, icon: Wind },
    { id: 'plan', label: copy.tabs.plan, icon: CalendarCheck },
    { id: 'impact', label: copy.tabs.impact, icon: BarChart3 },
    { id: 'ask', label: copy.tabs.ask, icon: MessageCircle },
    { id: 'community', label: copy.tabs.community, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-10">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <OfflineBanner />

      {/* Top Navigation Bar (52px on mobile, 64px on desktop) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[52px] md:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left: Brand */}
          <button
            type="button"
            onClick={() => {
              setEmergencyViewOpen(false);
              setActiveTab('today');
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">SaansSaathi</div>
              <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                {air.city.name} · AQI <span className="font-mono font-semibold tabular-nums">{air.aqi}</span>
              </div>
            </div>
          </button>

          {/* Center: Desktop 5-Tab Navigation */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = !emergencyViewOpen && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    setEmergencyViewOpen(false);
                    setActiveTab(item.id);
                  }}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Install + About + Dark Mode + Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:block">
              <PWAInstallButton compact />
            </div>

            <button
              type="button"
              onClick={() => setModalState({ open: true, view: 'about' })}
              aria-label="About and how it works"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setModalState({ open: true, view: 'settings' })}
              aria-label="Open settings and accessibility"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 focus:outline-none">
        <div className="sr-only" role="status" aria-live="polite">
          {isGeneratingPlan
            ? 'Generating personalized AI smog plan.'
            : isLoadingAir
              ? `Refreshing air quality data for ${profile.city.name}.`
              : ''}
        </div>
        {/* Smart AQI Threshold Alert Banner */}
        {showThresholdAlert && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-xs text-amber-950 dark:text-amber-200"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <span>
                <strong>Smart Alert:</strong> {air.city.name} AQI ({air.aqi}) crossed your alert threshold (
                {profile.alertThresholdAqi}). Best outdoor window today is {bestWorstHours.bestStartLabel}–
                {bestWorstHours.bestEndLabel}.
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss alert"
              onClick={() => setAlertDismissed(true)}
              className="rounded-lg p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Suspense
          fallback={
            <p role="status" className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading…
            </p>
          }
        >
          {emergencyViewOpen ? (
            <EmergencyModeView
              air={air}
              profile={profile}
              bestWorstHours={bestWorstHours}
              memberRisks={memberRisks}
              onExitEmergencyView={() => setEmergencyViewOpen(false)}
            />
          ) : (
            <>
              {activeTab === 'today' && (
                <TodayTab
                  language={language}
                  profile={profile}
                  air={air}
                  band={band}
                  inversion={inversion}
                  bestWorstHours={bestWorstHours}
                  memberRisks={memberRisks}
                  plan={activePlan}
                  feedback={feedback}
                  isGeneratingPlan={isGeneratingPlan}
                  planError={planError}
                  isLoadingAir={isLoadingAir}
                  demoSevereMode={demoSevereMode}
                  onToggleDemoSevere={() => {
                    setDemoSevereMode((d) => !d);
                    setAiPlan(null);
                  }}
                  onRefreshAir={() => void fetchLiveAir(profile.city)}
                  onGenerateAiPlan={() => void handleGenerateAiPlan()}
                  onOpenEmergency={() => setEmergencyViewOpen(true)}
                  onSelectAction={(act) => setSelectedAction(act)}
                  onOpenFullPlan={() => setActiveTab('plan')}
                />
              )}

              {activeTab === 'plan' && (
                <PlanTab
                  profile={profile}
                  air={air}
                  plan={activePlan}
                  feedback={feedback}
                  commuteAlternatives={commuteAlternatives}
                  isGeneratingPlan={isGeneratingPlan}
                  planError={planError}
                  onGenerateAiPlan={() => void handleGenerateAiPlan()}
                  onSelectAction={(act) => setSelectedAction(act)}
                />
              )}

              {activeTab === 'impact' && (
                <ImpactTab
                  profile={profile}
                  air={air}
                  whatIf={whatIf}
                  report={impactReport}
                  completedCount={feedback.doneIds.length}
                  onChangeWhatIf={setWhatIf}
                />
              )}

              {activeTab === 'ask' && (
                <AskTab
                  language={language}
                  situation={situation}
                  messages={chatMessages}
                  onChangeLanguage={setLanguage}
                  onSendMessage={handleSendChat}
                  isSending={isSendingChat}
                />
              )}

              {activeTab === 'community' && (
                <CommunityTab
                  profile={profile}
                  air={air}
                  report={impactReport}
                  feedback={feedback}
                  streakDays={streakDays}
                  maskCompliancePct={whatIf.maskCompliancePct}
                  communities={communities}
                  activeCommunityId={activeCommunityId}
                  onSelectCommunity={setActiveCommunityId}
                  onCreateCommunity={handleCreateCommunity}
                  onJoinCommunity={handleJoinCommunity}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (60px height) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pb-safe md:hidden"
      >
        <div className="grid h-[60px] grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = !emergencyViewOpen && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  setEmergencyViewOpen(false);
                  setActiveTab(item.id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
                  active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate max-w-[68px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Action Detail Bottom Sheet */}
      <ActionBottomSheet
        action={selectedAction}
        isDone={selectedAction ? feedback.doneIds.includes(selectedAction.id) : false}
        isSkipped={selectedAction ? feedback.skippedIds.includes(selectedAction.id) : false}
        thumb={selectedAction ? feedback.thumbs[selectedAction.id] : undefined}
        onClose={() => setSelectedAction(null)}
        onMarkDone={handleMarkDone}
        onMarkSkip={handleMarkSkip}
        onThumb={handleThumb}
      />

      {/* Settings & About/How-It-Works Modal */}
      {modalState.open && (
        <Suspense fallback={null}>
          <SettingsAboutModal
            key={modalState.view}
            initialView={modalState.view}
            language={language}
            profile={profile}
            darkMode={darkMode}
            largeText={largeText}
            highContrast={highContrast}
            demoSevereMode={demoSevereMode}
            onClose={() => setModalState((m) => ({ ...m, open: false }))}
            onChangeLanguage={setLanguage}
            onUpdateProfile={(next) => {
              setProfile(next);
              setAiPlan(null);
            }}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onToggleLargeText={() => setLargeText((l) => !l)}
            onToggleHighContrast={() => setHighContrast((h) => !h)}
            onToggleDemoSevere={() => {
              setDemoSevereMode((d) => !d);
              setAiPlan(null);
            }}
            onRedoOnboarding={() => setProfile((p) => ({ ...p, completedOnboarding: false }))}
          />
        </Suspense>
      )}
    </div>
  );
}
