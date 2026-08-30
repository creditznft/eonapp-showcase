import assert from 'node:assert/strict';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
  clear() { store.clear(); }
};
globalThis.window = { location: { origin: 'https://eonapp.ch' }, crypto: { getRandomValues(arr) { arr.fill(7); return arr; } } };
globalThis.location = { pathname: '/reward-access.html' };
globalThis.document = { body: {}, head: {}, createElement() { return {}; }, querySelector() { return null; }, getElementById() { return null; } };
globalThis.btoa = globalThis.btoa || ((value) => Buffer.from(String(value), 'binary').toString('base64'));
globalThis.atob = globalThis.atob || ((value) => Buffer.from(String(value), 'base64').toString('binary'));

const gateway = await import('../../assets/js/ads/reward-gateway.js');
const config = await import('../../assets/js/ads/config.js');
const sponsored = await import('../../assets/js/utils/ad-sponsored-subscription.js');
const entitlements = await import('../../assets/js/utils/entitlements.js');

test('ad-sponsored pass activates local Supporter only after credit threshold', () => {
  store.clear();
  const start = 1_800_000_000_000;
  for (let i = 0; i < config.AD_GATEWAY_POLICY.temporaryUpgradeCreditsRequired - 1; i += 1) {
    gateway.grantAdGatewayCredit({ now: start + i * 24 * 60 * 60 * 1000, provider: 'adwixo', action: 'claim-reward' });
  }
  const before = sponsored.evaluateAndApplyAdSponsoredAccess({ now: start + 99_000, provider: 'adwixo' });
  assert.equal(before.ok, false);
  assert.equal(before.reason, 'not-enough-new-credits');

  const thresholdTime = start + (config.AD_GATEWAY_POLICY.temporaryUpgradeCreditsRequired - 1) * 24 * 60 * 60 * 1000;
  gateway.grantAdGatewayCredit({ now: thresholdTime, provider: 'adwixo', action: 'claim-reward' });
  const after = sponsored.evaluateAndApplyAdSponsoredAccess({ now: thresholdTime + 1, provider: 'adwixo' });
  assert.equal(after.ok, true);
  assert.equal(after.activation.kind, 'temporary-supporter');
  const state = entitlements.getEntitlementState();
  assert.equal(state.activePlanId, 'supporter');
  assert.equal(state.status, 'active');
  assert.equal(state.paymentAsset, 'ad_sponsored');
  assert.ok(Date.parse(state.renewsAt) > start);
});

test('ad-sponsored monthly target is explicitly proof-gated', () => {
  const rules = sponsored.getAdSponsoredSubscriptionRules();
  assert.equal(rules.monthlyTarget.requiresServerProof, true);
  assert.equal(rules.localOnlyUntilPostback, true);
  assert.equal(config.canGrantPaidEntitlementFromCurrentAdCode('adwixo'), false);
  assert.equal(config.canGrantPaidEntitlementFromCurrentAdCode('monetag'), true);
});
