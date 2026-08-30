import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMonetagPostbackUrl, createMonetagRewardEventId, getMonetagRewardedConfig, getMonetagRewardedSetupChecklist } from '../../assets/js/ads/monetag-rewarded.js';
import { onRequestGet as postbackGet } from '../../functions/api/ad-rewards/postback.js';
import { onRequestGet as statusGet } from '../../functions/api/ad-rewards/status.js';

function makeKv() {
  const map = new Map();
  return {
    async get(key, type) {
      const value = map.get(key);
      if (value == null) return null;
      return type === 'json' ? JSON.parse(value) : value;
    },
    async put(key, value) {
      map.set(key, value);
    },
    map
  };
}

function ctx(url, kv, secret = 'test-secret') {
  return {
    request: new Request(url),
    env: {
      AD_REWARDS_KV: kv,
      AD_REWARD_POSTBACK_SECRET: secret
    }
  };
}

test('W60 Monetag rewarded config uses live Telegram Mini App SDK zone', () => {
  const cfg = getMonetagRewardedConfig();
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.configured, true);
  assert.equal(cfg.zoneId, '11111741');
  assert.equal(cfg.scriptUrl, 'https://libtl.com/sdk.js');
  assert.equal(cfg.sdkFunctionName, 'show_11111741');
  assert.equal(cfg.postbackPath, '/api/ad-rewards/postback');
  const url = buildMonetagPostbackUrl({ origin: 'https://eonapp.ch', secret: 'SECRET' });
  assert.match(url, /provider=monetag/);
  assert.match(url, /ymid=\{ymid\}/);
  assert.match(url, /reward_event_type=\{reward_event_type\}/);
  assert.ok(getMonetagRewardedSetupChecklist('https://eonapp.ch').length >= 6);
  assert.match(createMonetagRewardEventId({ uid: 'user 1', action: 'claim reward' }), /^eon:user-1:claim-reward:/);
});

test('W57 Cloudflare postback accepts valued Monetag GET and stores verified credit', async () => {
  const kv = makeKv();
  const url = 'https://eonapp.ch/api/ad-rewards/postback?secret=test-secret&provider=monetag&ymid=eon:user1:claim:abc&zone_id=123&sub_zone_id=456&request_var=reward-access&event_type=impression&reward_event_type=valued&estimated_price=0.0042';
  const response = await postbackGet(ctx(url, kv));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.verified, true);
  assert.equal(body.record.monetizedCredits, 1);

  const status = await statusGet(ctx('https://eonapp.ch/api/ad-rewards/status?ymid=eon:user1:claim:abc', kv));
  const statusBody = await status.json();
  assert.equal(statusBody.ok, true);
  assert.equal(statusBody.found, true);
  assert.equal(statusBody.monetizedCredits, 1);
});

test('W57 Cloudflare postback is idempotent and rejects invalid secret', async () => {
  const kv = makeKv();
  const url = 'https://eonapp.ch/api/ad-rewards/postback?secret=test-secret&provider=monetag&ymid=dup-test&event_type=click&reward_event_type=valued';
  const first = await postbackGet(ctx(url, kv));
  assert.equal(first.status, 200);
  const second = await postbackGet(ctx(url, kv));
  const secondBody = await second.json();
  assert.equal(secondBody.duplicate, true);

  const bad = await postbackGet(ctx(url.replace('test-secret', 'bad'), kv));
  assert.equal(bad.status, 401);
});

test('W57 non-valued Monetag postback is logged but does not grant monetized credit', async () => {
  const kv = makeKv();
  const response = await postbackGet(ctx('https://eonapp.ch/api/ad-rewards/postback?secret=test-secret&provider=monetag&ymid=not-paid&event_type=impression&reward_event_type=non_valued', kv));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.verified, false);
  assert.equal(body.record.credits, 1);
  assert.equal(body.record.monetizedCredits, 0);
  assert.equal(body.record.entitlement, null);
});

test('W68 ad rewards store value-only provider receipts without IP country or user identity clutter', async () => {
  const kv = makeKv();
  const url = 'https://eonapp.ch/api/ad-rewards/postback?secret=test-secret&provider=monetag&ymid=eon:value-only:claim:abc&zone_id=123&sub_zone_id=456&request_var=reward-access&telegram_id=123456&uid=user-should-not-store&session_id=session-should-not-store&country=US&ip=1.2.3.4&userAgent=secret&event_type=impression&reward_event_type=valued&estimated_price=0.0042';
  const response = await postbackGet(ctx(url, kv));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.record.storageMode, 'value-only-provider-receipt-no-user-ip-country-storage');
  assert.equal(body.record.estimatedPriceTotal, 0.0042);
  assert.equal(body.record.valueCredits, 5);
  assert.equal(body.record.privacy.rawIpStored, false);
  assert.equal(body.record.privacy.countryStored, false);
  assert.equal(body.record.privacy.uidStored, false);
  assert.equal(body.record.privacy.telegramIdStored, false);
  assert.equal(body.record.privacy.sessionIdStored, false);

  for (const [key, raw] of kv.map.entries()) {
    assert.doesNotMatch(key, /uid|session|telegram/i);
    assert.doesNotMatch(String(raw), /1\.2\.3\.4|US|user-should-not-store|session-should-not-store|123456|secret/);
  }
});

test('W68 ad reward status requires Monetag ymid and does not support identity lookup', async () => {
  const kv = makeKv();
  const response = await statusGet(ctx('https://eonapp.ch/api/ad-rewards/status?uid=user1&session_id=session1', kv));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'ymid_required_value_only_mode');
});
