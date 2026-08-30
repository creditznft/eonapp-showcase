#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateReferralAttribution } from '../assets/js/referrals/eon-referral-program-w629.js';
const runtime = fs.readFileSync(new URL('../assets/js/referrals/eon-referral-server-runtime.js', import.meta.url), 'utf8');
const valid = validateReferralAttribution({ inviterAccountId: 'inviter', inviteeAccountId: 'invitee', inviterReferralId: 'ref', tokenVerified: true, inviterProofVerified: true });
assert.equal(valid.ok, true);
assert.equal(valid.oneLevelOnly, true);
assert.equal(valid.rawTokenStored, false);
assert.equal(validateReferralAttribution({ inviterAccountId: 'same', inviteeAccountId: 'same', inviterReferralId: 'ref', tokenVerified: true, inviterProofVerified: true }).ok, false);
assert.equal(validateReferralAttribution({ inviterAccountId: 'a', inviteeAccountId: 'b', inviterReferralId: 'ref', tokenVerified: false, inviterProofVerified: true }).ok, false);
assert.equal(validateReferralAttribution({ inviterAccountId: 'a', inviteeAccountId: 'b', inviterReferralId: 'ref', tokenVerified: true, inviterProofVerified: true, referralDepth: 2 }).ok, false);
assert.match(runtime, /fresh-p256-challenge/);
assert.match(runtime, /source_token_hash/);
console.log('[W629A] PASS 8/8 signed one-level attribution invariants');
