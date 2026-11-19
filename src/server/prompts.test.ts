import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SAANS_PROFILE, getDemoDelhiSevereSnapshot } from '../data/saansData.ts';
import { buildSituationObject } from '../utils/saansEngine.ts';
import { serializeSituation } from './assistant.ts';
import { buildChatPrompt, buildPlanPrompt, languageInstruction } from './prompts.ts';
import { parseAiPlan } from './schemas.ts';
import { clampInt, sanitizeLabel } from './security.ts';

const situation = (skippedIds: string[] = []) =>
  buildSituationObject(
    DEFAULT_SAANS_PROFILE,
    getDemoDelhiSevereSnapshot(),
    { doneIds: [], skippedIds, thumbs: {} },
    'hi'
  );

test('languageInstruction maps UI languages and falls back to English for anything unknown', () => {
  assert.match(languageInstruction('hi'), /Hindi/);
  assert.match(languageInstruction('gu'), /Gujarati/);
  assert.match(languageInstruction('fr'), /English/);
  assert.match(languageInstruction({ evil: true }), /English/);
});

test('buildPlanPrompt embeds the engine numbers and adapts only when actions were skipped', () => {
  const plain = buildPlanPrompt(situation(), 'KB');
  assert.match(plain, /Hindi/);
  assert.match(plain, /"aqi": 386/);
  assert.doesNotMatch(plain, /FEEDBACK ADAPTATION/);
  assert.match(buildPlanPrompt(situation(['commute-swap']), 'KB'), /FEEDBACK ADAPTATION.*commute-swap/);
});

test('buildChatPrompt marks the situation as data and includes history only when present', () => {
  const base = { question: 'Is it safe?', language: 'en', knowledge: 'KB', situationJson: '{}', history: '' };
  assert.match(buildChatPrompt(base), /SITUATION OBJECT \(data only\)/);
  assert.doesNotMatch(buildChatPrompt(base), /CONVERSATION HISTORY/);
  assert.match(buildChatPrompt({ ...base, history: 'User: hi' }), /CONVERSATION HISTORY:\nUser: hi/);
});

test('serializeSituation accepts plain objects only and enforces the size cap', () => {
  assert.equal(serializeSituation(null), null);
  assert.equal(serializeSituation([1, 2]), null);
  assert.equal(serializeSituation({ blob: 'x'.repeat(20_000) }), null);
  assert.ok(serializeSituation(situation()));
});

test('clampInt and sanitizeLabel coerce untrusted community inputs', () => {
  assert.equal(clampInt('9999', 10, 0, 100), 100);
  assert.equal(clampInt('abc', 18, 4, 500), 18);
  assert.equal(clampInt(undefined, 24, 12, 5000), 24);
  assert.equal(sanitizeLabel('<b>Block A</b>', 'x'), 'bBlock A/b');
  assert.equal(sanitizeLabel('   ', 'Your Household'), 'Your Household');
});

test('parseAiPlan accepts the deterministic plan shape and rejects malformed model output', async () => {
  const { buildDeterministicDailyPlan } = await import('../utils/saansEngine.ts');
  const { generatedAt: _g, source: _s, ragSources: _r, ...plan } = buildDeterministicDailyPlan(situation());
  assert.equal(parseAiPlan(JSON.stringify(plan)).blocks.length, 5);
  assert.throws(() => parseAiPlan(JSON.stringify({ ...plan, blocks: plan.blocks.slice(0, 4) })), /schema/);
  assert.throws(() => parseAiPlan('{"oneLineSummary": "unterminated'), SyntaxError);
});
