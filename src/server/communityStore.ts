import { SEED_COMMUNITIES } from '../data/communities.js';
import type { CommunityGroup } from '../types/saans.js';
import { MAX_COMMUNITY_GROUPS, MAX_LEADERBOARD_ENTRIES } from './config.js';

export interface NewCommunityInput {
  name: string;
  type: CommunityGroup['type'];
  city: string;
  founderName: string;
  co2SavedKg: number;
  smogScore: number;
}

export interface ContributionInput {
  memberName: string;
  co2SavedKg: number;
  smogScore: number;
  isNewMember: boolean;
}

/** Points a single contribution adds to the circle's weekly challenge progress. */
const CHALLENGE_STEP_PCT = 4;

/**
 * In-memory clean-air circles (zero-setup demo storage). Bounded on both axes, at most
 * MAX_COMMUNITY_GROUPS circles and MAX_LEADERBOARD_ENTRIES ranks each, so memory cannot grow
 * without limit. Inputs are expected to be validated and clamped by the caller.
 */
export class CommunityStore {
  private readonly groups: CommunityGroup[];

  constructor(seed: CommunityGroup[] = SEED_COMMUNITIES) {
    this.groups = structuredClone(seed);
  }

  list(): CommunityGroup[] {
    return this.groups;
  }

  create(input: NewCommunityInput): CommunityGroup {
    const group: CommunityGroup = {
      id: `comm-${Date.now()}`,
      name: input.name,
      type: input.type,
      city: input.city,
      inviteCode: `SS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      membersCount: 1,
      totalCo2AvoidedKg: input.co2SavedKg,
      collectiveExposureCutPct: 42,
      weeklyChallenge: '7-Day Low-Emission Commute & Clean-Air Home Streak',
      challengeProgressPct: 25,
      leaderboard: [
        { name: input.founderName, actionsDone: 3, co2SavedKg: input.co2SavedKg, smogScore: input.smogScore },
      ],
    };
    this.groups.unshift(group);
    this.groups.length = Math.min(this.groups.length, MAX_COMMUNITY_GROUPS);
    return group;
  }

  /** Records a member's contribution (and optionally their joining). Returns null for an unknown id. */
  contribute(id: unknown, input: ContributionInput): CommunityGroup | null {
    const group = this.groups.find((g) => g.id === id);
    if (!group) return null;

    if (input.isNewMember) group.membersCount += 1;
    group.totalCo2AvoidedKg += input.co2SavedKg;
    group.challengeProgressPct = Math.min(100, group.challengeProgressPct + CHALLENGE_STEP_PCT);

    const member = group.leaderboard.find((m) => m.name === input.memberName);
    if (member) {
      member.actionsDone += 1;
      member.co2SavedKg += input.co2SavedKg;
      member.smogScore = Math.max(member.smogScore, input.smogScore);
    } else {
      group.leaderboard.push({
        name: input.memberName,
        actionsDone: 1,
        co2SavedKg: input.co2SavedKg,
        smogScore: input.smogScore,
      });
    }
    group.leaderboard.sort((a, b) => b.smogScore - a.smogScore);
    group.leaderboard.length = Math.min(group.leaderboard.length, MAX_LEADERBOARD_ENTRIES);
    return group;
  }
}
