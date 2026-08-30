#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_REFERRAL_REVERSAL_REASONS, normalizeGrantTransition } from '../assets/js/referrals/eon-referral-program-w629.js';
const runtime = fs.readFileSync(new URL('../assets/js/referrals/eon-referral-server-runtime.js', import.meta.url), 'utf8');
for (const reason of ['refund', 'dispute', 'chargeback', 'abuse', 'support_reversal']) assert.ok(EON_REFERRAL_REVERSAL_REASONS.includes(reason));
assert.equal(normalizeGrantTransition({ from: 'consumed', to: 'revoked', reason: 'refund' }).ok, true);
assert.match(runtime, /UPDATE eon_key_unlocks[\s\S]*status = 'revoked'/);
assert.match(runtime, /eon_referral_support_audit/);
console.log('[W629D] PASS 8/8 reversal and support-audit invariants');
