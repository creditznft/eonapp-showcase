import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as launchOfferwall } from '../../functions/api/rewards/launch.js';
import { onRequestPost as receivePostback } from '../../functions/api/rewards/postback.js';
import { onRequestGet as rewardConfig } from '../../functions/api/rewards/config.js';
import { onRequestPost as redeemReward } from '../../functions/api/rewards/redeem.js';
import { EON_REWARD_RULES, EON_REWARD_PROVIDERS } from '../../assets/js/rewards/eon-reward-policy.js';

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
    EON_REWARD_CPAGRIP_ENABLED: 'true',
    EON_REWARD_CPAGRIP_POSTBACK_SECRET: 'cpagrip-unit-secret',
    EON_REWARD_CPAGRIP_CREDIT_MULTIPLIER: '100',
    EON_REWARD_CPAGRIP_OFFERWALL_URL: 'https://offers.example.test/wall?subid={{account_token}}',
    __kv: kv
  };
}

test('W205 keeps CPA Grip disabled in browser source until Cloudflare setup is complete', () => {
  assert.equal(EON_REWARD_PROVIDERS.cpagrip.enabled, false);
  assert.equal(EON_REWARD_PROVIDERS.cpagrip.completion, 'server-postback-required');
  assert.equal(EON_REWARD_RULES.creditTransferable, false);
  assert.equal(EON_REWARD_RULES.forbiddenRedemptions.includes('cash'), true);
  assert.equal(EON_REWARD_RULES.forbiddenRedemptions.includes('subscriptions'), true);
});

test('W205 launches CPA Grip using an opaque token rather than a local account ID', async () => {
  const env = configuredEnv();
  const accountId = 'local-profile-abcdefghijklmnop';
  const response = await launchOfferwall({
    env,
    request: request('https://eonapp.ch/api/rewards/launch', { body: { provider: 'cpagrip', account_id: accountId } })
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(body.provider.id, 'cpagrip');
  assert.match(body.offerwallUrl, /^https:\/\/offers\.example\.test\/wall\?subid=[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(body.offerwallUrl, new RegExp(accountId));
  assert.doesNotMatch(JSON.stringify(body), /cpagrip-unit-secret/);
});

test('W205 credits a confirmed CPA Grip callback once, accepts a reversal lifecycle event, and records debt after redemption', async () => {
  const env = configuredEnv();
  const accountId = 'local-profile-abcdefghijklmnop';
  const launchResponse = await launchOfferwall({
    env,
    request: request('https://eonapp.ch/api/rewards/launch', { body: { provider: 'cpagrip', account_id: accountId } })
  });
  const launch = await launchResponse.json();
  const token = new URL(launch.offerwallUrl).searchParams.get('subid');
  assert.ok(token);

  const callbackUrl = new URL('https://eonapp.ch/api/rewards/postback');
  callbackUrl.searchParams.set('provider', 'cpagrip');
  callbackUrl.searchParams.set('secret', 'cpagrip-unit-secret');
  callbackUrl.searchParams.set('transaction_id', 'cpagrip-tx-1');
  callbackUrl.searchParams.set('subid', token);
  callbackUrl.searchParams.set('status', 'completed');
  callbackUrl.searchParams.set('payout', '0.42');

  const first = await (await receivePostback({ env, request: request(callbackUrl.toString()) })).json();
  assert.equal(first.ok, true);
  assert.equal(first.record.state, 'confirmed');
  assert.equal(first.record.credits, 42);
  assert.equal(first.summary.confirmedCredits, 42);

  const duplicate = await (await receivePostback({ env, request: request(callbackUrl.toString()) })).json();
  assert.equal(duplicate.duplicate, true);

  const redemption = await (await redeemReward({
    env,
    request: request('https://eonapp.ch/api/rewards/redeem', { body: { account_id: accountId, reward_id: 'ai-boost-24h' } })
  })).json();
  assert.equal(redemption.ok, true);
  assert.equal(redemption.availableAfter, 22);

  callbackUrl.searchParams.set('status', 'reversed');
  callbackUrl.searchParams.delete('payout');
  const reversed = await (await receivePostback({ env, request: request(callbackUrl.toString()) })).json();
  assert.equal(reversed.ok, true);
  assert.equal(reversed.updated, true);
  assert.deepEqual(reversed.transition, { from: 'confirmed', to: 'reversed' });
  assert.equal(reversed.record.credits, 0);
  assert.equal(reversed.summary.confirmedCredits, 0);
  assert.equal(reversed.summary.reversedCredits, 42);
  assert.equal(reversed.summary.reversalDebtCredits, 20);
});

test('W205 rejects an un-attributed CPA Grip callback instead of trusting a raw account id', async () => {
  const env = configuredEnv();
  const response = await receivePostback({
    env,
    request: request('https://eonapp.ch/api/rewards/postback?provider=cpagrip&secret=cpagrip-unit-secret&transaction_id=tx-no-token&account_id=local-profile-abcdefghijklmnop&status=completed&payout=1')
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, 'cpagrip_account_token_required');
});

test('W205 public provider config exposes only availability and never runtime secrets', async () => {
  const env = configuredEnv();
  const response = await rewardConfig({ env, request: request('https://eonapp.ch/api/rewards/config', { method: 'GET' }) });
  const body = await response.json();
  const cpagrip = body.providers.find((provider) => provider.id === 'cpagrip');
  assert.equal(cpagrip.available, true);
  assert.equal(cpagrip.hostedMode, 'new-window');
  assert.doesNotMatch(JSON.stringify(body), /POSTBACK_SECRET|cpagrip-unit-secret|offers\.example\.test/);
});
