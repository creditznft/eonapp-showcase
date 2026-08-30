import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import {
  EON_REWARD_PRIMARY_PROVIDER,
  EON_REWARD_RULES,
  EON_REWARD_UNLOCKS
} from '../../config/rt98-reward-center-contract.mjs';
import {
  getMyLeadConfig,
  publicMyLeadConfig,
  buildMyLeadOfferwallUrl,
  parseMyLeadPostback,
  validateMyLeadPostbackSecret,
  validateMyLeadPostbackSource
} from '../../functions/api/rewards/_providers.js';
import {
  launchMyLeadMission,
  applyMyLeadPostback,
  redeemRewardUnlock,
  readRewardCenterStatus
} from '../../functions/api/rewards/_ledger.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE_TIME = Date.UTC(2026, 7, 30, 8, 0, 0);
const SECRET = 'rt98-test-postback-secret-0123456789';

class D1Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new D1Statement(this.database, this.sql, args); }
  _statement() { return this.database.sqlite.prepare(this.sql); }
  async first() { return this._statement().get(...this.args) || null; }
  async all() { return { results: this._statement().all(...this.args) }; }
  async run() {
    const result = this._statement().run(...this.args);
    return { meta: { changes: Number(result?.changes || 0) } };
  }
}

class D1Database {
  constructor() { this.sqlite = new DatabaseSync(':memory:'); }
  prepare(sql) { return new D1Statement(this, sql); }
  async batch(statements) {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
  close() { this.sqlite.close(); }
}

function buildDatabase() {
  const database = new D1Database();
  for (const file of fs.readdirSync(path.join(root, 'migrations', 'referrals')).filter((name) => name.endsWith('.sql')).sort()) {
    database.sqlite.exec(fs.readFileSync(path.join(root, 'migrations', 'referrals', file), 'utf8'));
  }
  return database;
}

function env(database, overrides = {}) {
  return {
    EON_REFERRALS_DB: database,
    EON_REWARD_MYLEAD_ENABLED: 'true',
    EON_REWARD_MYLEAD_OFFERWALL_URL: 'https://example.test/offerwall',
    EON_REWARD_MYLEAD_POSTBACK_SECRET: SECRET,
    EON_REWARD_MYLEAD_POSTBACK_ALLOWED_IPS: '159.65.61.13',
    ...overrides
  };
}

function parsedFromLaunch(launch, { transactionId = 'tx-1', status = 'approved', virtualAmount = 20, payoutDecimal = '0.50', surface } = {}) {
  const offer = new URL(launch.offerwallUrl);
  return {
    ok: true,
    provider: 'mylead',
    transactionId,
    playerId: offer.searchParams.get('player_id'),
    correlationId: offer.searchParams.get('ml_sub1'),
    surface: surface || offer.searchParams.get('ml_sub2'),
    secret: SECRET,
    providerStatus: status,
    state: ['rejected', 'reversed', 'chargeback', 'cancelled', 'canceled', 'void'].includes(status) ? 'reversed' : (status === 'approved' ? 'confirmed' : 'pending'),
    virtualAmount: status === 'approved' ? virtualAmount : null,
    payoutDecimal
  };
}

async function launchFor(database, accountId = 'acct-a', surface = 'rewards', timestamp = BASE_TIME) {
  const launched = await launchMyLeadMission({ env: env(database), accountId, surface, timestamp });
  assert.equal(launched.ok, true, launched.status);
  return launched;
}

test('RT98 policy makes MyLead primary and EONKEYS noncash/server-authoritative with exact bounded unlock prices', () => {
  assert.equal(EON_REWARD_PRIMARY_PROVIDER, 'mylead');
  assert.equal(EON_REWARD_RULES.creditCashValue, false);
  assert.equal(EON_REWARD_RULES.creditTransferable, false);
  assert.equal(EON_REWARD_RULES.browserCanMint, false);
  assert.equal(EON_REWARD_RULES.iframeCloseCanMint, false);
  assert.equal(EON_REWARD_RULES.redirectCanMint, false);
  assert.equal(EON_REWARD_RULES.vastPlaybackCanMint, false);
  assert.equal(EON_REWARD_RULES.providerPostbackRequired, true);
  assert.deepEqual(EON_REWARD_UNLOCKS.map(({ eonkeys, durationMinutes }) => [eonkeys, durationMinutes]), [
    [5, 15], [10, 30], [20, 60], [30, 90], [30, 90], [50, 180]
  ]);
});

test('RT98 protected Preview verifies completed upstream CI jobs without waiting on its own final workflow conclusion', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'rt98-preview-release.yml'), 'utf8');
  assert.match(workflow, /actions\/runs\/\$RUN_ID\/jobs\?per_page=100/);
  for (const job of ['permanent-predeploy', 'rt98-reward-center', 'rt92-monetization-policy', 'rt97-release-policy', 'legacy-boundary', 'exact-source-backup', 'rt98-preview-authority']) assert.match(workflow, new RegExp(job));
  assert.doesNotMatch(workflow, /actions\/runs\?head_sha=/);
  assert.doesNotMatch(workflow, /workflow_dispatch:/);
});

