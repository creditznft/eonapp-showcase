#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_KEY_GRANT_STATES, normalizeGrantTransition } from '../assets/js/referrals/eon-referral-program-w629.js';
const runtime = fs.readFileSync(new URL('../assets/js/referrals/eon-referral-server-runtime.js', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../migrations/referrals/0001_referral_authority.sql', import.meta.url), 'utf8');
assert.ok(EON_KEY_GRANT_STATES.includes('pending'));
assert.ok(EON_KEY_GRANT_STATES.includes('available'));
assert.ok(EON_KEY_GRANT_STATES.includes('consumed'));
assert.equal(normalizeGrantTransition({ from: 'revoked', to: 'available' }).ok, false);
assert.match(runtime, /INSERT OR IGNORE INTO eon_key_grants/);
assert.match(runtime, /eon_key_grant_journal/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS eon_key_grant_journal/);
assert.match(runtime, /yearly_paid_referral_cap_reached/);
console.log('[W629C] PASS 8/8 idempotent grant-ledger invariants');
