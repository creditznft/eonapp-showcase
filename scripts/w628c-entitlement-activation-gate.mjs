#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildBillingPublicState, deriveBillingTransition } from '../assets/js/billing/eon-billing-lifecycle.js';
const now = Date.parse('2026-07-11T10:00:00Z');
const transition = deriveBillingTransition(null, { eventType: 'payment_succeeded', accountId: 'a', tierId: 'power', occurredAt: now, currentPeriodEnd: now + 86400000 }, { now });
assert.equal(transition.applied, true);
assert.equal(transition.next.status, 'active');
assert.equal(transition.accessActive, true);
const state = buildBillingPublicState({ tier_id: 'power', status: 'active' }, { tier_id: 'power', access_status: 'active', current_period_end: now + 86400000 }, { now });
assert.equal(state.accessActive, true);
assert.equal(state.browserUnlockAllowed, false);
assert.equal(state.serverAuthoritative, true);
const browser = fs.readFileSync(new URL('../assets/js/commerce/billing-commercial-status.js', import.meta.url), 'utf8');
assert.match(browser, /signed Dodo webhook/);
assert.match(browser, /Browser storage cannot award/);
console.log('[W628C] PASS 8/8 entitlement activation invariants');