test('MyLead configuration fails closed and public config never exposes secret, URL, or allowlisted IPs', () => {
  assert.equal(getMyLeadConfig({}).configured, false);
  assert.equal(getMyLeadConfig({ EON_REWARD_MYLEAD_ENABLED: 'true', EON_REWARD_MYLEAD_OFFERWALL_URL: 'http://bad.test', EON_REWARD_MYLEAD_POSTBACK_SECRET: SECRET }).configured, false);
  const configured = getMyLeadConfig(env({ prepare() {} }));
  assert.equal(configured.configured, true);
  const publicConfig = publicMyLeadConfig(env({ prepare() {} }));
  assert.equal(publicConfig.available, true);
  assert.equal('postbackSecret' in publicConfig, false);
  assert.equal('offerwallUrl' in publicConfig, false);
  assert.equal('allowedIps' in publicConfig, false);
});

test('launch creates stable opaque player_id, fresh ml_sub1 correlation, surface ml_sub2, and never sends account id', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const first = await launchFor(database, 'account-private-123', 'eoncity');
  const second = await launchFor(database, 'account-private-123', 'eoncity', BASE_TIME + 1000);
  const firstUrl = new URL(first.offerwallUrl);
  const secondUrl = new URL(second.offerwallUrl);
  assert.match(firstUrl.searchParams.get('player_id'), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(firstUrl.searchParams.get('player_id'), secondUrl.searchParams.get('player_id'));
  assert.notEqual(firstUrl.searchParams.get('ml_sub1'), secondUrl.searchParams.get('ml_sub1'));
  assert.equal(firstUrl.searchParams.get('ml_sub2'), 'eoncity');
  assert.equal(firstUrl.searchParams.get('ml_sub3'), 'eonapp-rt98');
  assert.equal(first.offerwallUrl.includes('account-private-123'), false);
  assert.equal(first.browserCompletionCreatesReward, false);
});

test('expired launch correlations fail closed and cannot mint EONKEYS', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const launch = await launchFor(database, 'acct-a', 'rewards', BASE_TIME);
  const approved = parsedFromLaunch(launch, { transactionId: 'expired-launch-1', virtualAmount: 50 });
  const expiredAt = Number(launch.launch.expiresAt || 0);
  const result = await applyMyLeadPostback({ env: env(database), parsed: approved, timestamp: expiredAt + 1 });
  assert.equal(result.ok, false);
  assert.equal(result.status, 'mylead_launch_expired');
  const status = await readRewardCenterStatus({ env: env(database), accountId: 'acct-a', timestamp: expiredAt + 2 });
  assert.equal(status.balance, 0);
  assert.equal(status.history.length, 0);
});

