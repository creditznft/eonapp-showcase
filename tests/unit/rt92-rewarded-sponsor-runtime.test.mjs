import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { applyReferralMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import {
  EON_REWARDED_EVENT_ORDER,
  EON_REWARDED_MIN_COMPLETE_MS,
  buildRewardedSponsorVastWrapper,
  getRewardedSponsorRuntimeConfig,
  readRewardedSponsorAccountStatus,
  recordRewardedSponsorTrackingEvent,
  redeemSponsorUnlock,
  startRewardedSponsorSession,
  validateRewardedSponsorRuntimeContract
} from '../../functions/_shared/eon-rewarded-sponsor-runtime.js';
import { readAccountActiveEonKeyUnlocks } from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { buildEffectiveCapabilitySnapshot, hasEonCapability } from '../../assets/js/capabilities/eon-capability-service.js';

class D1Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new D1Statement(this.database, this.sql, args); }
  run() { return this.database.prepare(this.sql).run(...this.args); }
  first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.database.prepare(this.sql).all(...this.args) }; }
}

function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  applyReferralMigrations(sqlite);
  return {
    sqlite,
    prepare(sql) { return new D1Statement(sqlite, sql); },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const output = statements.map((statement) => statement.run());
        sqlite.exec('COMMIT');
        return output;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

function rewardEnv(database, overrides = {}) {
  return {
    EON_MONETIZATION_ROLLOUT: 'production',
    EON_MONETIZATION_ENABLED: 'true',
    EON_SPONSOR_VIDEO_ENABLED: 'true',
    EON_REWARDED_ADS_ENABLED: 'true',
    EON_REWARDED_PROVIDER: 'exoclick',
    EON_REWARDED_PROVIDER_VERIFIED: 'true',
    EON_REWARDED_SIGNING_KEY: '0123456789abcdef0123456789abcdef',
    EON_REWARDED_DAILY_CAP: '6',
    EON_REWARDED_COOLDOWN_MINUTES: '1',
    EON_REFERRALS_DB: database,
    ...overrides
  };
}

function vastToken(vastUrl) {
  return new URL(vastUrl).searchParams.get('token') || '';
}

function trackingFromXml(xml) {
  const result = {};
  for (const event of EON_REWARDED_EVENT_ORDER) {
    const pattern = new RegExp(`<Tracking event="${event}"><!\\[CDATA\\[([^\\]]+)\\]\\]></Tracking>`);
    const match = String(xml || '').match(pattern);
    assert.ok(match, `missing ${event} tracking URL`);
    const url = new URL(match[1]);
    result[event] = {
      sessionId: url.searchParams.get('session') || '',
      event: url.searchParams.get('event') || '',
      token: url.searchParams.get('token') || ''
    };
  }
  return result;
}

async function issueOneKey({ env, accountId, startAt }) {
  const started = await startRewardedSponsorSession({ env, accountId, requestOrigin: 'https://eonapp.ch', timestamp: startAt });
  assert.equal(started.ok, true, started.status);
  const wrapper = await buildRewardedSponsorVastWrapper({
    env,
    sessionId: started.sessionId,
    token: vastToken(started.vastUrl),
    origin: 'https://eonapp.ch',
    timestamp: startAt + 10
  });
  assert.equal(wrapper.ok, true, wrapper.status);
  const tracking = trackingFromXml(wrapper.xml);
  const times = {
    start: startAt + 100,
    firstQuartile: startAt + 1_700,
    midpoint: startAt + 3_700,
    thirdQuartile: startAt + 6_200,
    complete: startAt + EON_REWARDED_MIN_COMPLETE_MS + 200
  };
  let result = null;
  for (const event of EON_REWARDED_EVENT_ORDER) {
    result = await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event, token: tracking[event].token, timestamp: times[event] });
    assert.equal(result.ok, true, `${event}: ${result.status}`);
  }
  assert.equal(result.status, 'sponsor_key_granted');
  assert.equal(result.keysGranted, 1);
  return { started, wrapper, tracking, completion: result };
}

