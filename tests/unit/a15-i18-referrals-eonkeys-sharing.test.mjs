import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyReferralMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSignedShareLink } from '../../assets/js/utils/signed-share-link.js';
import { signSharePayload } from '../../assets/js/utils/share-link-identity.js';
import {
  bindReferralIdentity,
  enrollReferral,
  readAccountActiveEonKeyUnlocks,
  readReferralAccountStatus,
  redeemEonKey,
  requestReferralBindChallenge
} from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { applyDodoWebhookToD1 } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { getEonOutputShareHandoffTruth } from '../../assets/js/share/eon-output-share-handoff.js';
import { getEonSharePackTruth } from '../../assets/js/share/eon-share-pack.js';
import { getEonShareIntentTruth } from '../../assets/js/share/eon-share-intent.js';

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

async function createReferralFixture(inviteeCount = 1) {
  const billingDb = makeD1('billing');
  const referralDb = makeD1('referrals');
  const invite = await createSignedShareLink({ destination: '/', source: 'a15-i18', missionType: 'share_eonapp' });
  const challenge = await requestReferralBindChallenge({ database: referralDb, accountId: 'inviter-account', token: invite.token, timestamp: 10 });
  const signature = await signSharePayload(challenge.canonical);
  const bound = await bindReferralIdentity({
    database: referralDb,
    accountId: 'inviter-account',
    token: invite.token,
    challengeId: challenge.challengeId,
    challenge: challenge.challenge,
    signature,
    timestamp: 11
  });
  assert.equal(bound.ok, true);
  for (let index = 1; index <= inviteeCount; index += 1) {
    const enrolled = await enrollReferral({ database: referralDb, inviteeAccountId: `invitee-${index}`, token: invite.token, timestamp: 20 + index });
    assert.equal(enrolled.ok, true);
  }
  return { billingDb, referralDb };
}

function paidEvent(index, occurredAt, overrides = {}) {
  return {
    providerEventId: `evt-paid-${index}`,
    rawEventType: 'payment.succeeded',
    eventType: 'payment_succeeded',
    accountId: `invitee-${index}`,
    tierId: 'plus',
    providerCustomerRef: `customer-${index}`,
    providerSubscriptionRef: `subscription-${index}`,
    occurredAt,
    ...overrides
  };
}

function closeFixture(fixture) {
  fixture.billingDb.sqlite.close();
  fixture.referralDb.sqlite.close();
}

test('A15 I18 grants Builder, Builder, then Power after verified 14-day retention and enforces the yearly cap', async () => {
  const fixture = await createReferralFixture(4);
  try {
    const start = Date.UTC(2026, 0, 5);
    for (let index = 1; index <= 4; index += 1) {
      const result = await applyDodoWebhookToD1(
        fixture.billingDb,
        paidEvent(index, start + index),
        JSON.stringify({ type: 'payment.succeeded', index }),
        { referralActive: true, referralDatabase: fixture.referralDb }
      );
      assert.equal(result.referral.status, 'paid_referral_pending');
    }
    const status = await readReferralAccountStatus({
      database: fixture.referralDb,
      accountId: 'inviter-account',
      timestamp: start + (15 * 86400000)
    });
    assert.equal(status.account.balances.available.builder, 2);
    assert.equal(status.account.balances.available.power, 1);
    assert.deepEqual(status.account.grants.map((grant) => grant.keyType).sort(), ['builder', 'builder', 'power']);
    assert.equal(status.account.referralEvents.filter((event) => event.status === 'cap_reached').length, 1);
    assert.deepEqual(status.account.reconciliation, {
      status: 'reconciled',
      processed: 4,
      granted: 3,
      blocked: 1,
      backgroundExecution: false,
      triggeredBySignedInStatusRead: true
    });
    const financialRows = fixture.referralDb.sqlite.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND (name LIKE '%wallet%' OR name LIKE '%payout%' OR name LIKE '%cash%')").all();
    assert.equal(financialRows.length, 0);
  } finally { closeFixture(fixture); }
});

