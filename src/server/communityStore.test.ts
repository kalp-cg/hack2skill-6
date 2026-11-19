import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_COMMUNITIES } from '../data/communities.ts';
import { CommunityStore } from './communityStore.ts';
import { MAX_COMMUNITY_GROUPS } from './config.ts';

const contribution = { memberName: 'Block E', co2SavedKg: 10, smogScore: 99, isNewMember: false };

test('CommunityStore works on a copy, so the shared seed data is never mutated', () => {
  const store = new CommunityStore();
  const before = SEED_COMMUNITIES[0].totalCo2AvoidedKg;
  store.contribute(SEED_COMMUNITIES[0].id, contribution);
  assert.equal(SEED_COMMUNITIES[0].totalCo2AvoidedKg, before);
  assert.equal(store.list()[0].totalCo2AvoidedKg, before + 10);
});

test('contribute ranks members by Smog Score and merges repeat contributions', () => {
  const store = new CommunityStore();
  const id = SEED_COMMUNITIES[0].id;
  store.contribute(id, contribution);
  const group = store.contribute(id, { ...contribution, isNewMember: true });
  assert.ok(group);
  assert.equal(group.leaderboard[0].name, 'Block E', 'highest score ranks first');
  assert.equal(group.leaderboard.filter((m) => m.name === 'Block E').length, 1, 'repeat contributions merge');
  assert.equal(group.membersCount, SEED_COMMUNITIES[0].membersCount + 1);
});

test('contribute returns null for an unknown circle and create caps the number of circles', () => {
  const store = new CommunityStore();
  assert.equal(store.contribute('does-not-exist', contribution), null);
  for (let i = 0; i < MAX_COMMUNITY_GROUPS + 5; i += 1) {
    store.create({
      name: `Circle ${i}`,
      type: 'family',
      city: 'Pune',
      founderName: 'A',
      co2SavedKg: 20,
      smogScore: 70,
    });
  }
  assert.equal(store.list().length, MAX_COMMUNITY_GROUPS);
  assert.equal(store.list()[0].name, `Circle ${MAX_COMMUNITY_GROUPS + 4}`, 'newest circle is listed first');
});
