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
  qualifyReferralActivation,
  recordReferralQualificationReceipt,
  readReferralAccountStatus,
  redeemEonKey,
  requestReferralBindChallenge,
  selectPaidReferralKeyType,
  validateReferralServerContract
} from '../../assets/js/referrals/eon-referral-server-runtime.js';
import { applyDodoWebhookToD1 } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { validateW623hMinimalReferralContract } from '../../config/w623h-minimal-referral-ledger-contract.mjs';

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
        const results = statements.map((statement) => statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
}


async function bindWithProof(database, accountId, invite, timestamp = 1) {
  const challenge = await requestReferralBindChallenge({ database, accountId, token: invite.token, timestamp });
  assert.equal(challenge.ok, true);
  const signature = await signSharePayload(challenge.canonical);
  return bindReferralIdentity({
    database,
    accountId,
    token: invite.token,
    challengeId: challenge.challengeId,
    challenge: challenge.challenge,
    signature,
    timestamp: timestamp + 1
  });
}

function billingEvent(overrides = {}) {
  return {
    providerEventId: 'evt_payment_1',
    rawEventType: 'payment.succeeded',
    eventType: 'payment_succeeded',
    accountId: 'invitee-account',
    tierId: 'plus',
    providerCustomerRef: 'customer_1',
    providerSubscriptionRef: 'subscription_1',
    occurredAt: Date.UTC(2026, 6, 1),
    ...overrides
  };
}

test('W623H contract is subscription-only, stateless and minimal', () => {
  assert.equal(validateW623hMinimalReferralContract().ok, true);
  assert.equal(validateReferralServerContract().ok, true);
  const active = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'production', EON_REFERRALS_DB: { prepare() {} }, EON_BILLING_DB: { prepare() {} } });
  assert.equal(active.active, true);
  assert.equal(active.ordinaryAdsOutsideReferral, true);
  assert.equal(active.rewardedSponsorKeysOutsideReferral, true);
  assert.equal(active.referralAdViewRewards, false);
  assert.equal(active.monetization, 'separate-commercial-rails');
  assert.match(fs.readFileSync(new URL('../../assets/js/referrals/eon-keys-page.js', import.meta.url), 'utf8'), /MyLead Sponsored Missions/);
  assert.equal(active.storage.rawTokens, false);
  assert.equal(active.storage.clicks, false);
  assert.equal(active.storage.media, false);
  assert.equal(selectPaidReferralKeyType(0), 'builder');
  assert.equal(selectPaidReferralKeyType(1), 'builder');
  assert.equal(selectPaidReferralKeyType(2), 'power');
});

test('W623H binds one inviter, rejects self-referral and grants one capped activation Signal Key', async () => {
  const db = makeD1();
  const invite = await createSignedShareLink({ destination: '/', source: 'w623h-test', missionType: 'share_eonapp' });
  const replayWithoutProof = await bindReferralIdentity({ database: db, accountId: 'attacker-account', token: invite.token, timestamp: 9 });
  assert.equal(replayWithoutProof.status, 'bind_proof_required');
  const bound = await bindWithProof(db, 'inviter-account', invite, 10);
  assert.equal(bound.ok, true);
  const self = await enrollReferral({ database: db, inviteeAccountId: 'inviter-account', token: invite.token, timestamp: 20 });
  assert.equal(self.status, 'self_referral_rejected');
  const enrolled = await enrollReferral({ database: db, inviteeAccountId: 'invitee-account', token: invite.token, timestamp: 30 });
  assert.equal(enrolled.ok, true);
  const missingReceipt = await qualifyReferralActivation({ database: db, inviteeAccountId: 'invitee-account', milestone: 'first_project_saved', timestamp: 39 });
  assert.equal(missingReceipt.status, 'server_milestone_receipt_required');
  const receipt = await recordReferralQualificationReceipt({ database: db, inviteeAccountId: 'invitee-account', milestone: 'first_project_saved', sourceEventId: 'project-save-1', issuer: 'owner-proof-fixture', timestamp: 40 });
  const qualified = await qualifyReferralActivation({ database: db, inviteeAccountId: 'invitee-account', milestone: 'first_project_saved', sourceReceiptId: receipt.receiptId, timestamp: 41 });
  assert.equal(qualified.status, 'signal_key_granted');
  const duplicate = await qualifyReferralActivation({ database: db, inviteeAccountId: 'invitee-account', milestone: 'first_project_saved', sourceReceiptId: receipt.receiptId, timestamp: 50 });
  assert.equal(duplicate.status, 'server_milestone_receipt_already_consumed');
  const status = await readReferralAccountStatus({ database: db, accountId: 'inviter-account', timestamp: 60 });
  assert.equal(status.account.balances.available.signal, 1);
  assert.deepEqual(status.account.growthMetrics, {
    acceptedInvites: 1,
    activatedInvites: 1,
    paidPending: 0,
    paidRetained: 0,
    reversedOrBlocked: 0,
    measurementBoundary: 'qualified-ledger-events-only-no-click-impression-or-social-post-tracking'
  });
  assert.equal(status.account.digitalRewards.some((reward) => reward.code === 'signal-vault-relic'), true);
  db.sqlite.close();
});

