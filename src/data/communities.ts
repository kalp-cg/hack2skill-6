import type { CommunityGroup } from '../types/saans';

/**
 * Demo circles (an RWA, a school parents' group and a family) shown before any user creates one.
 * Shared by the client (initial state) and the server (seed for the in-memory store).
 */
export const SEED_COMMUNITIES: CommunityGroup[] = [
  {
    id: 'rwa-green-park',
    name: 'Green Park Extension RWA',
    type: 'rwa',
    city: 'New Delhi',
    inviteCode: 'GP-RWA-2026',
    membersCount: 64,
    totalCo2AvoidedKg: 2840,
    collectiveExposureCutPct: 48,
    weeklyChallenge: 'Zero Waste-Burning & 50% Metro/Carpool School Runs',
    challengeProgressPct: 76,
    leaderboard: [
      { name: 'Block C — Sharma Family', actionsDone: 28, co2SavedKg: 112, smogScore: 92 },
      { name: 'Block A — Mehta Household', actionsDone: 24, co2SavedKg: 96, smogScore: 88 },
      { name: 'Block D — Patel Family', actionsDone: 21, co2SavedKg: 84, smogScore: 84 },
    ],
  },
  {
    id: 'school-vasant-parents',
    name: 'Vasant Valley Parents Clean-Air Circle',
    type: 'school',
    city: 'New Delhi',
    inviteCode: 'VV-SCHOOL-88',
    membersCount: 42,
    totalCo2AvoidedKg: 1920,
    collectiveExposureCutPct: 52,
    weeklyChallenge: 'No-Idling School Gate + 4-Family Carpool Pods',
    challengeProgressPct: 82,
    leaderboard: [
      { name: 'Grade 1 Carpool Pod A', actionsDone: 31, co2SavedKg: 138, smogScore: 94 },
      { name: 'Grade 4 Walking Bus', actionsDone: 25, co2SavedKg: 104, smogScore: 89 },
      { name: 'Nursery Clean-Room Team', actionsDone: 19, co2SavedKg: 76, smogScore: 83 },
    ],
  },
  {
    id: 'family-ahmedabad',
    name: 'Navrangpura Extended Family',
    type: 'family',
    city: 'Ahmedabad',
    inviteCode: 'AMD-FAM-12',
    membersCount: 11,
    totalCo2AvoidedKg: 410,
    collectiveExposureCutPct: 44,
    weeklyChallenge: '7-Day Damp Mop + Evening Exhaust Streak',
    challengeProgressPct: 68,
    leaderboard: [
      { name: 'Kiran & Family', actionsDone: 18, co2SavedKg: 62, smogScore: 86 },
      { name: 'Dada & Dadi Home', actionsDone: 15, co2SavedKg: 48, smogScore: 82 },
    ],
  },
];
