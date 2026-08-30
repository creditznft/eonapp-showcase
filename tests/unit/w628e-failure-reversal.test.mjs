import test from 'node:test'; import assert from 'node:assert/strict'; import { deriveBillingTransition } from '../../assets/js/billing/eon-billing-lifecycle.js';
test('W628E refund and dispute revoke access while grace is bounded', () => { const now = 100000; const current = { tier_id: 'power', access_status: 'active', source_occurred_at: now - 1000 }; assert.equal(deriveBillingTransition(current, { eventType: 'payment_refunded', occurredAt: now }, { now }).accessActive, false); assert.equal(deriveBillingTransition(current, { eventType: 'chargeback_opened', occurredAt: now }, { now }).next.status, 'disputed'); assert.equal(deriveBillingTransition(current, { eventType: 'payment_failed', occurredAt: now, graceEndsAt: now + 1000 }, { now }).next.status, 'grace'); });

test('W628E subscription creation failure is not misclassified as an on-hold renewal', () => {
  const now = 100000;
  const empty = deriveBillingTransition(null, { eventType: 'subscription_failed', tierId: 'pro', occurredAt: now }, { now });
  assert.equal(empty.applied, false);
  assert.equal(empty.reason, 'no_entitlement_change');
  assert.equal(empty.accessActive, false);
  const existing = deriveBillingTransition({ tier_id: 'studio', access_status: 'active', source_occurred_at: now - 1000 }, { eventType: 'subscription_failed', tierId: 'pro', occurredAt: now }, { now });
  assert.equal(existing.applied, false);
  assert.equal(existing.next.status, 'active');
  assert.equal(existing.next.tierId, 'studio');
  assert.equal(existing.accessActive, true);
});
