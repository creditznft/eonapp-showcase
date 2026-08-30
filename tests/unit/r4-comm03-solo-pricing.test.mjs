import assert from 'node:assert/strict';
import test from 'node:test';
import {
  R4_COMM03_CURRENCY_POLICY,
  R4_COMM03_EON_INVITE_BOUNDARY,
  R4_COMM03_ORGANISATION_SCOPE,
  R4_COMM03_PRICE_BOOKS,
  R4_COMM03_SOLO_TIER_DESIGN,
  R4_COMM03_STATUS,
  validateR4Comm03Contract
} from '../../config/r4-comm03-solo-pricing-contract.mjs';
import { inspectR4Comm03 } from '../../scripts/r4-comm03-solo-pricing-gate.mjs';

function find(entries, id, billing) {
  return entries.find((entry) => entry.id === id && entry.billing === billing);
}

test('R4-COMM-03 preserves a generous free core and an inactive solo-only paid ladder', () => {
  assert.equal(R4_COMM03_STATUS.sourcePlanningOnly, true);
  assert.equal(R4_COMM03_STATUS.publicPricingActive, false);
  assert.equal(R4_COMM03_STATUS.checkoutActive, false);
  assert.equal(R4_COMM03_STATUS.recurringBillingActive, false);
  assert.equal(R4_COMM03_STATUS.eonInviteActive, false);
  assert.equal(R4_COMM03_STATUS.enterprisePlanActive, false);
  assert.deepEqual(validateR4Comm03Contract(), []);
  assert.equal(R4_COMM03_SOLO_TIER_DESIGN.find((tier) => tier.id === 'eon-free')?.state, 'active-local');
  assert.equal(R4_COMM03_SOLO_TIER_DESIGN.find((tier) => tier.id === 'eon-max')?.state, 'designed-not-for-sale');
});

test('R4-COMM-03 aligns India and global planning prices from $4.99 through $49.99', () => {
  assert.equal(R4_COMM03_CURRENCY_POLICY.browserSideFxAllowed, false);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.global, 'eon-plus', 'monthly')?.price, 4.99);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.india, 'eon-plus', 'monthly')?.price, 499);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.global, 'eon-studio', 'monthly')?.price, 14.99);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.india, 'eon-studio', 'monthly')?.price, 1499);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.global, 'eon-power', 'monthly')?.price, 29.99);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.india, 'eon-power', 'monthly')?.price, 2999);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.global, 'eon-max', 'monthly')?.price, 49.99);
  assert.equal(find(R4_COMM03_PRICE_BOOKS.subscriptions.india, 'eon-max', 'monthly')?.price, 4999);
});

test('R4-COMM-03 removes organisation and enterprise plans from the current roadmap without weakening EON Invite safety', () => {
  assert.equal(R4_COMM03_ORGANISATION_SCOPE.excluded.includes('EON Team'), true);
  assert.equal(R4_COMM03_ORGANISATION_SCOPE.excluded.includes('EON Scale'), true);
  assert.equal(R4_COMM03_ORGANISATION_SCOPE.excluded.includes('Enterprise'), true);
  assert.equal(R4_COMM03_EON_INVITE_BOUNDARY.currentActivation, false);
  assert.equal(R4_COMM03_EON_INVITE_BOUNDARY.status, 'planned-not-active-provider-approval-required');
});

test('R4-COMM-03 source gate passes', () => {
  const report = inspectR4Comm03();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.publicPricingActive, false);
  assert.equal(report.paymentsActivated, false);
  assert.equal(report.eonInviteActive, false);
  assert.equal(report.enterpriseActive, false);
});
