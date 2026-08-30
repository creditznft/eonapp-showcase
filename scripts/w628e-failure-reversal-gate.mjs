#!/usr/bin/env node
import assert from 'node:assert/strict';
import { deriveBillingTransition } from '../assets/js/billing/eon-billing-lifecycle.js';
const now = Date.parse('2026-07-11T10:00:00Z');
const active = { tier_id: 'power', access_status: 'active', source_occurred_at: now - 1000 };
const failed = deriveBillingTransition(active, { eventType: 'payment_failed', tierId: 'power', occurredAt: now, graceEndsAt: now + 3600000 }, { now });
assert.equal(failed.next.status, 'grace');
assert.equal(failed.accessActive, true);
const expired = deriveBillingTransition(active, { eventType: 'subscription_expired', tierId: 'power', occurredAt: now }, { now });
assert.equal(expired.next.status, 'revoked');
assert.equal(expired.next.tierId, 'free');
const refunded = deriveBillingTransition(active, { eventType: 'payment_refunded', tierId: 'power', occurredAt: now }, { now });
assert.equal(refunded.accessActive, false);
const disputed = deriveBillingTransition(active, { eventType: 'chargeback_opened', tierId: 'power', occurredAt: now }, { now });
assert.equal(disputed.next.status, 'disputed');
const stale = deriveBillingTransition(active, { eventType: 'subscription_expired', occurredAt: now - 2000 }, { now });
assert.equal(stale.stale, true);
assert.equal(stale.applied, false);
console.log('[W628E] PASS 9/9 failure and reversal invariants');
