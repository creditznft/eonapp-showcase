import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as launchOfferwall } from '../../functions/api/rewards/launch.js';
import { onRequestPost as receivePostback } from '../../functions/api/rewards/postback.js';
import { onRequestGet as rewardConfig } from '../../functions/api/rewards/config.js';
import { EON_REWARD_PRIMARY_PROVIDER, EON_REWARD_RULES } from '../../assets/js/rewards/eon-reward-policy.js';

function createKv() {
  const rows = new Map();
  return {
    rows,
    async get(key, type) {
      const value = rows.get(key);
      return type === 'json' && value ? JSON.parse(value) : value || null;
    },
    async put(key, value) { rows.set(key, value); }
  };
}

function request(url, { method = 'POST', body, headers = {} } = {}) {
  return new Request(url, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
}

function configuredEnv() {
  const kv = createKv();
  return {
    EON_REWARDS_KV: kv,
    EON_REWARD_MYLEAD_ENABLED: 'true',
    EON_REWARD_MYLEAD_POSTBACK_SECRET: 'mylead-unit-secret',
    EON_REWARD_MYLEAD_POSTBACK_ALLOWED_IPS: '198.51.100.0/24',
    EON_REWARD_MYLEAD_OFFERWALL_URL: 'https://reward.example.test/offerwall?player_id={{account_token}}&ml_sub1={{account_token}}',
    __kv: kv
  };
}

function callbackHeaders(ip = '198.51.100.44') {
  return { 'cf-connecting-ip': ip };
}

test('W206 names MyLead as the primary provider and keeps credits non-cash', () => {
  assert.equal(EON_REWARD_PRIMARY_PROVIDER, 'mylead');
  assert.equal(EON_REWARD_RULES.creditTransferable, false);
  assert.equal(EON_REWARD_RULES.creditCashValue, false);
  assert.equal(EON_REWARD_RULES.forbiddenRedemptions.includes('trading capital'), true);
});

test('W206 launches MyLead with a UUID-like opaque player_id, never a local account id', async () => {
  const env = configuredEnv();
  const accountId = 'local-profile-abcdefghijklmnop';
  const response = await launchOfferwall({
    env,
    request: request('https://eonapp.ch/api/rewards/launch', { body: { provider: 'mylead', account_id: accountId } })
  });
  const body = await response.json();
  const url = new URL(body.offerwallUrl);
  assert.equal(response.status, 201);
  assert.equal(body.provider.id, 'mylead');
  assert.match(url.searchParams.get('player_id') || '', /^[A-Za-z0-9_-]{24,160}$/);
  assert.equal(url.searchParams.get('player_id'), url.searchParams.get('ml_sub1'));
  assert.doesNotMatch(body.offerwallUrl, new RegExp(accountId));
  assert.doesNotMatch(JSON.stringify(body), /mylead-unit-secret/);
});

test('W206 accepts the MyLead pre-approved → approved → rejected lifecycle once and credits virtual_amount only on approved', async () => {
  const env = configuredEnv();
  const accountId = 'local-profile-abcdefghijklmnop';
  const launch = await (await launchOfferwall({
    env,
    request: request('https://eonapp.ch/api/rewards/launch', { body: { provider: 'mylead', account_id: accountId } })
  })).json();
  const token = new URL(launch.offerwallUrl).searchParams.get('player_id');
  assert.ok(token);

  const callbackUrl = new URL('https://eonapp.ch/api/rewards/postback');
  callbackUrl.searchParams.set('provider', 'mylead');
  callbackUrl.searchParams.set('secret', 'mylead-unit-secret');
  callbackUrl.searchParams.set('transaction_id', 'mylead-tx-1');
  callbackUrl.searchParams.set('player_id', token);
  callbackUrl.searchParams.set('ml_sub1', token);
  callbackUrl.searchParams.set('status', 'pre-approved');
  callbackUrl.searchParams.set('virtual_amount', '125');
  callbackUrl.searchParams.set('payout_decimal', '1.25');

  const pending = await (await receivePostback({ env, request: request(callbackUrl.toString(), { headers: callbackHeaders() }) })).json();
  assert.equal(pending.ok, true);
  assert.equal(pending.record.state, 'pending');
  assert.equal(pending.summary.confirmedCredits, 0);

  callbackUrl.searchParams.set('status', 'approved');
  const approved = await (await receivePostback({ env, request: request(callbackUrl.toString(), { headers: callbackHeaders() }) })).json();
  assert.equal(approved.ok, true);
  assert.deepEqual(approved.transition, { from: 'pending', to: 'confirmed' });
  assert.equal(approved.record.credits, 125);
  assert.equal(approved.summary.confirmedCredits, 125);

  const duplicate = await (await receivePostback({ env, request: request(callbackUrl.toString(), { headers: callbackHeaders() }) })).json();
  assert.equal(duplicate.duplicate, true);

  callbackUrl.searchParams.set('status', 'rejected');
  callbackUrl.searchParams.delete('virtual_amount');
  const rejected = await (await receivePostback({ env, request: request(callbackUrl.toString(), { headers: callbackHeaders() }) })).json();
  assert.equal(rejected.ok, true);
  assert.deepEqual(rejected.transition, { from: 'confirmed', to: 'reversed' });
  assert.equal(rejected.summary.confirmedCredits, 0);
  assert.equal(rejected.summary.reversedCredits, 125);
});

test('W206 rejects a MyLead postback from an unallowlisted source, invalid lifecycle status, and mismatched player attribution', async () => {
  const env = configuredEnv();
  const accountId = 'local-profile-abcdefghijklmnop';
  const launch = await (await launchOfferwall({
    env,
    request: request('https://eonapp.ch/api/rewards/launch', { body: { provider: 'mylead', account_id: accountId } })
  })).json();
  const token = new URL(launch.offerwallUrl).searchParams.get('player_id');
  const base = new URL('https://eonapp.ch/api/rewards/postback');
  base.searchParams.set('provider', 'mylead');
  base.searchParams.set('secret', 'mylead-unit-secret');
  base.searchParams.set('transaction_id', 'mylead-tx-2');
  base.searchParams.set('player_id', token);
  base.searchParams.set('ml_sub1', token);
  base.searchParams.set('status', 'approved');
  base.searchParams.set('virtual_amount', '25');

  const blocked = await receivePostback({ env, request: request(base.toString(), { headers: callbackHeaders('203.0.113.10') }) });
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error, 'mylead_postback_source_not_allowlisted');

  base.searchParams.set('status', 'mystery');
  const invalid = await receivePostback({ env, request: request(base.toString(), { headers: callbackHeaders() }) });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error, 'mylead_postback_status_invalid');

  base.searchParams.set('status', 'approved');
  base.searchParams.set('ml_sub1', 'not-the-player-token');
  const mismatched = await receivePostback({ env, request: request(base.toString(), { headers: callbackHeaders() }) });
  assert.equal(mismatched.status, 409);
  assert.equal((await mismatched.json()).error, 'mylead_player_id_tracking_token_mismatch');
});

test('W206 public MyLead configuration hides secrets, URL template and allowlist', async () => {
  const env = configuredEnv();
  const response = await rewardConfig({ env, request: request('https://eonapp.ch/api/rewards/config', { method: 'GET' }) });
  const body = await response.json();
  const mylead = body.providers.find((provider) => provider.id === 'mylead');
  assert.equal(mylead.available, true);
  assert.equal(mylead.hostedMode, 'new-window');
  assert.doesNotMatch(JSON.stringify(body), /mylead-unit-secret|reward\.example\.test|198\.51\.100/);
});