test('RT92 rewarded runtime fails closed unless ExoClick, signing authority and referral D1 are all ready', () => {
  assert.equal(validateRewardedSponsorRuntimeContract().ok, true);
  const db = makeD1();
  const ready = getRewardedSponsorRuntimeConfig(rewardEnv(db));
  assert.equal(ready.active, true);
  assert.equal(ready.provider, 'exoclick');
  assert.equal(ready.verificationMode, 'server-validated-vast-wrapper-sequence');
  assert.equal(ready.providerSignedCompletion, false);
  assert.equal(getRewardedSponsorRuntimeConfig(rewardEnv(db, { EON_REWARDED_SIGNING_KEY: '' })).active, false);
  assert.equal(getRewardedSponsorRuntimeConfig(rewardEnv(null)).active, false);
  db.sqlite.close();
});

test('RT92 rewarded VAST wrapper uses the approved ExoClick zone and signed server tracking URLs', async () => {
  const db = makeD1();
  const env = rewardEnv(db);
  const t0 = Date.UTC(2026, 7, 21, 12, 0, 0);
  const started = await startRewardedSponsorSession({ env, accountId: 'acct_vast', requestOrigin: 'https://eonapp.ch', timestamp: t0 });
  assert.equal(started.status, 'reward_session_issued');
  assert.equal(started.reward.keysOnCompletion, 1);
  assert.equal(started.clientCannotMint, true);
  const wrapper = await buildRewardedSponsorVastWrapper({ env, sessionId: started.sessionId, token: vastToken(started.vastUrl), origin: 'https://eonapp.ch', timestamp: t0 + 10 });
  assert.equal(wrapper.ok, true);
  assert.match(wrapper.xml, /idz=6004002/);
  assert.match(wrapper.xml, /block_ad_types=101/);
  assert.match(wrapper.xml, /ex_av=2/);
  const tracking = trackingFromXml(wrapper.xml);
  assert.deepEqual(Object.keys(tracking), [...EON_REWARDED_EVENT_ORDER]);
  assert.equal(tracking.complete.sessionId, started.sessionId);
  assert.notEqual(tracking.complete.token, tracking.start.token);
  const invalid = await buildRewardedSponsorVastWrapper({ env, sessionId: started.sessionId, token: 'browser-forged-token', origin: 'https://eonapp.ch', timestamp: t0 + 20 });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.status, 'reward_token_invalid');
  db.sqlite.close();
});

test('RT92 rewarded sequence rejects out-of-order and premature completion without poisoning a valid later completion', async () => {
  const db = makeD1();
  const env = rewardEnv(db);
  const t0 = Date.UTC(2026, 7, 21, 13, 0, 0);
  const started = await startRewardedSponsorSession({ env, accountId: 'acct_sequence', requestOrigin: 'https://eonapp.ch', timestamp: t0 });
  const wrapper = await buildRewardedSponsorVastWrapper({ env, sessionId: started.sessionId, token: vastToken(started.vastUrl), origin: 'https://eonapp.ch', timestamp: t0 + 10 });
  const tracking = trackingFromXml(wrapper.xml);
  const outOfOrder = await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'midpoint', token: tracking.midpoint.token, timestamp: t0 + 4_000 });
  assert.equal(outOfOrder.ok, false);
  assert.equal(outOfOrder.status, 'reward_event_out_of_order');
  assert.equal((await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'start', token: tracking.start.token, timestamp: t0 + 100 })).ok, true);
  assert.equal((await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'firstQuartile', token: tracking.firstQuartile.token, timestamp: t0 + 1_700 })).ok, true);
  assert.equal((await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'midpoint', token: tracking.midpoint.token, timestamp: t0 + 3_700 })).ok, true);
  assert.equal((await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'thirdQuartile', token: tracking.thirdQuartile.token, timestamp: t0 + 6_200 })).ok, true);
  const early = await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'complete', token: tracking.complete.token, timestamp: t0 + 7_000 });
  assert.equal(early.ok, false);
  assert.match(early.status, /too_early/);
  const completed = await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'complete', token: tracking.complete.token, timestamp: t0 + EON_REWARDED_MIN_COMPLETE_MS + 300 });
  assert.equal(completed.ok, true, completed.status);
  assert.equal(completed.status, 'sponsor_key_granted');
  assert.equal(completed.availableKeys, 1);
  const duplicate = await recordRewardedSponsorTrackingEvent({ env, sessionId: started.sessionId, event: 'complete', token: tracking.complete.token, timestamp: t0 + EON_REWARDED_MIN_COMPLETE_MS + 600 });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.status, 'already_completed');
  assert.equal(duplicate.duplicate, true);
  const grants = db.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_key_grants WHERE account_id='acct_sequence' AND key_type='sponsor'").get();
  assert.equal(grants.total, 1);
  db.sqlite.close();
});