test('pending -> approved credits the exact integer virtual_amount once', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const launch = await launchFor(database);
  const pending = parsedFromLaunch(launch, { transactionId: 'pending-approve-1', status: 'pending' });
  const first = await applyMyLeadPostback({ env: env(database), parsed: pending, timestamp: BASE_TIME + 10 });
  assert.equal(first.ok, true); assert.equal(first.balance, 0); assert.equal(first.transaction.state, 'pending');
  const approved = parsedFromLaunch(launch, { transactionId: 'pending-approve-1', status: 'approved', virtualAmount: 37 });
  const second = await applyMyLeadPostback({ env: env(database), parsed: approved, timestamp: BASE_TIME + 20 });
  assert.equal(second.ok, true); assert.equal(second.balance, 37); assert.equal(second.transaction.eonkeys, 37);
  const status = await readRewardCenterStatus({ env: env(database), accountId: 'acct-a', timestamp: BASE_TIME + 30 });
  assert.equal(status.balance, 37);
  assert.equal(status.history.filter((row) => row.type === 'credit').length, 1);
});

test('duplicate approved postback cannot double-credit and conflicting amount is rejected', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const launch = await launchFor(database);
  const approved = parsedFromLaunch(launch, { transactionId: 'dup-approved-1', virtualAmount: 25 });
  const first = await applyMyLeadPostback({ env: env(database), parsed: approved, timestamp: BASE_TIME + 10 });
  const duplicate = await applyMyLeadPostback({ env: env(database), parsed: approved, timestamp: BASE_TIME + 11 });
  assert.equal(first.balance, 25); assert.equal(duplicate.ok, true); assert.equal(duplicate.duplicate, true); assert.equal(duplicate.balance, 25);
  const conflict = await applyMyLeadPostback({ env: env(database), parsed: { ...approved, virtualAmount: 26 }, timestamp: BASE_TIME + 12 });
  assert.equal(conflict.ok, false); assert.equal(conflict.status, 'mylead_virtual_amount_conflict');
  const status = await readRewardCenterStatus({ env: env(database), accountId: 'acct-a' });
  assert.equal(status.balance, 25);
});

test('redeem then reversal produces negative reward debt and duplicate reversal cannot debit twice', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const launch = await launchFor(database);
  const approved = parsedFromLaunch(launch, { transactionId: 'reversal-debt-1', virtualAmount: 20 });
  await applyMyLeadPostback({ env: env(database), parsed: approved, timestamp: BASE_TIME + 10 });
  const redeemed = await redeemRewardUnlock({ env: env(database), accountId: 'acct-a', unlockId: 'plus-workflow-packs', timestamp: BASE_TIME + 20 });
  assert.equal(redeemed.ok, true); assert.equal(redeemed.balance, 10);
  const reversed = parsedFromLaunch(launch, { transactionId: 'reversal-debt-1', status: 'rejected' });
  const first = await applyMyLeadPostback({ env: env(database), parsed: reversed, timestamp: BASE_TIME + 30 });
  const duplicate = await applyMyLeadPostback({ env: env(database), parsed: reversed, timestamp: BASE_TIME + 31 });
  assert.equal(first.balance, -10); assert.equal(duplicate.balance, -10); assert.equal(duplicate.duplicate, true);
  const status = await readRewardCenterStatus({ env: env(database), accountId: 'acct-a', timestamp: BASE_TIME + 32 });
  assert.equal(status.balance, -10); assert.equal(status.debt, 10);
  assert.equal(status.history.filter((row) => row.type === 'reversal').length, 1);
});

test('postback parser/source/secret reject untrusted requests and require integer approved virtual_amount', () => {
  const config = getMyLeadConfig(env({ prepare() {} }));
  const goodRequest = new Request(`https://eonapp.ch/api/rewards/postback?provider=mylead&transaction_id=t1&player_id=${'p'.repeat(24)}&ml_sub1=${'c'.repeat(24)}&ml_sub2=rewards&status=approved&virtual_amount=10&secret=${encodeURIComponent(SECRET)}`, { headers: { 'cf-connecting-ip': '159.65.61.13' } });
  assert.equal(validateMyLeadPostbackSource(config, goodRequest).ok, true);
  assert.equal(validateMyLeadPostbackSecret(config, SECRET).ok, true);
  assert.equal(parseMyLeadPostback(goodRequest).ok, true);
  const badIp = new Request(goodRequest.url, { headers: { 'cf-connecting-ip': '203.0.113.10' } });
  assert.equal(validateMyLeadPostbackSource(config, badIp).ok, false);
  assert.equal(validateMyLeadPostbackSecret(config, 'wrong').ok, false);
  const missingAmount = new Request(`https://eonapp.ch/api/rewards/postback?transaction_id=t2&player_id=${'p'.repeat(24)}&ml_sub1=${'c'.repeat(24)}&status=approved&secret=${encodeURIComponent(SECRET)}`);
  assert.equal(parseMyLeadPostback(missingAmount).error, 'mylead_virtual_amount_required_for_approved_credit');
  const fractional = new Request(`https://eonapp.ch/api/rewards/postback?transaction_id=t3&player_id=${'p'.repeat(24)}&ml_sub1=${'c'.repeat(24)}&status=approved&virtual_amount=10.5&secret=${encodeURIComponent(SECRET)}`);
  assert.equal(parseMyLeadPostback(fractional).error, 'mylead_virtual_amount_invalid');
});

