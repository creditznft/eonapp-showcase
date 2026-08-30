import assert from 'node:assert/strict';
import test from 'node:test';

const config = await import('../../assets/js/ads/config.js');
const rewarded = await import('../../assets/js/ads/monetag-rewarded.js');

test('Monetag rewarded SDK is configured with the live W60 Telegram Mini App zone', () => {
  const cfg = rewarded.getMonetagRewardedConfig();
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.configured, true);
  assert.equal(cfg.requiresTelegramMiniApp, true);
  assert.equal(cfg.zoneId, '11111741');
  assert.equal(cfg.scriptUrl, 'https://libtl.com/sdk.js');
  assert.equal(cfg.sdkFunctionName, 'show_11111741');
  assert.equal(config.AD_NETWORKS.monetag.disabledLegacyWebsiteCodes.superiorTag.zone, '246944');
  assert.equal(config.AD_NETWORKS.monetag.disabledLegacyWebsiteCodes.smartlinkUrl, 'https://omg10.com/4/7024916');
  assert.equal(config.AD_NETWORKS.adwixo.enabled, false);
});

test('Monetag postback URL uses supported rewarded macros', () => {
  const url = rewarded.buildMonetagPostbackUrl({ origin: 'https://eonapp.ch', secret: 'secret-test' });
  assert.match(url, /provider=monetag/);
  assert.match(url, /ymid=\{ymid\}/);
  assert.match(url, /zone_id=\{zone_id\}/);
  assert.match(url, /reward_event_type=\{reward_event_type\}/);
  assert.match(url, /estimated_price=\{estimated_price\}/);
});

test('Monetag call options use rewarded interstitial primary and rewarded popup fallback', () => {
  const primary = rewarded.buildMonetagCallOptions({ ymid: 'eon-test', requestVar: 'claim_reward' });
  assert.equal(primary.format, 'rewarded-interstitial');
  assert.equal(primary.callArg.type, 'end');
  assert.equal(primary.callArg.ymid, 'eon-test');
  assert.equal(primary.callArg.requestVar, 'claim_reward');
  assert.equal(primary.callArg.catchIfNoFeed, true);

  const popup = rewarded.buildMonetagCallOptions({ ymid: 'eon-test', requestVar: 'claim_reward', format: 'rewarded-popup' });
  assert.equal(popup.format, 'rewarded-popup');
  assert.equal(popup.callArg.type, 'pop');
});

test('Monetag checklist keeps Cloudflare postback proof as required for real subscription rewards', () => {
  const checklist = rewarded.getMonetagRewardedSetupChecklist('https://eonapp.ch').join('\n');
  assert.match(checklist, /Telegram Mini App/i);
  assert.match(checklist, /Rewarded Interstitial/i);
  assert.match(checklist, /AD_REWARDS_KV/i);
  assert.match(checklist, /AD_REWARD_POSTBACK_SECRET/i);
});
