import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyReferralMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSignedShareLink } from '../../assets/js/utils/signed-share-link.js';
import { signSharePayload } from '../../assets/js/utils/share-link-identity.js';
import {
  bindReferralIdentity,
  buildReferralPublicStatus,
  enrollReferral,
  readReferralAccountStatus,
  requestReferralBindChallenge,
  resolveReferralDatabase
} from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { applyDodoWebhookToD1 } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { validateW623iReferralScaleContract } from '../../config/w623i-referral-scale-contract.mjs';

class D1Statement {
  constructor(database, sql, args = []) { this.database = database; this.sql = sql; this.args = args; }
  bind(...args) { return new D1Statement(this.database, this.sql, args); }
  run() { return this.database.prepare(this.sql).run(...this.args); }
  first() { return this.database.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.database.prepare(this.sql).all(...this.args) }; }
}
function makeD1(domain = 'referrals') {
  const sqlite = new DatabaseSync(':memory:');
  if (domain === 'billing') applyBillingMigrations(sqlite);
  else applyReferralMigrations(sqlite);
  return {
    sqlite,
    prepare(sql) { return new D1Statement(sqlite, sql); },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const out = statements.map((statement) => statement.run()); sqlite.exec('COMMIT'); return out; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}
async function bindWithProof(database, accountId, invite, timestamp = 1) {
  const challenge = await requestReferralBindChallenge({ database, accountId, token: invite.token, timestamp });
  const signature = await signSharePayload(challenge.canonical);
  return bindReferralIdentity({ database, accountId, token: invite.token, challengeId: challenge.challengeId, challenge: challenge.challenge, signature, timestamp: timestamp + 1 });
}
function paidEvent(overrides = {}) {
  return {
    providerEventId: 'evt_split_paid_1', rawEventType: 'payment.succeeded', eventType: 'payment_succeeded',
    accountId: 'invitee-account', tierId: 'plus', providerCustomerRef: 'customer_1',
    providerSubscriptionRef: 'subscription_1', occurredAt: Date.UTC(2026, 6, 1), ...overrides
  };
}

test('W623I selects dedicated referral D1 and keeps billing fallback explicit', () => {
  assert.equal(validateW623iReferralScaleContract().ok, true);
  const dedicated = { prepare() {} };
  const billing = { prepare() {} };
  assert.deepEqual(resolveReferralDatabase({ EON_REFERRALS_DB: dedicated, EON_BILLING_DB: billing }), { database: dedicated, binding: 'EON_REFERRALS_DB', mode: 'dedicated' });
  assert.deepEqual(resolveReferralDatabase({ EON_BILLING_DB: billing }), { database: billing, binding: 'EON_BILLING_DB', mode: 'legacy-billing-fallback' });
  const status = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'testing', EON_REFERRALS_DB: dedicated, EON_REFERRAL_RATE_LIMITER: { limit() {} } });
  assert.equal(status.active, true);
  assert.equal(status.databaseMode, 'dedicated');
  assert.equal(status.optionalRateLimiterConfigured, true);
  assert.equal(status.ordinaryAdsOutsideReferral, true);
  assert.equal(status.rewardedSponsorKeysOutsideReferral, true);
  assert.equal(status.referralAdViewRewards, false);
});

test('W623I/W629 dedicated migrations create versioned tables, indexes and privacy-safe counts view', () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../../migrations/referrals/0001_referral_authority.sql', import.meta.url), 'utf8'));
  sqlite.exec(fs.readFileSync(new URL('../../migrations/referrals/0002_referral_operational_views.sql', import.meta.url), 'utf8'));
  sqlite.exec(fs.readFileSync(new URL('../../migrations/referrals/0003_referral_schema_authority.sql', import.meta.url), 'utf8'));
  const tables = sqlite.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'eon_%' ORDER BY name").all();
  const views = sqlite.prepare("SELECT name FROM sqlite_schema WHERE type='view' ORDER BY name").all();
  const indexes = sqlite.prepare("SELECT name FROM sqlite_schema WHERE type='index' AND name LIKE 'idx_eon_%'").all();
  assert.equal(tables.length, 14);
  assert.deepEqual(tables.map((row) => row.name), [
    'eon_digital_rewards', 'eon_invite_accounts', 'eon_invite_events', 'eon_key_grant_journal',
    'eon_key_grants', 'eon_key_unlocks', 'eon_referral_billing_state', 'eon_referral_bind_challenges',
    'eon_referral_identities', 'eon_referral_milestone_challenges', 'eon_referral_milestone_receipts',
    'eon_referral_milestone_steps', 'eon_referral_support_audit', 'eon_schema_authority'
  ]);
  assert.deepEqual(views.map((row) => row.name), ['eon_referral_operational_counts']);
  assert.ok(indexes.length >= 17);
  assert.equal(sqlite.prepare('SELECT identities, accepted_invites, keys_available FROM eon_referral_operational_counts').get().identities, 0);
  sqlite.close();
});

