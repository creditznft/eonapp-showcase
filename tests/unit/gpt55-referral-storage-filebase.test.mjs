import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMerkleTree,
  buildReferralEpoch,
  captureReferralEvent,
  getReferralDownline,
  getReferralStatus,
  parseCapturePayload,
  proofHasPrivateFields,
  uploadProofToFilebase,
} from '../../functions/api/referrals/_storage.js';
import { onRequestPost as capturePost } from '../../functions/api/referrals/capture.js';

class MockStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) { this.args = args; return this; }
  async first() { return this.db.first(this.sql, this.args); }
  async all() { return { results: this.db.all(this.sql, this.args) }; }
  async run() { return this.db.run(this.sql, this.args); }
}

class MockD1 {
  constructor() {
    this.events = new Map();
    this.accounts = new Map();
    this.epochs = new Map();
    this.epochRecords = new Map();
  }
  prepare(sql) { return new MockStatement(this, sql); }
  first(sql, args) {
    if (sql.includes('FROM referral_accounts WHERE user_id_hash')) return this.accounts.get(args[0]) || null;
    if (sql.includes('FROM referral_events WHERE id')) return this.events.get(args[0]) || null;
    if (sql.includes('FROM referral_epochs WHERE epoch_id')) return this.epochs.get(args[0]) || null;
    if (sql.includes('FROM referral_epochs ORDER BY')) return [...this.epochs.values()].sort((a, b) => b.created_at - a.created_at)[0] || null;
    return null;
  }
  all(sql, args) {
    if (sql.includes('FROM referral_accounts WHERE referrer_id_hash')) {
      return [...this.accounts.values()].filter((row) => row.referrer_id_hash === args[0]).slice(0, args[1] || 100);
    }
    if (sql.includes('FROM referral_events WHERE created_at')) {
      const [start, end, limit] = args;
      return [...this.events.values()].filter((row) => row.created_at >= start && row.created_at <= end).sort((a, b) => a.created_at - b.created_at).slice(0, limit || 1000);
    }
    if (sql.includes('FROM referral_epoch_records WHERE epoch_id')) {
      return [...this.epochRecords.values()].filter((row) => row.epoch_id === args[0]).slice(0, 500);
    }
    return [];
  }
  run(sql, args) {
    if (sql.includes('INSERT OR IGNORE INTO referral_events')) {
      const [id, user_id_hash, referrer_id_hash, short_code, signed_envelope_hash, source, status, created_at, confirmed_at] = args;
      if (!this.events.has(id)) this.events.set(id, { id, user_id_hash, referrer_id_hash, short_code, signed_envelope_hash, source, status, created_at, confirmed_at });
      return { success: true };
    }
    if (sql.includes('INSERT INTO referral_accounts')) {
      const [user_id_hash, referrer_id_hash, first_event_id, first_linked_at, current_status] = args;
      this.accounts.set(user_id_hash, { user_id_hash, referrer_id_hash, first_event_id, first_linked_at, current_status });
      return { success: true };
    }
    if (sql.includes('INSERT OR REPLACE INTO referral_epochs')) {
      const [epoch_id, start_at, end_at, record_count, merkle_root, evidence_hash, filebase_key, filebase_cid, signature, status, created_at, published_at] = args;
      this.epochs.set(epoch_id, { epoch_id, start_at, end_at, record_count, merkle_root, evidence_hash, filebase_key, filebase_cid, signature, status, created_at, published_at });
      return { success: true };
    }
    if (sql.includes('INSERT OR REPLACE INTO referral_epoch_records')) {
      const [epoch_id, event_id, leaf_hash, proof_json] = args;
      this.epochRecords.set(`${epoch_id}:${event_id}`, { epoch_id, event_id, leaf_hash, proof_json });
      return { success: true };
    }
    return { success: true };
  }
}

test('captures referral instantly, rejects self-referral, and prevents referrer changes', async () => {
  const db = new MockD1();
  const event = await parseCapturePayload({
    userIdHash: 'sha256:user-a',
    referrerIdHash: 'sha256:ref-a',
    shortCode: 'abc123',
    signedEnvelopeHash: 'sha256:envelope-a',
    source: 'unit',
  });
  const captured = await captureReferralEvent(db, event);
  assert.equal(captured.ok, true);
  const status = await getReferralStatus(db, 'sha256:user-a');
  assert.equal(status.found, true);
  assert.equal(status.account.referrerIdHash, 'sha256:ref-a');

  const duplicate = await captureReferralEvent(db, event);
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.idempotent, true);

  const changed = await captureReferralEvent(db, { ...event, id: 'manual-2', referrerIdHash: 'sha256:ref-b', signedEnvelopeHash: 'sha256:envelope-b' });
  assert.equal(changed.ok, false);
  assert.equal(changed.error, 'referrer_already_bound');

  const self = await captureReferralEvent(db, { ...event, id: 'self', userIdHash: 'sha256:same', referrerIdHash: 'sha256:same' });
  assert.equal(self.ok, false);
  assert.equal(self.error, 'self_referral_rejected');
});

test('downline query and deterministic Merkle root work', async () => {
  const db = new MockD1();
  for (let i = 0; i < 3; i += 1) {
    const event = await parseCapturePayload({
      userIdHash: `sha256:user-${i}`,
      referrerIdHash: 'sha256:ref-root',
      shortCode: `code-${i}`,
      signedEnvelopeHash: `sha256:envelope-${i}`,
      source: 'unit',
      createdAt: 1000 + i,
    });
    await captureReferralEvent(db, event);
  }
  const downline = await getReferralDownline(db, 'sha256:ref-root');
  assert.equal(downline.count, 3);
  const epoch = await buildReferralEpoch(db, { epochId: 'epoch-1', startAt: 0, endAt: 9999 });
  const epochAgain = await buildReferralEpoch(db, { epochId: 'epoch-1', startAt: 0, endAt: 9999 });
  assert.equal(epoch.recordCount, 3);
  assert.equal(epoch.merkleRoot, epochAgain.merkleRoot);
  assert.equal(proofHasPrivateFields(epoch.proof), false);
  const empty = await buildMerkleTree([]);
  assert.match(empty.root, /^[a-f0-9]{64}$/);
});

test('Pages capture function returns missing binding safely and does not leak secrets', async () => {
  const request = new Request('https://eonapp.ch/api/referrals/capture', { method: 'POST', body: JSON.stringify({}) });
  const response = await capturePost({ request, env: {} });
  const payload = await response.json();
  assert.equal(response.status, 500);
  assert.match(payload.error, /REFERRALS_DB/);
});

test('Filebase upload skips when not configured', async () => {
  const result = await uploadProofToFilebase({}, 'referrals/epochs/test.json', { ok: true });
  assert.equal(result.ok, false);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'filebase_not_configured');
});
