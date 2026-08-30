import assert from 'node:assert/strict';
import test from 'node:test';
import {
  R4_COMM02_EON_INVITE,
  R4_COMM02_FEATURE_FLAGS,
  R4_COMM02_PRICE_BOOKS,
  R4_COMM02_PROVIDER_STRATEGY,
  R4_COMM02_TIER_DESIGN,
  validateR4Comm02Contract
} from '../../config/r4-comm02-global-commerce-contract.mjs';
import { inspectR4Comm02 } from '../../scripts/r4-comm02-global-commerce-gate.mjs';

test('R4-COMM-02 keeps every merchant, payment and reward mechanism inactive', () => {
  assert.equal(Object.values(R4_COMM02_FEATURE_FLAGS).every((value) => value === false), true);
  assert.deepEqual(validateR4Comm02Contract(), []);
  assert.equal(R4_COMM02_PROVIDER_STRATEGY.state, 'research-complete-provider-not-selected');
});

test('R4-COMM-02 models EON Invite as a single-level non-cash promotion, not referral income', () => {
  assert.equal(R4_COMM02_EON_INVITE.status, 'planned-not-active-provider-approval-required');
  assert.match(R4_COMM02_EON_INVITE.proposedBenefit.invitee, /20%/);
  assert.match(R4_COMM02_EON_INVITE.proposedBenefit.milestone, /30-day Plus extension/);
  assert.equal(R4_COMM02_EON_INVITE.prohibited.includes('commission'), true);
  assert.equal(R4_COMM02_EON_INVITE.prohibited.includes('percentage of another user payment'), true);
  assert.equal(R4_COMM02_EON_INVITE.prohibited.includes('multilevel reward'), true);
  assert.equal(R4_COMM02_EON_INVITE.qualification.neverQualifies.includes('a free signup'), true);
});

test('R4-COMM-02 provides fixed INR and USD planning price books while preserving an Enterprise gate', () => {
  assert.equal(R4_COMM02_PRICE_BOOKS.status, 'planned-not-public-not-for-sale');
  assert.equal(R4_COMM02_PRICE_BOOKS.india.currency, 'INR');
  assert.equal(R4_COMM02_PRICE_BOOKS.global.currency, 'USD');
  assert.equal(R4_COMM02_PRICE_BOOKS.global.entries.find((entry) => entry.id === 'eon-plus' && entry.billing === 'monthly')?.price, 4.99);
  assert.equal(R4_COMM02_PRICE_BOOKS.global.entries.find((entry) => entry.id === 'eon-scale')?.price, 199);
  assert.equal(R4_COMM02_TIER_DESIGN.find((entry) => entry.id === 'eon-scale')?.state, 'future-specification-only');
  assert.equal(R4_COMM02_TIER_DESIGN.find((entry) => entry.id === 'eon-enterprise')?.state, 'future-contract-only');
});

test('R4-COMM-02 source gate passes', () => {
  const report = inspectR4Comm02();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
