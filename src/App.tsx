/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { getNavItems } from './components/layout/navItems';
import { ActionBottomSheet } from './components/saans/ActionBottomSheet';
import { OfflineBanner } from './components/saans/PwaControls';
import { SplashOnboarding } from './components/saans/SplashOnboarding';
import { TodayTab } from './components/saans/TodayTab';
import { DEFAULT_SAANS_PROFILE, getDemoDelhiSevereSnapshot } from './data/saansData';
import { useActionFeedback } from './hooks/useActionFeedback';
import { useAiPlan } from './hooks/useAiPlan';
import { useAssistantChat } from './hooks/useAssistantChat';
import { useCommunities } from './hooks/useCommunities';
import { useLiveAir } from './hooks/useLiveAir';
import { usePersistentState } from './hooks/usePersistentState';
import { STORAGE_KEYS } from './lib/storage';
import type { AppLanguage, HomeTab, PlanRecommendation, SaansProfile, WhatIfInputs } from './types/saans';
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

/** `?autostart=1` skips onboarding and `?demo=1` opens the Delhi smog demo (handy for judges and kiosks). */
const URL_FLAGS = new URLSearchParams(window.location.search);
const AUTOSTART = URL_FLAGS.get('autostart') === '1';
const START_IN_DEMO = URL_FLAGS.get('demo') === '1';

const normalizeLanguage = (stored: AppLanguage): AppLanguage => (stored === 'hi' || stored === 'gu' ? stored : 'en');
const normalizeProfile = (stored: SaansProfile): SaansProfile =>
  AUTOSTART ? { ...stored, completedOnboarding: true } : stored;

