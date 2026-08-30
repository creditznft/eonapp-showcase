import assert from 'node:assert/strict';
import test from 'node:test';
import { AD_CONFIG_VERSION, AD_GATEWAY_POLICY, AD_NETWORKS, hasNetworkCode, isRewardedSdkConfigured } from '../../assets/js/ads/config.js';
import { buildMonetagCallOptions, getMonetagRewardedConfig } from '../../assets/js/ads/monetag-rewarded.js';
import { isVerifiedRewardEventType } from '../../assets/js/ads/reward-gateway.js';

test('W60 enables only the real Monetag Rewarded SDK zone at runtime', () => {
  assert.equal(AD_CONFIG_VERSION, 'w60-monetag-rewarded-sdk-live-zone-v1');
  assert.equal(AD_NETWORKS.adwixo.enabled, false);
  assert.equal(AD_NETWORKS.monetag.enabled, true);
  assert.equal(AD_GATEWAY_POLICY.primaryNetwork, 'monetag');
  assert.equal(AD_GATEWAY_POLICY.fallbackNetwork, 'monetag');
  assert.equal(AD_GATEWAY_POLICY.activeFormats.monetagRewardedInterstitial, true);
  assert.equal(AD_GATEWAY_POLICY.activeFormats.monetagRewardedPopupFallback, true);
  assert.equal(AD_GATEWAY_POLICY.activeFormats.monetagSuperiorFallback, false);
  assert.equal(AD_GATEWAY_POLICY.activeFormats.monetagDirectLinkFallback, false);
  assert.equal(isRewardedSdkConfigured('monetag'), true);
  assert.equal(hasNetworkCode('monetag'), true);
});

test('W60 Monetag config matches the publisher SDK tag', () => {
  const cfg = getMonetagRewardedConfig();
  assert.equal(cfg.zoneId, '11111741');
  assert.equal(cfg.sdkFunctionName, 'show_11111741');
  assert.equal(cfg.scriptUrl, 'https://libtl.com/sdk.js');
  assert.equal(cfg.preferredFormat, 'rewarded-interstitial');
  assert.equal(cfg.fallbackFormat, 'rewarded-popup');
});

test('W60 call builder mirrors Monetag SDK examples safely with ymid/requestVar', () => {
  const interstitial = buildMonetagCallOptions({ ymid: 'eon:demo', requestVar: 'reward-center' });
  assert.deepEqual(interstitial.callArg, { type: 'end', ymid: 'eon:demo', requestVar: 'reward-center', catchIfNoFeed: true });

  const popup = buildMonetagCallOptions({ ymid: 'eon:demo', requestVar: 'reward-center', format: 'pop' });
  assert.deepEqual(popup.callArg, { type: 'pop', ymid: 'eon:demo', requestVar: 'reward-center', catchIfNoFeed: true });

  const inApp = buildMonetagCallOptions({ ymid: 'eon:demo', format: 'inApp' });
  assert.equal(inApp.callArg.type, 'inApp');
  assert.equal(inApp.callArg.inAppSettings.frequency, 2);
});

test('W60 verified reward-event types accept both yes and valued', () => {
  assert.equal(isVerifiedRewardEventType('yes'), true);
  assert.equal(isVerifiedRewardEventType('valued'), true);
  assert.equal(isVerifiedRewardEventType('paid'), true);
  assert.equal(isVerifiedRewardEventType('no'), false);
  assert.equal(isVerifiedRewardEventType(''), false);
});
