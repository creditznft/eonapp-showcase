import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCEOCertificationPlan,
  validateCEOCertificationPlan,
  summarizeGapRegistry,
  buildOldAuditGapRegistry
} from '../../assets/js/utils/ceo-master-certification.js';


test('CEO certification plan defines exactly three final waves', () => {
  const plan = buildCEOCertificationPlan();
  assert.equal(plan.extraWaves.length, 3);
  assert.ok(plan.extraWaves.some((wave) => /Wave 14/i.test(wave.title)));
  assert.ok(plan.extraWaves.some((wave) => /Wave 15/i.test(wave.title)));
  assert.ok(plan.extraWaves.some((wave) => /Wave 16/i.test(wave.title)));
});

test('CEO certification plan tracks old audit gaps and external proof blockers', () => {
  const gaps = buildOldAuditGapRegistry();
  const summary = summarizeGapRegistry(gaps);
  assert.ok(summary.total >= 10);
  assert.ok(summary.codedImproved >= 7);
  assert.ok(gaps.some((gap) => gap.currentStatus === 'external-blocker' && /build|deploy|payment/i.test(gap.remainingAction)));
});

test('CEO certification validates hard stops and private workstation rule', () => {
  const plan = buildCEOCertificationPlan();
  const validation = validateCEOCertificationPlan(plan);
  assert.equal(validation.ok, true, validation.problems.join('; '));
  assert.ok(plan.hardStop.some((item) => /Dodo/i.test(item)));
  assert.ok(plan.hardStop.some((item) => /referral\/EON Key grants/i.test(item)));
  assert.ok(plan.oldAuditGaps.some((gap) => gap.id === 'W2-DODO-IDEMPOTENCY'));
  assert.ok(plan.shortCEOChecklist.some((item) => /private/i.test(item) && /workstation/i.test(item)));
});