test('W623H waits 14 days for a paid key, supports redemption and reverses refund-derived value', async () => {
  const billingDb = makeD1('billing');
  const db = makeD1('referrals');
  const invite = await createSignedShareLink({ destination: '/', source: 'w623h-paid-test', missionType: 'share_eonapp' });
  await bindWithProof(db, 'inviter-account', invite, 10);
  await enrollReferral({ database: db, inviteeAccountId: 'invitee-account', token: invite.token, timestamp: 20 });
  const start = Date.UTC(2026, 6, 1);
  const applied = await applyDodoWebhookToD1(billingDb, billingEvent({ occurredAt: start }), '{"type":"payment.succeeded"}', { referralActive: true, referralDatabase: db });
  assert.equal(applied.referral.status, 'paid_referral_pending');
  const early = await readReferralAccountStatus({ database: db, accountId: 'inviter-account', timestamp: start + (13 * 86400000) });
  assert.equal(early.account.balances.available.builder, 0);
  assert.equal(early.account.growthMetrics.paidPending, 1);
  const mature = await readReferralAccountStatus({ database: db, accountId: 'inviter-account', timestamp: start + (15 * 86400000) });
  assert.equal(mature.account.balances.available.builder, 1);
  assert.equal(mature.account.growthMetrics.paidRetained, 1);
  const grant = mature.account.grants.find((row) => row.keyType === 'builder' && row.status === 'available');
  assert.ok(grant?.grantId);
  const redeemed = await redeemEonKey({ database: db, accountId: 'inviter-account', grantId: grant.grantId, unlockId: 'builder-premium-workflow-pack', timestamp: start + (15 * 86400000) + 1 });
  assert.equal(redeemed.status, 'unlock_active');
  const reversed = await applyDodoWebhookToD1(billingDb, billingEvent({ providerEventId: 'evt_refund_1', rawEventType: 'refund.succeeded', eventType: 'payment_refunded', occurredAt: start + (16 * 86400000) }), '{"type":"refund.succeeded"}', { referralActive: true, referralDatabase: db });
  assert.equal(reversed.referral.status, 'paid_referral_reversed');
  const after = await readReferralAccountStatus({ database: db, accountId: 'inviter-account', timestamp: start + (17 * 86400000) });
  assert.equal(after.account.grants.find((row) => row.grantId === grant.grantId)?.status, 'revoked');
  assert.equal(after.account.unlocks.find((row) => row.unlockId === 'builder-premium-workflow-pack')?.status, 'revoked');
  assert.equal(after.account.digitalRewards.find((row) => row.code === 'builder-vault-relic')?.status, 'revoked');
  billingDb.sqlite.close();
  db.sqlite.close();
});
