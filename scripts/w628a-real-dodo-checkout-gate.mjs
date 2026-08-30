#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeCheckoutRequest } from '../assets/js/billing/eon-dodo-live-runtime.js';
const source = fs.readFileSync(new URL('../assets/js/billing/eon-dodo-live-runtime.js', import.meta.url), 'utf8');
const env = { DODO_PRODUCT_PLUS: 'prod_plus' };
assert.equal(normalizeCheckoutRequest({ tier: 'plus', idempotencyKey: 'checkout:plus:gate-1' }, env).ok, true);
assert.equal(normalizeCheckoutRequest({ tier: 'free' }, env).ok, false);
assert.equal(normalizeCheckoutRequest({ tier: 'plus', browserEntitlementClaim: true }, env).ok, false);
assert.match(source, /eon_billing_checkout_sessions/);
assert.match(source, /'creating'/);
assert.match(source, /eon_checkout_attempt_id/);
assert.match(source, /entitlementGranted: false/);
assert.match(source, /checkout_ledger_unavailable/);
console.log('[W628A] PASS 8/8 controlled checkout invariants');
