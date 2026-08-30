#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReferralCertificationBoard, EON_W629_REAL_EVIDENCE_KEYS, redactReferralEvidence, validateW629ProgramContract } from '../assets/js/referrals/eon-referral-program-w629.js';
const config = JSON.parse(fs.readFileSync(new URL('../config/w629-referral-certification-board.json', import.meta.url), 'utf8'));
assert.equal(validateW629ProgramContract().ok, true);
assert.equal(EON_W629_REAL_EVIDENCE_KEYS.length, 19);
const board = buildReferralCertificationBoard({});
assert.equal(board.pass, false);
assert.equal(board.verdict, 'no-go-real-referral-evidence-pending');
assert.equal(board.publicRewardClaimsAllowed, false);
const redacted = redactReferralEvidence({ token: 'eon1.a.b', customerEmail: 'x@y.test', safeCount: 1 });
assert.equal(redacted.containsRawToken, false);
assert.equal(redacted.containsEmail, false);
assert.equal(config.publicRewardClaimsAllowed, false);
assert.equal(config.sourceOnlyCannotCertify, true);
console.log('[W629H] PASS 9/9 referral red-team certification invariants');
