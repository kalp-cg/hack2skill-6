import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeterministicDailyPlan,
  buildSituationObject,
  calculateCpcbAqi,
  computeCommuteAlternatives,
  computeMemberRisks,
  computeRoomCadr,
  computeWhatIfImpact,
  detectInversionWarning,
  findBestAndWorstHours48,
  getAqiBand,
} from './saansEngine';
import { DEFAULT_SAANS_PROFILE, getDemoDelhiSevereSnapshot } from '../data/saansData';

test('calculateCpcbAqi follows official Indian CPCB PM2.5 & PM10 breakpoints', () => {
  assert.equal(calculateCpcbAqi(20, 0), 33);
  assert.equal(calculateCpcbAqi(20, 40), 40);
  assert.equal(calculateCpcbAqi(60, 80), 100);
  assert.equal(calculateCpcbAqi(120, 200), 300);
  assert.equal(calculateCpcbAqi(232, 378), 386);
  assert.equal(calculateCpcbAqi(450, 500), 480);
});

test('getAqiBand triggers Smog Emergency Mode strictly above 300 AQI', () => {
  assert.equal(getAqiBand(295).isEmergency, false);
  assert.equal(getAqiBand(301).isEmergency, true);
  assert.equal(getAqiBand(420).band, 'severe');
});

test('detectInversionWarning detects severe winter trapping under calm cold air', () => {
  const warn = detectInversionWarning(232, 4.2, 11.4, 79, 210);
  assert.equal(warn.active, true);
  assert.equal(warn.severity, 'Severe');
  assert.equal(warn.mixingHeightM, 210);
});

test('computeMemberRisks marks asthmatic child as Critical under Severe Delhi Smog', () => {
  const demo = getDemoDelhiSevereSnapshot();
  const risks = computeMemberRisks(demo.aqi, DEFAULT_SAANS_PROFILE);
  const kidRisk = risks.find((r) => r.memberLabel.includes('Aarav'));
  assert.ok(kidRisk);
  assert.equal(kidRisk.risk, 'Critical');
  assert.ok(kidRisk.guidance.includes('indoors'));
});

test('computeRoomCadr computes 120 sq ft bedroom CADR accurately', () => {
  assert.equal(computeRoomCadr(120), 162);
  assert.equal(computeRoomCadr(200), 270);
});

test('computeCommuteAlternatives calculates INR savings and CO2 reduction for metro vs car', () => {
  const options = computeCommuteAlternatives(14, 'car', 180, 1);
  const metro = options.find((o) => o.mode === 'metro');
  const car = options.find((o) => o.mode === 'car');
  assert.ok(metro && car);
  assert.ok(metro.monthlySavingsInr > 2000);
  assert.ok(metro.monthlyCo2SavedKg > 50);
  assert.ok(metro.commutePm25UgM3 < car.commutePm25UgM3);
});

test('computeWhatIfImpact produces bounded Smog Score, weekly trend, and cigarette approximation', () => {
  const demo = getDemoDelhiSevereSnapshot();
  const report = computeWhatIfImpact(
    DEFAULT_SAANS_PROFILE,
    demo,
    {
      commuteMode: 'metro',
      purifierHours: 16,
      maskCompliancePct: 90,
      cleanCookingAndSeal: true,
    },
    3
  );
  assert.ok(report.smogScore >= 70 && report.smogScore <= 100);
  assert.equal(report.weeklyTrend.length, 7);
  assert.ok(report.exposureCutPct > 45);
  assert.ok(report.cigarettesAvoidedPerWeekApprox > 10);
  assert.ok(report.monthlyMoneySavedInr > 2500);
  assert.equal(report.formulas.length, 4);
});

test('buildDeterministicDailyPlan adapts when commute-swap is skipped', () => {
  const demo = getDemoDelhiSevereSnapshot();
  const situation = buildSituationObject(
    DEFAULT_SAANS_PROFILE,
    demo,
    { doneIds: [], skippedIds: ['commute-swap'], thumbs: { 'commute-swap': 'down' } },
    'en'
  );
  const plan = buildDeterministicDailyPlan(situation);
  assert.equal(plan.blocks.length, 5);
  assert.ok(plan.adaptedNote?.includes('skipped'));
  assert.ok(plan.blocks[1].action.toLowerCase().includes('work-from-home'));
});

test('findBestAndWorstHours48 spans both Today and Tomorrow', () => {
  const demo = getDemoDelhiSevereSnapshot();
  const bw = findBestAndWorstHours48(demo.forecast48h);
  assert.ok(bw.bestAvgAqi < bw.worstAqi);
  assert.ok(bw.tomorrowBestAqi > 0);
});