test('A15 I18 ignores stale positive billing events and duplicate stale replays after a newer reversal', async () => {
  const fixture = await createReferralFixture(1);
  try {
    const start = Date.UTC(2026, 1, 1);
    await applyDodoWebhookToD1(fixture.billingDb, paidEvent(1, start), '{"type":"payment.succeeded"}', { referralActive: true, referralDatabase: fixture.referralDb });
    const refund = paidEvent(1, start + (20 * 86400000), {
      providerEventId: 'evt-refund-newer',
      rawEventType: 'refund.succeeded',
      eventType: 'payment_refunded'
    });
    const reversed = await applyDodoWebhookToD1(fixture.billingDb, refund, '{"type":"refund.succeeded"}', { referralActive: true, referralDatabase: fixture.referralDb });
    assert.equal(reversed.referral.status, 'paid_referral_reversed');
    const stale = paidEvent(1, start + (10 * 86400000), {
      providerEventId: 'evt-renewal-stale',
      rawEventType: 'subscription.renewed',
      eventType: 'subscription_renewed'
    });
    const first = await applyDodoWebhookToD1(fixture.billingDb, stale, '{"type":"subscription.renewed"}', { referralActive: true, referralDatabase: fixture.referralDb });
    assert.equal(first.stale, true);
    assert.equal(first.referral.status, 'referral_out_of_order_ignored');
    const replay = await applyDodoWebhookToD1(fixture.billingDb, stale, '{"type":"subscription.renewed"}', { referralActive: true, referralDatabase: fixture.referralDb });
    assert.equal(replay.duplicate, true);
    assert.equal(replay.stale, true);
    assert.equal(replay.referral.status, 'referral_out_of_order_ignored');
    const referralState = fixture.referralDb.sqlite.prepare("SELECT status, tier_id FROM eon_referral_billing_state WHERE account_id='invitee-1'").get();
    assert.equal(referralState.status, 'revoked');
    assert.equal(referralState.tier_id, 'free');
  } finally { closeFixture(fixture); }
});

test('A15 I18 revokes a consumed EONKEY unlock when its verified paid source is refunded', async () => {
  const fixture = await createReferralFixture(1);
  try {
    const start = Date.UTC(2026, 2, 1);
    await applyDodoWebhookToD1(fixture.billingDb, paidEvent(1, start), '{"type":"payment.succeeded"}', { referralActive: true, referralDatabase: fixture.referralDb });
    const matured = await readReferralAccountStatus({ database: fixture.referralDb, accountId: 'inviter-account', timestamp: start + (15 * 86400000) });
    const grant = matured.account.grants.find((entry) => entry.keyType === 'builder');
    assert.ok(grant?.grantId);
    const redeemed = await redeemEonKey({
      database: fixture.referralDb,
      accountId: 'inviter-account',
      grantId: grant.grantId,
      unlockId: 'builder-project-slots-90d',
      timestamp: start + (15 * 86400000) + 1000
    });
    assert.equal(redeemed.ok, true);
    assert.equal((await readAccountActiveEonKeyUnlocks({ database: fixture.referralDb, accountId: 'inviter-account', timestamp: start + (15 * 86400000) + 2000 })).length, 1);
    const refund = paidEvent(1, start + (16 * 86400000), {
      providerEventId: 'evt-refund-consumed',
      rawEventType: 'refund.succeeded',
      eventType: 'payment_refunded'
    });
    await applyDodoWebhookToD1(fixture.billingDb, refund, '{"type":"refund.succeeded"}', { referralActive: true, referralDatabase: fixture.referralDb });
    const grantRow = fixture.referralDb.sqlite.prepare('SELECT status FROM eon_key_grants WHERE grant_id = ?').get(grant.grantId);
    const unlockRow = fixture.referralDb.sqlite.prepare('SELECT status FROM eon_key_unlocks WHERE source_grant_id = ?').get(grant.grantId);
    assert.equal(grantRow.status, 'revoked');
    assert.equal(unlockRow.status, 'revoked');
    assert.equal((await readAccountActiveEonKeyUnlocks({ database: fixture.referralDb, accountId: 'inviter-account', timestamp: start + (17 * 86400000) })).length, 0);
    const journal = fixture.referralDb.sqlite.prepare('SELECT from_status, to_status FROM eon_key_grant_journal WHERE grant_id = ? ORDER BY created_at, rowid').all(grant.grantId);
    assert.deepEqual(journal.map((row) => `${row.from_status}->${row.to_status}`), ['pending->vested', 'vested->available', 'available->consumed', 'consumed->revoked']);
  } finally { closeFixture(fixture); }
});

test('A15 I18 keeps Creator distribution reviewed, manual and separate from referral qualification', () => {
  const truths = [getEonOutputShareHandoffTruth(), getEonSharePackTruth(), getEonShareIntentTruth()];
  for (const truth of truths) {
    assert.equal(truth.directPublishing, false);
    assert.equal(truth.referralReward, false);
  }
  assert.equal(truths[0].explicitUserActionRequired, true);
  assert.equal(truths[0].tracking, false);
  assert.equal(truths[1].automatedScheduling, false);
  assert.equal(truths[1].storedPlatformTokens, false);
  assert.equal(truths[2].sessionStorageOnly, true);
  assert.equal(truths[2].explicitCtaRequired, true);
});
