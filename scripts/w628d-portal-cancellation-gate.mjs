#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeBillingAction } from '../assets/js/billing/eon-dodo-customer-actions.js';
const entitlement = { tier_id: 'studio', provider_customer_ref: 'cus_1', provider_subscription_ref: 'sub_1' };
assert.equal(normalizeBillingAction({ action: 'portal', confirmed: true, idempotencyKey: 'portal:gate-1' }, entitlement).ok, true);
assert.equal(normalizeBillingAction({ action: 'cancel-at-period-end', confirmed: false }, entitlement).ok, false);
assert.equal(normalizeBillingAction({ action: 'reactivate', confirmed: true, idempotencyKey: 'reactivate:gate-1' }, entitlement).ok, true);
assert.equal(normalizeBillingAction({ action: 'change-plan', tier: 'plus', confirmed: true, idempotencyKey: 'change:plus:gate-1' }, entitlement).effectiveAt, 'next_billing_date');
assert.equal(normalizeBillingAction({ action: 'change-plan', tier: 'power', confirmed: true, idempotencyKey: 'change:power:gate-1' }, entitlement).effectiveAt, 'immediately');
const actions = fs.readFileSync(new URL('../assets/js/billing/eon-dodo-customer-actions.js', import.meta.url), 'utf8');
assert.match(actions, /customer-portal\/session/);
assert.match(actions, /cancel_at_next_billing_date/);
assert.match(actions, /webhookReconciliationRequired: true/);
assert.match(actions, /directEntitlementChange: false/);
console.log('[W628D] PASS 9/9 portal and cancellation invariants');