export default function App() {
  const [language, setLanguage] = usePersistentState<AppLanguage>(STORAGE_KEYS.lang, 'en', normalizeLanguage);
  const [profile, setProfile] = usePersistentState(STORAGE_KEYS.profile, DEFAULT_SAANS_PROFILE, normalizeProfile);
  const [darkMode, setDarkMode] = usePersistentState(STORAGE_KEYS.dark, false);
  const [largeText, setLargeText] = usePersistentState(STORAGE_KEYS.largeText, false);
  const [highContrast, setHighContrast] = usePersistentState(STORAGE_KEYS.highContrast, false);

  const [demoSevereMode, setDemoSevereMode] = useState(START_IN_DEMO);
  const [activeTab, setActiveTab] = useState<HomeTab>('today');
  const [emergencyViewOpen, setEmergencyViewOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PlanRecommendation | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [modal, setModal] = useState<'settings' | 'about' | null>(null);
  const [whatIf, setWhatIf] = useState<WhatIfInputs>(() => ({
    commuteMode: profile.commuteMode === 'car' ? 'metro' : profile.commuteMode,
    purifierHours: profile.hasPurifier ? 12 : 8,
    maskCompliancePct: 80,
    cleanCookingAndSeal: true,
  }));

  const { feedback, streakDays, markDone, markSkipped, vote } = useActionFeedback();
  const aiPlan = useAiPlan();
  const chat = useAssistantChat();
  const circles = useCommunities();
  const liveAir = useLiveAir(profile.city, profile.completedOnboarding && !demoSevereMode);

  // Everything below is derived by the deterministic engine; the LLM never computes these numbers.
  const air = useMemo(
    () => (demoSevereMode ? getDemoDelhiSevereSnapshot() : liveAir.liveAir),
    [demoSevereMode, liveAir.liveAir]
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
  const activePlan = aiPlan.aiPlan ?? deterministicPlan;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    root.classList.toggle('text-scale-large', largeText);
    root.classList.toggle('high-contrast', highContrast);
  }, [darkMode, largeText, highContrast]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: both values are navigation triggers, not inputs.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, emergencyViewOpen]);

  const navigate = (tab: HomeTab) => {
    setEmergencyViewOpen(false);
    setActiveTab(tab);
  };
  const toggleDemo = () => {
    setDemoSevereMode((on) => !on);
    aiPlan.reset();
  };
  const household = {
    memberName: `${profile.userName || 'Your'} Household`,
    smogScore: impactReport.smogScore,
    monthlyCo2Kg: Math.round(impactReport.monthlyCo2SavedKg),
  };

  if (!profile.completedOnboarding) {
    return (
      <SplashOnboarding
        language={language}
        initialProfile={profile}
        onChangeLanguage={setLanguage}
        onComplete={(completedProfile, enableDemoSevere) => {
          setProfile(completedProfile);
          if (enableDemoSevere) setDemoSevereMode(true);
          aiPlan.reset();
        }}
      />
    );
  }

  const navItems = getNavItems(language);
  const highlightedTab = emergencyViewOpen ? null : activeTab;
  const showThresholdAlert = !alertDismissed && !band.isEmergency && air.aqi >= profile.alertThresholdAqi;
  const liveStatus = aiPlan.isGenerating
    ? 'Generating personalized AI smog plan.'
    : liveAir.isLoading
      ? `Refreshing air quality data for ${profile.city.name}.`
      : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-10">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <OfflineBanner />

      <AppHeader
        air={air}
        navItems={navItems}
        activeTab={highlightedTab}
        darkMode={darkMode}
        onNavigate={navigate}
        onToggleDarkMode={() => setDarkMode((on) => !on)}
        onOpenAbout={() => setModal('about')}
        onOpenSettings={() => setModal('settings')}
      />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 focus:outline-none">
        <div className="sr-only" role="status" aria-live="polite">
          {liveStatus}
        </div>

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
                  isGeneratingPlan={aiPlan.isGenerating}
                  planError={aiPlan.error}
                  isLoadingAir={liveAir.isLoading}
                  demoSevereMode={demoSevereMode}
                  onToggleDemoSevere={toggleDemo}
                  onRefreshAir={() => void liveAir.refresh()}
                  onGenerateAiPlan={() => void aiPlan.generate(situation)}
                  onOpenEmergency={() => setEmergencyViewOpen(true)}
                  onSelectAction={setSelectedAction}
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
                  isGeneratingPlan={aiPlan.isGenerating}
                  planError={aiPlan.error}
                  onGenerateAiPlan={() => void aiPlan.generate(situation)}
                  onSelectAction={setSelectedAction}
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
                  messages={chat.messages}
                  onChangeLanguage={setLanguage}
                  onSendMessage={(text) => chat.send(text, situation)}
                  isSending={chat.isSending}
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
                  communities={circles.communities}
                  activeCommunityId={circles.activeId}
                  onSelectCommunity={circles.setActiveId}
                  onCreateCommunity={async (name, type) => {
                    await circles.update(
                      { action: 'create', name, type, city: air.city.name },
                      { ...household, co2SavedKg: Math.max(12, household.monthlyCo2Kg) }
                    );
                  }}
                  onJoinCommunity={async (id) => {
                    await circles.update(
                      { action: 'join', communityId: id },
                      { ...household, co2SavedKg: Math.max(8, Math.round(household.monthlyCo2Kg / 2)) }
                    );
                  }}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      <BottomNav navItems={navItems} activeTab={highlightedTab} onNavigate={navigate} />

      <ActionBottomSheet
        action={selectedAction}
        isDone={selectedAction ? feedback.doneIds.includes(selectedAction.id) : false}
        isSkipped={selectedAction ? feedback.skippedIds.includes(selectedAction.id) : false}
        thumb={selectedAction ? feedback.thumbs[selectedAction.id] : undefined}
        onClose={() => setSelectedAction(null)}
        onMarkDone={markDone}
        onMarkSkip={(id) => {
          markSkipped(id);
          // The deterministic plan adapts to skips immediately, so show it instead of the stale AI plan.
          aiPlan.reset();
        }}
        onThumb={vote}
      />

      {modal && (
        <Suspense fallback={null}>
          <SettingsAboutModal
            key={modal}
            initialView={modal}
            language={language}
            profile={profile}
            darkMode={darkMode}
            largeText={largeText}
            highContrast={highContrast}
            demoSevereMode={demoSevereMode}
            onClose={() => setModal(null)}
            onChangeLanguage={setLanguage}
            onUpdateProfile={(next) => {
              setProfile(next);
              aiPlan.reset();
            }}
            onToggleDarkMode={() => setDarkMode((on) => !on)}
            onToggleLargeText={() => setLargeText((on) => !on)}
            onToggleHighContrast={() => setHighContrast((on) => !on)}
            onToggleDemoSevere={toggleDemo}
            onRedoOnboarding={() => setProfile((current) => ({ ...current, completedOnboarding: false }))}
          />
        </Suspense>
      )}
    </div>
  );
}
