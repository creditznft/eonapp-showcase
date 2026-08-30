import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations } from '../helpers/eon-d1-test-migrations.mjs';
import { createBillingIdempotencyKey } from '../../assets/js/billing/eon-billing-client-idempotency.js';
import {
  ensureBillingCommandSchema,
  getBillingCommandTruth,
  prepareBillingCommand,
  readBillingCommand,
  reconcileBillingCommandFromWebhook,
  updateBillingCommand
} from '../../assets/js/billing/eon-billing-command-ledger.js';
import { ensureBillingSchema } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { getEonSubscriptionPlan, validateEonCommercialCatalog } from '../../assets/js/commerce/eon-commercial-catalog.js';

class Statement {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.db, this.sql, args); }
  run() { return this.db.prepare(this.sql).run(...this.args); }
  first() { return this.db.prepare(this.sql).get(...this.args) || null; }
  all() { return { results: this.db.prepare(this.sql).all(...this.args) }; }
}
function makeD1() {
  const sqlite = new DatabaseSync(':memory:');
  applyBillingMigrations(sqlite);
  return {
    sqlite,
    prepare(sql) { return new Statement(sqlite, sql); },
    async batch(rows) {
      sqlite.exec('BEGIN');
      try { const output = rows.map((row) => row.run()); sqlite.exec('COMMIT'); return output; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}

const request = (overrides = {}) => ({ accountId: 'account_i17', operation: 'checkout', requestedTierId: 'studio', idempotencyKey: 'checkout:studio:i17-0001', statePrecondition: 'no-active-subscription', ...overrides });

test('A15 I17 creates secure client idempotency keys and freezes Max at $49.99', () => {
  const key = createBillingIdempotencyKey('checkout-max', { randomUUID: () => '00000000-0000-4000-8000-000000000017' });
  assert.equal(key, 'checkout-max:00000000-0000-4000-8000-000000000017');
  assert.equal(validateEonCommercialCatalog().ok, true);
  assert.equal(getEonSubscriptionPlan('max').monthlyUsd, 49.99);
});

test('A15 I17 returns the same account command for duplicate and concurrent checkout requests', async () => {
  const db = makeD1();
  await ensureBillingSchema(db);
  const first = await prepareBillingCommand(db, request(), { now: 1000 });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);
  assert.equal(first.command.trialDays, 7);
  const duplicate = await prepareBillingCommand(db, request(), { now: 1001 });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.command.commandId, first.command.commandId);
  const concurrent = await prepareBillingCommand(db, request({ idempotencyKey: 'checkout:studio:i17-0002' }), { now: 1002 });
  assert.equal(concurrent.ok, true);
  assert.equal(concurrent.status, 'account_pending_command');
  assert.equal(concurrent.command.commandId, first.command.commandId);
  db.sqlite.close();
});

test('A15 I17 blocks a second subscription checkout and requires plan-change authority', async () => {
  const db = makeD1();
  await ensureBillingSchema(db);
  db.sqlite.prepare(`INSERT INTO eon_billing_lifecycle (account_id,tier_id,access_status,provider_subscription_ref,cancel_at_period_end,source_event_id,source_event_type,source_occurred_at,updated_at) VALUES (?,?,?,?,0,?,?,?,?)`)
    .run('account_i17', 'plus', 'active', 'sub_existing', 'evt_active', 'subscription_active', 1000, 1000);
  const blocked = await prepareBillingCommand(db, request(), { now: 1100 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 'existing_subscription_use_plan_change');
  db.sqlite.close();
});

test('A15 I17 allows resubscription after revocation but never reserves a second trial', async () => {
  const db = makeD1();
  await ensureBillingSchema(db);
  const first = await prepareBillingCommand(db, request(), { now: 1000 });
  await updateBillingCommand(db, first.command.commandId, { status: 'provider_accepted', resultStatus: 'checkout_created' }, { now: 1001 });
  await reconcileBillingCommandFromWebhook(db, first.command.commandId, { entitlementChanged: true, processingStatus: 'processed', now: 1002 });
  db.sqlite.prepare(`INSERT INTO eon_billing_lifecycle (account_id,tier_id,access_status,cancel_at_period_end,trial_ends_at,source_event_id,source_event_type,source_occurred_at,updated_at) VALUES (?,?,?,0,?,?,?,?,?)`)
    .run('account_i17', 'free', 'revoked', 2000, 'evt_revoked', 'subscription_cancelled', 3000, 3000);
  const second = await prepareBillingCommand(db, request({ requestedTierId: 'power', idempotencyKey: 'checkout:power:i17-0003' }), { now: 4000 });
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, false);
  assert.equal(second.command.trialDays, 0);
  db.sqlite.close();
});

test('A15 I17 webhook reconciliation verifies only the matching command', async () => {
  const db = makeD1();
  await ensureBillingSchema(db);
  const first = await prepareBillingCommand(db, request(), { now: 1000 });
  await updateBillingCommand(db, first.command.commandId, { status: 'provider_accepted', providerObjectRef: 'checkout_17', resultStatus: 'checkout_created' }, { now: 1001 });
  const verified = await reconcileBillingCommandFromWebhook(db, first.command.commandId, { entitlementChanged: true, processingStatus: 'processed', now: 1002 });
  assert.equal(verified.status, 'verified');
  assert.equal(verified.externalEffectVerified, true);
  const read = await readBillingCommand(db, 'account_i17', 'checkout:studio:i17-0001');
  assert.equal(read.status, 'verified');
  assert.equal(read.providerObjectRef, 'checkout_17');
  db.sqlite.close();
});

test('A15 I17 billing command truth keeps browser unlocks impossible', async () => {
  const db = makeD1();
  assert.equal((await ensureBillingCommandSchema(db)).ok, true);
  const truth = getBillingCommandTruth();
  assert.equal(truth.accountScopedIdempotency, true);
  assert.equal(truth.onePendingCheckoutPerAccount, true);
  assert.equal(truth.oneActiveSubscriptionPerAccount, true);
  assert.equal(truth.oneTrialReservationPerAccount, true);
  assert.equal(truth.browserCanGrantEntitlement, false);
  db.sqlite.close();
});

test('A15 I17 checkout retries return the same hosted session without a second provider request', async () => {
  const db = makeD1();
  const env = {
    EON_BILLING_ROLLOUT: 'testing',
    EON_BILLING_DB: db,
    DODO_PAYMENTS_API_KEY: 'unit_test_dodo_key',
    DODO_WEBHOOK_SECRET: 'unit_test_webhook_secret',
    EON_ENTITLEMENT_SIGNING_KEY: 'unit_test_entitlement_key',
    DODO_PRODUCT_PLUS: 'product_plus',
    DODO_PRODUCT_STUDIO: 'product_studio',
    DODO_PRODUCT_POWER: 'product_power',
    DODO_PRODUCT_MAX: 'product_max',
    DODO_PRODUCT_PRO: 'product_pro',
    DODO_PRODUCT_ULTRA: 'product_ultra',
    DODO_PRODUCT_ULTIMATE: 'product_ultimate'
  };
  let calls = 0;
  const fetchImpl = async (_url, options) => {
    calls += 1;
    assert.equal(options.headers['idempotency-key'], 'checkout:plus:i17-live-0001');
    const body = JSON.parse(options.body);
    assert.equal(body.subscription_data.trial_period_days, 7);
    return { ok: true, status: 200, async json() { return { session_id: 'checkout_session_17', checkout_url: 'https://checkout.dodopayments.com/session/i17-safe' }; } };
  };
  const { createDodoCheckoutSession } = await import('../../assets/js/billing/eon-dodo-live-runtime.js');
  const input = { tier: 'plus', idempotencyKey: 'checkout:plus:i17-live-0001' };
  const first = await createDodoCheckoutSession({ request: new Request('https://eonapp.ch/api/billing/checkout'), env, accountId: 'account_live_i17', input, fetchImpl });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);
  const duplicate = await createDodoCheckoutSession({ request: new Request('https://eonapp.ch/api/billing/checkout'), env, accountId: 'account_live_i17', input, fetchImpl });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.checkoutAttemptId, first.checkoutAttemptId);
  assert.equal(duplicate.checkoutUrl, first.checkoutUrl);
  const secondKey = await createDodoCheckoutSession({ request: new Request('https://eonapp.ch/api/billing/checkout'), env, accountId: 'account_live_i17', input: { tier: 'plus', idempotencyKey: 'checkout:plus:i17-live-0002' }, fetchImpl });
  assert.equal(secondKey.ok, true);
  assert.equal(secondKey.duplicate, true);
  assert.equal(secondKey.checkoutAttemptId, first.checkoutAttemptId);
  assert.equal(calls, 1);
  db.sqlite.close();
});
