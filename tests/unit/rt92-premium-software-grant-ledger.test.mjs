import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyPremiumBillingMigration } from '../helpers/eon-d1-test-migrations.mjs';
import {
  applySoftwareGrantEventToD1,
  getPremiumSoftwareGrantTruth,
  readAccountActiveSoftwareGrants,
  readPremiumSoftwareSchemaAuthority
} from '../../assets/js/billing/eon-premium-software-grant-ledger.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1({ premium = true } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  applyBillingMigrations(sqlite);
  if (premium) applyPremiumBillingMigration(sqlite);
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); } };
}

const grant = (overrides = {}) => ({
  providerEventId: 'evt_ultimate_paid_1',
  rawEventType: 'payment.succeeded',
  eventType: 'grant',
  accountId: 'acct_ultimate_1',
  bundleId: 'ultimate',
  sourceOrderRef: 'pay_ultimate_1',
  sourcePaymentRef: 'pay_ultimate_1',
  occurredAt: 1000,
  ...overrides
});

test('premium software grant schema is independently versioned inside billing D1', async () => {
  const db = makeD1({ premium: false });
  assert.equal((await readPremiumSoftwareSchemaAuthority(db)).ok, false);
  applyPremiumBillingMigration(db.sqlite);
  const status = await readPremiumSoftwareSchemaAuthority(db);
  assert.equal(status.ok, true);
  assert.equal(status.actualVersion, 1);
  const billing = db.sqlite.prepare(`SELECT schema_version FROM eon_schema_authority WHERE domain='billing'`).get();
  assert.equal(billing.schema_version, 2, 'premium migration must not advance core billing authority');
  db.sqlite.close();
});

test('verified Ultimate purchase grants permanent software capability without hosted capacity', async () => {
  const db = makeD1();
  const applied = await applySoftwareGrantEventToD1(db, grant(), JSON.stringify({ payment: 'safe' }), { now: 1100 });
  assert.equal(applied.ok, true);
  assert.equal(applied.changed, true);
  assert.equal(applied.hostedCapacityGranted, false);
  const grants = await readAccountActiveSoftwareGrants(db, 'acct_ultimate_1');
  assert.equal(grants.length, 1);
  assert.equal(grants[0].bundleId, 'ultimate');
  db.sqlite.close();
});

test('Ultimate webhook replay is idempotent and conflicting payload is rejected', async () => {
  const db = makeD1();
  const raw = JSON.stringify({ payment: 'safe' });
  const first = await applySoftwareGrantEventToD1(db, grant(), raw, { now: 1100 });
  const replay = await applySoftwareGrantEventToD1(db, grant(), raw, { now: 1200 });
  const conflict = await applySoftwareGrantEventToD1(db, grant(), JSON.stringify({ payment: 'different' }), { now: 1300 });
  assert.equal(first.changed, true);
  assert.equal(replay.duplicate, true);
  assert.equal(replay.changed, false);
  assert.equal(conflict.ok, false);
  assert.equal(conflict.status, 'software_grant_event_payload_conflict');
  db.sqlite.close();
});

test('refund/dispute revocation removes Ultimate while chargeback-win restoration can reactivate it', async () => {
  const db = makeD1();
  const raw = JSON.stringify({ payment: 'safe' });
  await applySoftwareGrantEventToD1(db, grant(), raw, { now: 1100 });
  const revoked = await applySoftwareGrantEventToD1(db, grant({ providerEventId: 'evt_refund_1', rawEventType: 'refund.succeeded', eventType: 'revoke', accountId: '', revocationReason: 'refund' }), JSON.stringify({ refund: 'safe' }), { now: 2000 });
  assert.equal(revoked.changed, true);
  assert.equal((await readAccountActiveSoftwareGrants(db, 'acct_ultimate_1')).length, 0);
  const restored = await applySoftwareGrantEventToD1(db, grant({ providerEventId: 'evt_dispute_won_1', rawEventType: 'dispute.won', eventType: 'restore', occurredAt: 3000 }), JSON.stringify({ dispute: 'won' }), { now: 3100 });
  assert.equal(restored.changed, true);
  assert.equal((await readAccountActiveSoftwareGrants(db, 'acct_ultimate_1')).length, 1);
  db.sqlite.close();
});

test('software grant truth keeps capability separate from capacity and browser authority', () => {
  const truth = getPremiumSoftwareGrantTruth();
  assert.equal(truth.sameBillingD1, true);
  assert.equal(truth.browserGrantAllowed, false);
  assert.equal(truth.hostedCapacityGranted, false);
  assert.equal(truth.recurringSubscriptionReplaced, false);
});
