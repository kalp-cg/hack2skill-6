import { Award, Check, Download, Plus, Share2, Trophy, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { BADGE_DEFINITIONS } from '../../data/saansData';
import type { ActionFeedbackState, AirSnapshot, CommunityGroup, ImpactReport, SaansProfile } from '../../types/saans';

interface CommunityTabProps {
  profile: SaansProfile;
  air: AirSnapshot;
  report: ImpactReport;
  feedback: ActionFeedbackState;
  streakDays: number;
  maskCompliancePct: number;
  communities: CommunityGroup[];
  activeCommunityId: string;
  onSelectCommunity: (id: string) => void;
  onCreateCommunity: (name: string, type: CommunityGroup['type']) => Promise<void>;
  onJoinCommunity: (id: string) => Promise<void>;
}

export function CommunityTab({
  profile,
  air,
  report,
  feedback,
  streakDays,
  maskCompliancePct,
  communities,
  activeCommunityId,
  onSelectCommunity,
  onCreateCommunity,
  onJoinCommunity,
}: CommunityTabProps) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CommunityGroup['type']>('rwa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>(['rwa-green-park']);

  const activeGroup = communities.find((c) => c.id === activeCommunityId) ?? communities[0];

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 3 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateCommunity(newName.trim(), newType);
      setNewName('');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(id: string) {
    setIsSubmitting(true);
    try {
      await onJoinCommunity(id);
      setJoinedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } finally {
      setIsSubmitting(false);
    }
  }

  function generateImpactCardDataUrl(): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clean editorial dark-teal card
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, canvas.width, 18);

    ctx.fillStyle = '#5eead4';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SAANSSAATHI · BREATH COMPANION IMPACT CARD', 64, 88);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(`${activeGroup?.name || 'Our Clean-Air Circle'}`, 64, 162);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px sans-serif';
    ctx.fillText(
      `${air.city.name} · Live AQI ${air.aqi} · ${activeGroup?.membersCount ?? 1} Households Participating`,
      64,
      212
    );

    // 3 Metric boxes
    const metrics = [
      { label: 'YOUR SMOG SCORE', val: `${report.smogScore}/100` },
      { label: 'EXPOSURE CUT', val: `-${report.exposureCutPct}% PM2.5` },
      { label: 'COMMUNITY CO₂ SAVED', val: `${activeGroup?.totalCo2AvoidedKg ?? 0} kg` },
    ];

    metrics.forEach((m, idx) => {
      const x = 64 + idx * 325;
      const y = 270;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, 300, 170);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 300, 170);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(m.label, x + 24, y + 54);

      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 44px monospace';
      ctx.fillText(m.val, x + 24, y + 124);
    });

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px sans-serif';
    ctx.fillText(
      `Weekly Challenge: ${activeGroup?.weeklyChallenge ?? 'Low-Emission Commute & Clean Air Homes'}`,
      64,
      510
    );

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px sans-serif';
    ctx.fillText(
      `Join code: ${activeGroup?.inviteCode ?? 'SS-CLEAN'} · Shared by ${profile.userName || 'SaansSaathi Family'}`,
      64,
      565
    );

    return canvas.toDataURL('image/png');
  }

  function handleDownloadCard() {
    const url = generateImpactCardDataUrl();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `saanssaathi-impact-${activeGroup?.inviteCode || 'card'}.png`;
    link.click();
    setShareStatus('Impact card PNG downloaded! Ready to share on WhatsApp.');
  }

  async function handleCopyWhatsAppText() {
    const text =
      `SaansSaathi Clean-Air Update (${air.city.name}, AQI ${air.aqi}):\n` +
      `• My Smog Score: ${report.smogScore}/100 (-${report.exposureCutPct}% PM2.5 exposure)\n` +
      `• ${activeGroup?.name}: ${activeGroup?.totalCo2AvoidedKg} kg CO₂ avoided across ${activeGroup?.membersCount} households\n` +
      `• Weekly Challenge: ${activeGroup?.weeklyChallenge}\n` +
      `Join with code ${activeGroup?.inviteCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus('WhatsApp summary copied to clipboard!');
    } catch {
      setShareStatus('Impact card ready—use Download PNG to share on WhatsApp.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Streaks & Earned Badges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-400">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Community Mode · Family, RWA &amp; School Circles</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeGroup ? activeGroup.name : 'Community Clean-Air Dashboard'}
          </h1>
          {activeGroup && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {activeGroup.city} · {activeGroup.type.toUpperCase()} · Invite Code:{' '}
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {activeGroup.inviteCode}
              </span>
            </p>
          )}

          {/* Community Aggregated Anonymous Metrics */}
          {activeGroup && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Households</div>
                <div className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {activeGroup.membersCount}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">CO₂ Avoided</div>
                <div className="mt-1 font-mono text-2xl font-bold text-teal-800 dark:text-teal-400 tabular-nums">
                  {activeGroup.totalCo2AvoidedKg.toLocaleString('en-IN')} kg
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Exposure Cut</div>
                <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  -{activeGroup.collectiveExposureCutPct}%
                </div>
              </div>
            </div>
          )}

          {/* Weekly Challenge Progress */}
          {activeGroup && (
            <div className="mt-5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 p-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-teal-900 dark:text-teal-200">
                  Weekly Challenge: {activeGroup.weeklyChallenge}
                </span>
                <span className="font-mono font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                  {activeGroup.challengeProgressPct}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-teal-200/70 dark:bg-teal-900">
                <div
                  className="h-full bg-teal-700 dark:bg-teal-400"
                  style={{ width: `${activeGroup.challengeProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* One-Tap Shareable WhatsApp Impact Card */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadCard}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap cursor-pointer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download WhatsApp Impact Card (PNG)</span>
            </button>
            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span>Copy WhatsApp Summary</span>
            </button>
          </div>
          {shareStatus && <p className="mt-2.5 text-xs font-medium text-teal-800 dark:text-teal-400">{shareStatus}</p>}
        </section>

        {/* Personal Streaks & Badges */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-400">
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>Habits, Streaks &amp; Badges</span>
            </div>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {streakDays}-Day Streak
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {BADGE_DEFINITIONS.map((badge) => {
              const earned = badge.check(feedback.doneIds, streakDays, maskCompliancePct);
              return (
                <div
                  key={badge.id}
                  className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 ${
                    earned
                      ? 'border-teal-300 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{badge.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{badge.criteria}</div>
                  </div>
                  <span
                    className={`font-mono text-xs font-semibold shrink-0 ${
                      earned ? 'text-teal-800 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {earned ? 'Earned' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Leaderboard + Switch / Create Group */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Leaderboard */}
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-400">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            <span>Weekly Challenge Leaderboard</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Top Households in {activeGroup?.name}
          </h2>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {(activeGroup?.leaderboard ?? []).map((member, idx) => (
              <div key={member.name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 dark:text-white">{member.name}</div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {member.actionsDone} actions · {member.co2SavedKg} kg CO₂ saved
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-teal-800 dark:text-teal-400 tabular-nums shrink-0">
                  Score {member.smogScore}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Join / Switch / Create Community */}
        <section className="space-y-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:col-span-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Join a Society, School or Family Circle
            </h2>
            <div className="mt-3 space-y-2">
              {communities.map((group) => {
                const selected = group.id === activeGroup?.id;
                const joined = joinedIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                      selected
                        ? 'border-teal-700 bg-teal-50/60 dark:bg-teal-950/40'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCommunity(group.id)}
                      className="flex-1 text-left cursor-pointer min-w-0"
                    >
                      <div className="truncate text-xs font-bold text-slate-900 dark:text-white">{group.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {group.membersCount} homes · {group.totalCo2AvoidedKg} kg CO₂
                      </div>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleJoin(group.id)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {joined ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-teal-700" />
                          <span>Sync Score</span>
                        </>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCreate} className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Clean-Air Circle</h3>
            <label htmlFor="new-comm-name" className="sr-only">
              Community name
            </label>
            <input
              id="new-comm-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Sector 15 RWA or Sharma Family"
              className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
            />
            <div className="flex gap-2">
              <select
                aria-label="Community type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as CommunityGroup['type'])}
                className="h-11 flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-xs font-medium"
              >
                <option value="rwa">RWA / Society</option>
                <option value="school">School Parents</option>
                <option value="family">Family Circle</option>
              </select>
              <button
                type="submit"
                disabled={isSubmitting || newName.trim().length < 3}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Create</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
