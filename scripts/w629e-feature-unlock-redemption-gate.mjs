#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonKeyRedemptionDecision } from '../assets/js/referrals/eon-referral-program-w629.js';
import { getEonUnlockMenu } from '../assets/js/referrals/eon-keys-catalog.js';
const runtime = fs.readFileSync(new URL('../assets/js/referrals/eon-referral-server-runtime.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../migrations/referrals/0001_referral_authority.sql', import.meta.url), 'utf8');
const decision = buildEonKeyRedemptionDecision({ accountId: 'a', grant: { grantId: 'g', accountId: 'a', keyType: 'signal', status: 'available' }, unlockId: 'signal-project-slot-30d' });
assert.equal(decision.ok, true);
assert.equal(decision.serverEntitlementRequired, true);
assert.equal(decision.wholeTierSubstitution, false);
assert.equal(decision.cashValue, false);
assert.ok(getEonUnlockMenu().every((item) => item.category !== 'subscription'));
assert.match(migration, /source_grant_id TEXT NOT NULL UNIQUE/);
assert.match(runtime, /subscriptionCreated: false/);
assert.match(runtime, /providerCreditCreated: false/);
console.log('[W629E] PASS 8/8 individual feature-redemption invariants');
