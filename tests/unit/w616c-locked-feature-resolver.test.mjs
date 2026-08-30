import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_LOCKED_FEATURES,
  getKeyUnlocksForLockedFeature,
  getSubscribeOptionsForLockedFeature,
  getTrialOptionsForLockedFeature,
  renderLockedFeatureCta,
  resolveLockedFeature,
  validateLockedFeatureResolver
} from '../../assets/js/referrals/eon-feature-unlock-resolver.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W616C locked feature resolver validates all premium gates', () => {
  const report = validateLockedFeatureResolver();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.ok(report.featureCount >= 12);
  assert.deepEqual([...new Set(EON_LOCKED_FEATURES.map((feature) => feature.requiredTier))].sort(), ['max', 'plus', 'power', 'pro', 'studio', 'ultra']);
});

test('W616C every locked feature resolves purchase paths while EONKEY eligibility stays explicit', () => {
  for (const feature of EON_LOCKED_FEATURES) {
    const resolution = resolveLockedFeature(feature.id, { keyInventory: { signal: 1, builder: 1, power: 1 }, checkoutActive: true, keyRedemptionActive: false });
    assert.equal(resolution.ok, true, feature.id);
    assert.ok(resolution.actions.subscribe.length >= 1, `${feature.id} missing purchase path`);
    if (feature.requiredTier !== 'ultimate') assert.ok(resolution.actions.trial.length >= 1, `${feature.id} missing trial`);
    if (feature.eonKeyEligible === false) {
      assert.equal(resolution.actions.refer, null, `${feature.id} must be purchase-only`);
      assert.equal(resolution.actions.useKey.length, 0, `${feature.id} must not expose key shortcuts`);
    } else {
      assert.ok(resolution.actions.refer, `${feature.id} missing referral review`);
      assert.ok(resolution.actions.useKey.length >= 1, `${feature.id} missing eligible key path`);
    }
    assert.equal(resolution.checkoutActive, true);
    assert.equal(resolution.liveGrantActive, false);
  }
});

test('W616C local AI and own API-key gates never imply EONAPP-paid generation', () => {
  const aiFeatures = EON_LOCKED_FEATURES.filter((feature) => feature.category === 'ai-workflow' || feature.requiresUserLocalOrOwnProviderKey);
  assert.ok(aiFeatures.length >= 4);
  for (const feature of aiFeatures) {
    const resolution = resolveLockedFeature(feature.id);
    assert.equal(feature.platformPaidAiCost, false, feature.id);
    assert.equal(resolution.aiBoundary.platformPaidHostedGeneration, false, feature.id);
    assert.match(resolution.copy.ai, /local AI runtime|own provider\/API key/i, feature.id);
    for (const unlock of getKeyUnlocksForLockedFeature(feature.id)) assert.equal(unlock.platformPaidAiCost, false, unlock.id);
  }
});

test('W616C keys expose selected Max-level individual unlocks without whole-plan passes', () => {
  const max = resolveLockedFeature('max-local-ai-workrooms', { keyInventory: { power: 1 }, checkoutActive: true, keyRedemptionActive: false });
  assert.equal(max.ok, true);
  assert.ok(max.actions.useKey.some((action) => action.keyType === 'power'));
  assert.equal(max.actions.useKey.some((action) => /feature-pass|free plan|whole plan/i.test(action.label)), false);
  assert.ok(max.actions.subscribe.some((action) => action.tierId === 'max'));
  assert.ok(max.actions.trial.some((action) => action.enabled === true && action.tierId === 'max'));
  assert.equal(max.actions.useKey.every((action) => action.enabled === false), true);
});

test('W616C page renders live Billing choices and proof-gated EONKEY CTAs', () => {
  const pageScript = read('assets/js/referrals/eon-keys-page.js');
  const page = read('eon-keys.html');
  assert.match(pageScript, /renderLockedFeatureCta/);
  assert.match(pageScript, /Locked feature resolver examples/);
  assert.match(page, /eon-key-lock-grid/);
  assert.match(page, /data-commercial-active="true"/);
  assert.match(page, /data-key-redemption-active="server-rollout"/);
  const html = renderLockedFeatureCta('own-api-key-workflows', { keyInventory: { signal: 1, builder: 1 }, checkoutActive: true, keyRedemptionActive: false });
  assert.match(html, /Subscribe|Upgrade/i);
  assert.match(html, /trial/i);
  assert.match(html, /Review referral &amp; EONKEYS/);
  assert.match(html, /Use signal key|Use builder key/i);
  assert.match(html, /server-ledger redemption has not been enabled/i);
});

test('W616C resolver avoids billing-credit and money-like referral language', () => {
  const combined = `${JSON.stringify(EON_LOCKED_FEATURES)}\n${read('assets/js/referrals/eon-keys-page.js')}`;
  assert.doesNotMatch(combined, /cashback|wallet balance|crypto payout|free month|renewal discount|paid AI credit|lootbox|jackpot|spin/i);
});
