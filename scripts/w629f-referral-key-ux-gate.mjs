#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReferralUxModel } from '../assets/js/referrals/eon-referral-program-w629.js';
const page = fs.readFileSync(new URL('../assets/js/referrals/eon-keys-page.js', import.meta.url), 'utf8');
const model = buildReferralUxModel({ active: true, signedIn: true, account: { balances: {}, grants: [] } });
assert.equal(model.ordinarySharingSeparate, true);
assert.equal(model.moneyLanguageAllowed, false);
assert.equal(model.wholeTierSubstitutionAllowed, false);
assert.ok(model.prohibitedRewardForms.includes('cash'));
assert.ok(model.prohibitedRewardForms.includes('renewal-credit'));
assert.ok(model.disclosures.some((line) => /Clicks/.test(line)));
assert.match(page, /buildReferralUxModel/);
assert.match(page, /A click or share never grants a key/);
console.log('[W629F] PASS 8/8 truthful referral and key UX invariants');
