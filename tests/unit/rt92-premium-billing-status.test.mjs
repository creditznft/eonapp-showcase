import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyPremiumBillingMigration } from '../helpers/eon-d1-test-migrations.mjs';
import { applySoftwareGrantEventToD1 } from '../../assets/js/billing/eon-premium-software-grant-ledger.js';
import { buildPremiumStatus } from '../../functions/api/billing/status.js';

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
function premiumEnv(database, overrides = {}) {
  return {
    EON_BILLING_DB: database,
    EON_PREMIUM_CHECKOUT_ROLLOUT: 'testing',
    DODO_API_ENVIRONMENT: 'test',
    DODO_PAYMENTS_API_KEY: 'test_api_key',
    DODO_WEBHOOK_SECRET: 'test_webhook_secret',
    EON_ENTITLEMENT_SIGNING_KEY: 'test_entitlement_key',
    DODO_PRODUCT_PRO: 'pdt_test_pro',
    DODO_PRODUCT_ULTRA: 'pdt_test_ultra',
    DODO_PRODUCT_ULTIMATE: 'pdt_test_ultimate',
    ...overrides
  };
}

test('Ultimate software billing status enables checkout only when runtime config and software-grant schema are both ready', async () => {
  const withoutSchema = makeD1({ premium: false });
  const blocked = await buildPremiumStatus(premiumEnv(withoutSchema));
  assert.equal(blocked.checkoutActive, false);
  assert.equal(blocked.schemaReady, false);
  assert.ok(blocked.missing.includes('PREMIUM_BILLING_SCHEMA'));
  withoutSchema.sqlite.close();

  const readyDb = makeD1();
  const ready = await buildPremiumStatus(premiumEnv(readyDb));
  assert.equal(ready.checkoutActive, true);
  assert.equal(ready.apiEnvironment, 'test');
  assert.equal(ready.schemaReady, true);
  assert.equal(ready.softwareGrantSchemaVersion, 1);
  assert.deepEqual(ready.plans.map(({ id, priceUsd, pricingType, trialDays, checkoutActive }) => ({ id, priceUsd, pricingType, trialDays, checkoutActive })), [
    { id: 'ultimate', priceUsd: 1299, pricingType: 'one-time', trialDays: 0, checkoutActive: true }
  ]);
  assert.deepEqual(ready.configured.products, { ultimate: true });
  readyDb.sqlite.close();
});

test('premium billing status exposes only configuration booleans and verified Ultimate ownership, never provider credentials', async () => {
  const db = makeD1();
  await applySoftwareGrantEventToD1(db, {
    providerEventId: 'evt_status_ultimate_paid', rawEventType: 'payment.succeeded', eventType: 'grant',
    accountId: 'acct_status_ultimate', bundleId: 'ultimate', sourceOrderRef: 'pay_status_ultimate', sourcePaymentRef: 'pay_status_ultimate', occurredAt: 1000
  }, JSON.stringify({ safe: true }), { now: 1100 });
  const env = premiumEnv(db);
  const status = await buildPremiumStatus(env, 'acct_status_ultimate');
  assert.equal(status.account.ultimateOwned, true);
  assert.deepEqual(status.account.softwareBundles, ['ultimate']);
  assert.equal(status.browserGrantAllowed, false);
  assert.equal(status.signedWebhookRequired, true);
  assert.equal(status.hostedCapacityBundledWithUltimate, false);
  const serialized = JSON.stringify(status);
  assert.doesNotMatch(serialized, /test_api_key|test_webhook_secret|test_entitlement_key|pdt_test_pro|pdt_test_ultra|pdt_test_ultimate/);
  db.sqlite.close();
});
