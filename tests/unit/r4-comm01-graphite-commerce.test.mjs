import assert from 'node:assert/strict';
import test from 'node:test';
import {
  R4_COMM01_FEATURE_FLAGS,
  R4_COMM01_MONETISATION_DECISION,
  R4_COMM01_PLANNED_CATALOG,
  R4_COMM01_THEME,
  validateR4Comm01Contract
} from '../../config/r4-comm01-graphite-commerce-contract.mjs';
import { inspectR4Comm01 } from '../../scripts/r4-comm01-graphite-commerce-gate.mjs';

test('R4-COMM-01 makes Graphite the product default without overwriting explicit choices', () => {
  assert.equal(R4_COMM01_THEME.productDefault, 'graphite');
  assert.deepEqual(R4_COMM01_THEME.preservedExplicitChoices, ['graphite', 'obsidian', 'ember']);
  assert.deepEqual(validateR4Comm01Contract(), []);
});

test('R4-COMM-01 keeps commerce inactive and blocks subscription-percentage referrals', () => {
  assert.equal(Object.values(R4_COMM01_FEATURE_FLAGS).every((value) => value === false), true);
  assert.equal(R4_COMM01_MONETISATION_DECISION.referral.status, 'share-only');
  assert.equal(R4_COMM01_MONETISATION_DECISION.referral.prohibited.includes('subscription percentage'), true);
  assert.equal(R4_COMM01_MONETISATION_DECISION.referral.prohibited.includes('commission'), true);
  assert.equal(R4_COMM01_MONETISATION_DECISION.processors.primaryCandidate, 'Dodo Payments');
  assert.equal(R4_COMM01_MONETISATION_DECISION.processors.selectionStatus, 'individual-underwriting-pending');
  assert.equal(R4_COMM01_MONETISATION_DECISION.processors.fallbackCandidate, null);
});

test('R4-COMM-01 models a generous free core plus planned maintained packs, not fake feature locks', () => {
  const free = R4_COMM01_PLANNED_CATALOG.find((entry) => entry.id === 'eon-free');
  assert.equal(free.lifecycle, 'active-local');
  assert.equal(free.plannedPriceUsdReference, 0);
  assert.equal(R4_COMM01_PLANNED_CATALOG.some((entry) => entry.lifecycle === 'active-paid'), false);
  for (const id of ['eon-plus', 'eon-studio', 'eon-power', 'eon-max']) assert.equal(R4_COMM01_PLANNED_CATALOG.find((entry) => entry.id === id)?.plannedPriceUsdReference, 'not-finalized-within-49.99-monthly-cap');
  assert.equal(R4_COMM01_PLANNED_CATALOG.find((entry) => entry.id === 'official-outcome-packs').plannedPriceUsdReference, 'not-finalized');
});

test('R4-COMM-01 source gate passes', () => {
  const report = inspectR4Comm01();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
