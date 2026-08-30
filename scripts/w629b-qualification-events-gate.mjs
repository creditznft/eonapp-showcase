#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyReferralSignal, EON_REFERRAL_NON_QUALIFYING_EVENTS, EON_REFERRAL_QUALIFYING_EVENTS } from '../assets/js/referrals/eon-referral-program-w629.js';
const runtime = fs.readFileSync(new URL('../assets/js/referrals/eon-referral-server-runtime.js', import.meta.url), 'utf8');
assert.equal(classifyReferralSignal('share').qualifies, false);
assert.equal(classifyReferralSignal('click').qualifies, false);
assert.equal(classifyReferralSignal('first_project_saved').qualifies, true);
assert.ok(EON_REFERRAL_NON_QUALIFYING_EVENTS.includes('trial_start'));
assert.ok(EON_REFERRAL_QUALIFYING_EVENTS.includes('retained_paid_customer'));
assert.match(runtime, /server_milestone_receipt_required/);
assert.match(runtime, /server_milestone_receipt_already_consumed/);
assert.match(runtime, /qualification_receipt_issuer_rejected/);
console.log('[W629B] PASS 8/8 server-issued qualification invariants');
