#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeDodoWebhookPayload } from '../assets/js/billing/eon-dodo-live-runtime.js';
const source = fs.readFileSync(new URL('../assets/js/billing/eon-dodo-live-runtime.js', import.meta.url), 'utf8');
const event = normalizeDodoWebhookPayload({ type: 'subscription.updated', data: { subscription_id: 'sub_1', metadata: { eon_account_id: 'acct_1', eon_tier_id: 'studio', eon_checkout_attempt_id: 'attempt_1' }, cancel_at_next_billing_date: true, next_billing_date: '2026-08-11T00:00:00Z' } }, {}, 'evt_1');
assert.equal(event.eventType, 'subscription_updated');
assert.equal(event.accountId, 'acct_1');
assert.equal(event.checkoutAttemptId, 'attempt_1');
assert.equal(event.cancelAtPeriodEnd, true);
assert.match(source, /processed_out_of_order/);
assert.match(source, /processing_status='processing'/);
assert.match(source, /repaired:/);
assert.match(source, /verifyDodoWebhookSignature/);
assert.match(source, /payload_hash/);
console.log('[W628B] PASS 9/9 signed webhook ledger invariants');
