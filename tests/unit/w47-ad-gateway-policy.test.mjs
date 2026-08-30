import assert from 'node:assert/strict';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
  clear() { store.clear(); }
};
globalThis.window = { location: { origin: 'https://eonapp.ch' }, open() {} };
globalThis.location = { pathname: '/reward-access.html' };
globalThis.document = {
  body: { appendChild() {} },
  head: { appendChild() {} },
  createElement(tag) {
    return {
      tagName: tag,
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      appendChild() {},
      addEventListener() {},
    };
  },
  querySelector() { return null; },
  getElementById() { return null; }
};

const gateway = await import('../../assets/js/ads/reward-gateway.js');
const config = await import('../../assets/js/ads/config.js');

test('W60 ad gateway is Monetag Rewarded-only with Adwixo and multitag disabled', () => {
  assert.equal(config.AD_CONFIG_VERSION, 'w60-monetag-rewarded-sdk-live-zone-v1');
  assert.equal(config.AD_GATEWAY_POLICY.enabled, true);
  assert.equal(config.AD_GATEWAY_POLICY.thirdPartyRuntimeEnabled, true);
  assert.equal(config.AD_GATEWAY_POLICY.mode, 'monetag-rewarded-only-postback-proof');
  assert.equal(config.AD_GATEWAY_POLICY.primaryNetwork, 'monetag');
  assert.equal(config.AD_GATEWAY_POLICY.fallbackNetwork, 'monetag');
  assert.equal(config.AD_NETWORKS.adwixo.enabled, false);
  assert.equal(config.AD_NETWORKS.monetag.enabled, true);
  assert.equal(config.AD_GATEWAY_POLICY.activeFormats.passiveBanners, false);
  assert.equal(config.AD_GATEWAY_POLICY.activeFormats.monetagSuperiorFallback, false);
  assert.equal(config.AD_GATEWAY_POLICY.activeFormats.monetagDirectLinkFallback, false);
  assert.equal(config.hasNetworkCode('adwixo'), false);
  assert.equal(config.hasNetworkCode('monetag'), true);
  assert.equal(config.isNetworkEnabled('monetag', '/reward-access.html'), true);
  assert.equal(config.isNetworkEnabled('monetag', '/vault.html'), false);
});

test('paid entitlements require Monetag Rewarded SDK plus valued Cloudflare postback proof', () => {
  assert.equal(config.AD_GATEWAY_POLICY.requiresRewardedCompletion, true);
  assert.equal(config.AD_GATEWAY_POLICY.requireValuedPostbackForServerEntitlement, true);
  assert.equal(config.canGrantPaidEntitlementFromCurrentAdCode('adwixo'), false);
  assert.equal(config.canGrantPaidEntitlementFromCurrentAdCode('monetag'), true);
  const policy = config.getAdLaunchPolicy();
  assert.match(policy.reason, /W60 uses the real Monetag Telegram Mini App Rewarded SDK/i);
  assert.match(policy.replacement, /Cloudflare.*Monetag postback URL/i);
});

test('sensitive routes cannot use reward ads', () => {
  assert.equal(gateway.isSensitiveAdRoute('/vault.html'), true);
  assert.equal(gateway.isSensitiveAdRoute('/billing.html'), true);
  assert.equal(gateway.isSensitiveAdRoute('/reward-access.html'), false);
  assert.equal(gateway.canUseAdGateway({ route: '/vault.html', action: 'claim-reward' }).ok, false);
});

test('limits enforce cooldown, hourly, daily, and per-network caps for Monetag rewarded actions', () => {
  store.clear();
  const start = 1_800_000_000_000;
  assert.equal(gateway.canUseAdGateway({ now: start, route: '/reward-access.html', action: 'claim-reward', provider: 'monetag' }).ok, true);
  gateway.recordAdGatewayAttempt({ now: start, provider: 'monetag', action: 'claim-reward', route: '/reward-access.html', completed: false });
  assert.equal(gateway.canUseAdGateway({ now: start + 1_000, route: '/reward-access.html', action: 'claim-reward', provider: 'monetag' }).reason, 'cooldown-active');
});

test('gateway credits are capped and remain local until postback proof upgrades the account', () => {
  store.clear();
  const start = 1_800_000_000_000;
  for (let i = 0; i < config.AD_GATEWAY_POLICY.dailySubscriptionCreditCap; i += 1) {
    const result = gateway.grantAdGatewayCredit({ now: start + i * 1000, provider: 'monetag', action: 'claim-reward', enableTemporaryUpgrade: true, enableSupporterPass: true });
    assert.equal(result.ok, true);
    assert.equal(result.proofGated, true);
  }
  const capped = gateway.grantAdGatewayCredit({ now: start + 99_000, provider: 'monetag', action: 'claim-reward' });
  assert.equal(capped.ok, false);
  assert.equal(capped.reason, 'daily-credit-cap');
});