test('W623I repairs split billing/referral delivery on a duplicate webhook replay', async () => {
  const billingDb = makeD1('billing');
  const referralDb = makeD1('referrals');
  const invite = await createSignedShareLink({ destination: '/', source: 'w623i-split-test', missionType: 'share_eonapp' });
  assert.equal((await bindWithProof(referralDb, 'inviter-account', invite, 10)).ok, true);
  assert.equal((await enrollReferral({ database: referralDb, inviteeAccountId: 'invitee-account', token: invite.token, timestamp: 20 })).ok, true);
  const event = paidEvent();
  const billingOnly = await applyDodoWebhookToD1(billingDb, event, '{"type":"payment.succeeded"}', { referralActive: false });
  assert.equal(billingOnly.duplicate, false);
  const repaired = await applyDodoWebhookToD1(billingDb, event, '{"type":"payment.succeeded"}', { referralActive: true, referralDatabase: referralDb });
  assert.equal(repaired.duplicate, true);
  assert.equal(repaired.referral.status, 'paid_referral_pending');
  assert.equal(referralDb.sqlite.prepare("SELECT status FROM eon_referral_billing_state WHERE account_id='invitee-account'").get().status, 'active');
  assert.equal(referralDb.sqlite.prepare("SELECT COUNT(*) AS total FROM sqlite_schema WHERE type='table' AND name='eon_entitlements'").get().total, 0);
  const mature = await readReferralAccountStatus({ database: referralDb, accountId: 'inviter-account', timestamp: event.occurredAt + (15 * 86400000) });
  assert.equal(mature.account.balances.available.builder, 1);
  billingDb.sqlite.close(); referralDb.sqlite.close();
});

test('W623I reversal updates the dedicated referral state and revokes derived value', async () => {
  const billingDb = makeD1('billing');
  const referralDb = makeD1('referrals');
  const invite = await createSignedShareLink({ destination: '/', source: 'w623i-reversal-test', missionType: 'share_eonapp' });
  await bindWithProof(referralDb, 'inviter-account', invite, 10);
  await enrollReferral({ database: referralDb, inviteeAccountId: 'invitee-account', token: invite.token, timestamp: 20 });
  const start = Date.UTC(2026, 6, 1);
  await applyDodoWebhookToD1(billingDb, paidEvent({ occurredAt: start }), '{}', { referralActive: true, referralDatabase: referralDb });
  await readReferralAccountStatus({ database: referralDb, accountId: 'inviter-account', timestamp: start + (15 * 86400000) });
  const reversed = await applyDodoWebhookToD1(billingDb, paidEvent({ providerEventId: 'evt_split_refund_1', rawEventType: 'refund.succeeded', eventType: 'payment_refunded', occurredAt: start + (16 * 86400000) }), '{}', { referralActive: true, referralDatabase: referralDb });
  assert.equal(reversed.referral.status, 'paid_referral_reversed');
  assert.equal(referralDb.sqlite.prepare("SELECT status FROM eon_referral_billing_state WHERE account_id='invitee-account'").get().status, 'revoked');
  assert.equal(referralDb.sqlite.prepare("SELECT status FROM eon_key_grants WHERE account_id='inviter-account'").get().status, 'revoked');
  billingDb.sqlite.close(); referralDb.sqlite.close();
});
