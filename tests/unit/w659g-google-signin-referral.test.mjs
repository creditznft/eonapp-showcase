import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyReferralMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createSignedShareLink } from '../../assets/js/utils/signed-share-link.js';
import { signSharePayload } from '../../assets/js/utils/share-link-identity.js';
import {
  bindReferralIdentity,
  qualifyReferralActivation,
  qualifyReferralGoogleSignIn,
  readReferralAccountStatus,
  recordReferralQualificationReceipt,
  requestReferralBindChallenge
} from '../../assets/js/referrals/eon-referral-server-runtime.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}

function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  applyReferralMigrations(sqlite);
  return {
    sqlite,
    prepare(sql) { return new Statement(sqlite, sql); },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const out = statements.map((statement) => statement.run());
        sqlite.exec('COMMIT');
        return out;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

async function registerInviter(database, accountId, invite, timestamp = 10) {
  const challenge = await requestReferralBindChallenge({ database, accountId, token: invite.token, timestamp });
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

test('W659G verified Google session qualifies one signed referral and one Signal EONKEY', async () => {
  const database = makeD1();
  const invite = await createSignedShareLink({ destination: '/eoncity', source: 'w659g-google-signin', missionType: 'share_eoncity' });
  assert.equal((await registerInviter(database, 'inviter-account', invite)).ok, true);

  const first = await qualifyReferralGoogleSignIn({
    database,
    inviteeAccountId: 'google-account-invitee',
    token: invite.token,
    timestamp: 1000
  });
  assert.equal(first.ok, true);
  assert.equal(first.status, 'signal_key_granted');
  assert.equal(first.milestone, 'google_account_connected');
  assert.equal(first.googleIdentityVerifiedBySession, true);
  assert.equal(first.browserGranted, false);

  const replay = await qualifyReferralGoogleSignIn({
    database,
    inviteeAccountId: 'google-account-invitee',
    token: invite.token,
    timestamp: 2000
  });
  assert.equal(replay.ok, true);
  assert.equal(replay.duplicate, true);

  const inviter = await readReferralAccountStatus({ database, accountId: 'inviter-account', timestamp: 3000 });
  assert.equal(inviter.account.balances.available.signal, 1);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_key_grants WHERE account_id = 'inviter-account'").get().total, 1);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_referral_milestone_receipts WHERE milestone = 'google_account_connected'").get().total, 1);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_invite_events WHERE event_type = 'activated_free_invite'").get().total, 1);

  const laterReceipt = await recordReferralQualificationReceipt({
    database,
    inviteeAccountId: 'google-account-invitee',
    milestone: 'first_project_saved',
    sourceEventId: 'project-save-after-google-signin',
    issuer: 'eonapp-first-party',
    timestamp: 3100
  });
  assert.equal(laterReceipt.ok, true);
  const laterQualification = await qualifyReferralActivation({
    database,
    inviteeAccountId: 'google-account-invitee',
    milestone: 'first_project_saved',
    sourceReceiptId: laterReceipt.receiptId,
    timestamp: 3200
  });
  assert.equal(laterQualification.ok, true);
  assert.equal(laterQualification.duplicate, true);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_key_grants WHERE account_id = 'inviter-account' AND key_type = 'signal'").get().total, 1);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS total FROM eon_invite_events WHERE event_type = 'activated_free_invite'").get().total, 1);
  database.sqlite.close();
});

test('W659G Google-signin path retains self-referral and signed-token controls', async () => {
  const database = makeD1();
  const invite = await createSignedShareLink({ destination: '/', source: 'w659g-self-check', missionType: 'share_eonapp' });
  assert.equal((await registerInviter(database, 'same-account', invite)).ok, true);
  const self = await qualifyReferralGoogleSignIn({ database, inviteeAccountId: 'same-account', token: invite.token, timestamp: 1000 });
  assert.equal(self.ok, false);
  assert.equal(self.status, 'self_referral_rejected');
  const forged = await qualifyReferralGoogleSignIn({ database, inviteeAccountId: 'different-account', token: `${invite.token}x`, timestamp: 2000 });
  assert.equal(forged.ok, false);
  database.sqlite.close();
});