test('a provider transaction cannot be rebound to another player/account or mismatched launch token', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const a = await launchFor(database, 'acct-a', 'rewards');
  const b = await launchFor(database, 'acct-b', 'rewards', BASE_TIME + 1);
  const first = await applyMyLeadPostback({ env: env(database), parsed: parsedFromLaunch(a, { transactionId: 'fixed-provider-tx', virtualAmount: 12 }), timestamp: BASE_TIME + 10 });
  assert.equal(first.ok, true);
  const rebound = await applyMyLeadPostback({ env: env(database), parsed: parsedFromLaunch(b, { transactionId: 'fixed-provider-tx', virtualAmount: 12 }), timestamp: BASE_TIME + 11 });
  assert.equal(rebound.ok, false); assert.equal(rebound.status, 'mylead_transaction_attribution_conflict');
  const wrongCorrelation = { ...parsedFromLaunch(a, { transactionId: 'another-tx', virtualAmount: 12 }), correlationId: new URL(b.offerwallUrl).searchParams.get('ml_sub1') };
  const mismatch = await applyMyLeadPostback({ env: env(database), parsed: wrongCorrelation, timestamp: BASE_TIME + 12 });
  assert.equal(mismatch.ok, false); assert.equal(mismatch.status, 'mylead_player_id_tracking_token_mismatch');
});

test('redemptions are bounded, create compatible temporary unlocks, prevent overspend, and browser URL builders cannot mint', async (t) => {
  const database = buildDatabase(); t.after(() => database.close());
  const launch = await launchFor(database);
  await applyMyLeadPostback({ env: env(database), parsed: parsedFromLaunch(launch, { transactionId: 'redeem-bounded-1', virtualAmount: 15 }), timestamp: BASE_TIME + 10 });
  const redemption = await redeemRewardUnlock({ env: env(database), accountId: 'acct-a', unlockId: 'plus-template-library', timestamp: BASE_TIME + 20 });
  assert.equal(redemption.ok, true); assert.equal(redemption.balance, 10);
  assert.equal(redemption.unlock.expiresAt, BASE_TIME + 20 + 15 * 60 * 1000);
  const duplicate = await redeemRewardUnlock({ env: env(database), accountId: 'acct-a', unlockId: 'plus-template-library', timestamp: BASE_TIME + 21 });
  assert.equal(duplicate.ok, true); assert.equal(duplicate.duplicate, true);
  const tooExpensive = await redeemRewardUnlock({ env: env(database), accountId: 'acct-a', unlockId: 'power-automation-packs', timestamp: BASE_TIME + 22 });
  assert.equal(tooExpensive.ok, false); assert.equal(tooExpensive.status, 'insufficient_eonkeys'); assert.equal(tooExpensive.balance, 10);
  const status = await readRewardCenterStatus({ env: env(database), accountId: 'acct-a', timestamp: BASE_TIME + 30 });
  assert.equal(status.activeUnlocks.some((item) => item.unlockId === 'plus-template-library'), true);
  assert.equal(status.history.filter((row) => row.type === 'redemption').length, 1);

  const config = getMyLeadConfig(env({ prepare() {} }));
  const url = buildMyLeadOfferwallUrl(config, { playerId: 'p'.repeat(24), correlationId: 'c'.repeat(24), surface: 'game' });
  assert.equal(new URL(url).searchParams.has('reward'), false);
  assert.equal(new URL(url).searchParams.has('eonkeys'), false);
});
