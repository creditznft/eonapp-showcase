import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { MONETIZATION_DECISION, assertNoActiveMonetization, isMonetizationActive } from '../../assets/js/utils/monetization-decision-gate.js';
import { getAccessMilestoneKillSwitch, getAccessMilestonePublicStatus } from '../../assets/js/access/access-milestones-registry.js';
import { canRenderSponsoredDiscovery, getSponsoredDiscoveryStatus } from '../../config/sponsored-discovery-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W215 decision remains disabled at every public commercial boundary', () => {
  assert.equal(isMonetizationActive(), false);
  for (const key of ['active', 'publicOfferwall', 'rewardedAds', 'referralRewards', 'revenueShare', 'payouts', 'subscriptionsFromRewards', 'callbackAcceptance']) assert.equal(MONETIZATION_DECISION[key], false, key);
  assert.equal(assertNoActiveMonetization().code, 'monetization_disabled');
  assert.equal(getAccessMilestonePublicStatus().active, false);
  assert.equal(getAccessMilestoneKillSwitch().engaged, true);
  assert.equal(getSponsoredDiscoveryStatus().active, false);
  assert.equal(canRenderSponsoredDiscovery('/chat').ok, false);
});

test('W215 legacy campaign rails stay disabled while RT92 Sponsor Keys remain server-authoritative', () => {
  for (const directory of ['functions/api/rewards', 'functions/api/nowpayments', 'functions/api/evm', 'functions/api/referrals', 'functions/api/ad-rewards', 'functions/api/social', 'functions/api/telegram']) {
    assert.equal(fs.existsSync(path.join(root, directory)), false, directory);
  }
  const page = fs.readFileSync(path.join(root, 'assets/js/access/rewards-status-page.js'), 'utf8');
  assert.match(page, /Rewarded Sponsor Terminal/);
  assert.match(page, /qualifying server-validated completion adds exactly 1 Sponsor Key/);
  assert.match(page, /Reward issuance is server-authoritative and duplicate\/replay protected/);
  assert.match(page, /Ordinary display advertising is disabled across EONAPP and EON City/);
  assert.match(page, /fetch\('\/api\/monetization\/rewarded'/);
  assert.doesNotMatch(page, /localStorage\.setItem|sessionStorage\.setItem|grantSponsorKey|mintSponsorKey/);
});