test('RT92 active session is reused so parallel browser starts cannot multiply reward authority', async () => {
  const db = makeD1();
  const env = rewardEnv(db);
  const t0 = Date.UTC(2026, 7, 21, 14, 0, 0);
  const first = await startRewardedSponsorSession({ env, accountId: 'acct_parallel', requestOrigin: 'https://eonapp.ch', timestamp: t0 });
  const second = await startRewardedSponsorSession({ env, accountId: 'acct_parallel', requestOrigin: 'https://eonapp.ch', timestamp: t0 + 500 });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.status, 'reward_session_reused');
  assert.equal(second.reused, true);
  assert.equal(second.sessionId, first.sessionId);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_sponsor_reward_sessions WHERE account_id='acct_parallel'").get().total, 1);
  db.sqlite.close();
});

test('RT92 verified video creates a consumable Sponsor Key that activates a signed capability without creating a subscription', async () => {
  const db = makeD1();
  const env = rewardEnv(db);
  const accountId = 'acct_redeem';
  const base = Date.UTC(2026, 7, 21, 15, 0, 0);
  await issueOneKey({ env, accountId, startAt: base });
  let status = await readRewardedSponsorAccountStatus({ env, accountId, timestamp: base + 10_000 });
  assert.equal(status.availableKeys, 1);
  const redeemedAt = base + 20_000;
  const redeemed = await redeemSponsorUnlock({ env, accountId, unlockId: 'sponsor-template-library-15m', timestamp: redeemedAt });
  assert.equal(redeemed.ok, true, redeemed.status);
  assert.equal(redeemed.availableKeys, 0);
  assert.equal(redeemed.keysConsumed, 1);
  assert.equal(redeemed.activeUnlocks.some((unlock) => unlock.unlockId === 'sponsor-template-library-15m' && unlock.expiresAt > redeemedAt), true);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_key_unlock_sources WHERE unlock_record_id = ?").get(redeemed.unlockRecordId).total, 1);
  const activeUnlocks = await readAccountActiveEonKeyUnlocks({ database: db, accountId, timestamp: redeemedAt + 1 });
  const capability = buildEffectiveCapabilitySnapshot({ accountId, unlocks: activeUnlocks, now: redeemedAt + 1, source: 'rewarded-test-ledger' });
  assert.equal(capability.serverAuthoritative, true);
  assert.equal(capability.unlocks.some((unlock) => unlock.unlockId === 'sponsor-template-library-15m'), true);
  assert.equal(hasEonCapability('plus-template-library', capability), true);
  assert.equal(capability.subscriptionCreatedByUnlock, false);
  db.sqlite.close();
});


test('RT92 higher-value Sponsor sessions require multiple separately completed videos and consume every key atomically', async () => {
  const db = makeD1();
  const env = rewardEnv(db);
  const accountId = 'acct_multi_key';
  const base = Date.UTC(2026, 7, 21, 17, 0, 0);
  await issueOneKey({ env, accountId, startAt: base });
  const tooSoon = await redeemSponsorUnlock({ env, accountId, unlockId: 'sponsor-workflow-pack-30m', timestamp: base + 20_000 });
  assert.equal(tooSoon.ok, false);
  assert.equal(tooSoon.status, 'insufficient_keys');
  assert.equal(tooSoon.keysRequired, 2);
  const secondStart = base + 70_000;
  await issueOneKey({ env, accountId, startAt: secondStart });
  const redeemedAt = secondStart + 15_000;
  const redeemed = await redeemSponsorUnlock({ env, accountId, unlockId: 'sponsor-workflow-pack-30m', timestamp: redeemedAt });
  assert.equal(redeemed.ok, true, redeemed.status);
  assert.equal(redeemed.keysConsumed, 2);
  assert.equal(redeemed.availableKeys, 0);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS total FROM eon_key_unlock_sources WHERE unlock_record_id = ?').get(redeemed.unlockRecordId).total, 2);
  const activeUnlocks = await readAccountActiveEonKeyUnlocks({ database: db, accountId, timestamp: redeemedAt + 1 });
  const capability = buildEffectiveCapabilitySnapshot({ accountId, unlocks: activeUnlocks, now: redeemedAt + 1, source: 'rewarded-multi-key-test' });
  assert.equal(hasEonCapability('plus-workflow-packs', capability), true);
  db.sqlite.close();
});
