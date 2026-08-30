import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyBillingMigrations, applyPremiumBillingMigration } from '../helpers/eon-d1-test-migrations.mjs';
import {
  getDodoProductMap,
  getPremiumDodoProductMap,
  getTierForDodoProductId,
  normalizeCheckoutRequest,
  normalizeDodoWebhookPayload,
  applyDodoWebhookToD1
} from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { normalizePremiumCheckoutRequest } from '../../assets/js/billing/eon-premium-dodo-runtime.js';
import { EON_PAID_SUBSCRIPTION_PLANS, getEonSubscriptionPlan } from '../../assets/js/commerce/eon-commercial-catalog.js';

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
  applyPremiumBillingMigration(sqlite);
  return { sqlite, prepare(sql) { return new Statement(sqlite, sql); } };
}
const env = {
  EON_BILLING_ROLLOUT: 'testing', EON_PREMIUM_CHECKOUT_ROLLOUT: 'testing',
  DODO_PAYMENTS_API_KEY: 'test_api', DODO_WEBHOOK_SECRET: 'whsec_test', EON_ENTITLEMENT_SIGNING_KEY: 'signing_test',
  DODO_PRODUCT_PLUS: 'p_plus', DODO_PRODUCT_STUDIO: 'p_studio', DODO_PRODUCT_POWER: 'p_power', DODO_PRODUCT_MAX: 'p_max',
  DODO_PRODUCT_PRO: 'p_pro', DODO_PRODUCT_ULTRA: 'p_ultra', DODO_PRODUCT_ULTIMATE: 'p_ultimate'
};
const recurring = EON_PAID_SUBSCRIPTION_PLANS.map((plan) => plan.id);

test('all seven purchasable Dodo product mappings are exact and recurring checkout accepts Plus through Ultra only', () => {
  assert.deepEqual(recurring, ['plus', 'studio', 'power', 'max', 'pro', 'ultra']);
  const map = getDodoProductMap(env);
  assert.deepEqual(Object.keys(map), recurring);
  assert.equal(getPremiumDodoProductMap(env).ultimate, 'p_ultimate');
  for (const tier of recurring) {
    const productId = env[`DODO_PRODUCT_${tier.toUpperCase()}`];
    assert.equal(map[tier], productId);
    assert.equal(getTierForDodoProductId(productId, env), tier);
    const normalized = normalizeCheckoutRequest({ tier, idempotencyKey: `checkout:${tier}:matrix` }, env);
    assert.equal(normalized.ok, true, tier);
    assert.equal(normalized.productId, productId, tier);
    assert.equal(getEonSubscriptionPlan(tier).trialDays, 7, tier);
  }
  assert.equal(normalizeCheckoutRequest({ tier: 'ultimate', idempotencyKey: 'checkout:ultimate:wrong-rail' }, env).ok, false);
  const ultimate = normalizePremiumCheckoutRequest({ tier: 'ultimate', idempotencyKey: 'checkout:ultimate:matrix' }, env);
  assert.equal(ultimate.ok, true);
  assert.equal(ultimate.productId, 'p_ultimate');
  assert.equal(ultimate.pricingKind, 'one-time-software');
  assert.equal(getEonSubscriptionPlan('ultimate').trialDays, 0);
});

test('every recurring tier can activate, schedule cancellation, expire and revoke only through provider lifecycle events', async () => {
  const db = makeD1();
  const now = Date.parse('2026-08-21T10:00:00Z');
  for (let index = 0; index < recurring.length; index += 1) {
    const tier = recurring[index];
    const accountId = `acct_${tier}`;
    const productId = env[`DODO_PRODUCT_${tier.toUpperCase()}`];
    const subscriptionId = `sub_${tier}`;
    const paymentId = `pay_${tier}`;
    const active = normalizeDodoWebhookPayload({ type: 'subscription.active', timestamp: new Date(now).toISOString(), data: { product_id: productId, subscription_id: subscriptionId, customer_id: `cus_${tier}`, next_billing_date: new Date(now + 30 * 86400000).toISOString(), metadata: { eon_account_id: accountId } } }, env, `evt_${tier}_active`);
    assert.equal((await applyDodoWebhookToD1(db, active, JSON.stringify({ type: 'subscription.active' }))).entitlementChanged, true, tier);
    let row = db.sqlite.prepare('SELECT tier_id,status FROM eon_entitlements WHERE account_id=?').get(accountId);
    assert.equal(row.tier_id, tier); assert.equal(row.status, 'active');

    const paid = normalizeDodoWebhookPayload({ type: 'payment.succeeded', timestamp: new Date(now + 1000).toISOString(), data: { subscription_id: subscriptionId, payment_id: paymentId } }, env, `evt_${tier}_paid`);
    await applyDodoWebhookToD1(db, paid, JSON.stringify({ type: 'payment.succeeded' }));

    const cancelling = normalizeDodoWebhookPayload({ type: 'subscription.updated', timestamp: new Date(now + 2000).toISOString(), data: { product_id: productId, subscription_id: subscriptionId, cancel_at_next_billing_date: true, next_billing_date: new Date(now + 30 * 86400000).toISOString(), metadata: { eon_account_id: accountId } } }, env, `evt_${tier}_cancel_scheduled`);
    await applyDodoWebhookToD1(db, cancelling, JSON.stringify({ type: 'subscription.updated' }));
    row = db.sqlite.prepare('SELECT tier_id,status FROM eon_entitlements WHERE account_id=?').get(accountId);
    assert.equal(row.tier_id, tier); assert.equal(row.status, 'cancelling');

    const refund = normalizeDodoWebhookPayload({ type: 'refund.succeeded', timestamp: new Date(now + 3000).toISOString(), data: { payment_id: paymentId, refund_id: `ref_${tier}` } }, env, `evt_${tier}_refund`);
    const revoked = await applyDodoWebhookToD1(db, refund, JSON.stringify({ type: 'refund.succeeded' }));
    assert.equal(revoked.entitlementChanged, true, tier);
    row = db.sqlite.prepare('SELECT tier_id,status FROM eon_entitlements WHERE account_id=?').get(accountId);
    assert.equal(row.tier_id, 'free'); assert.equal(row.status, 'revoked');

    const duplicate = await applyDodoWebhookToD1(db, refund, JSON.stringify({ type: 'refund.succeeded' }));
    assert.equal(duplicate.duplicate, true, `${tier} refund idempotency`);
  }
  db.sqlite.close();
});

test('out-of-order older recurring event cannot restore access after a newer refund revocation', async () => {
  const db = makeD1();
  const accountId = 'acct_ordering';
  const active = normalizeDodoWebhookPayload({ type: 'subscription.active', timestamp: '2026-08-21T10:00:00Z', data: { product_id: 'p_power', subscription_id: 'sub_ordering', metadata: { eon_account_id: accountId } } }, env, 'evt_order_active');
  await applyDodoWebhookToD1(db, active, '{}');
  const paid = normalizeDodoWebhookPayload({ type: 'payment.succeeded', timestamp: '2026-08-21T10:01:00Z', data: { subscription_id: 'sub_ordering', payment_id: 'pay_ordering' } }, env, 'evt_order_paid');
  await applyDodoWebhookToD1(db, paid, '{}');
  const refund = normalizeDodoWebhookPayload({ type: 'refund.succeeded', timestamp: '2026-08-21T10:02:00Z', data: { payment_id: 'pay_ordering' } }, env, 'evt_order_refund');
  await applyDodoWebhookToD1(db, refund, '{}');
  const stale = normalizeDodoWebhookPayload({ type: 'subscription.renewed', timestamp: '2026-08-21T10:00:30Z', data: { product_id: 'p_power', subscription_id: 'sub_ordering', metadata: { eon_account_id: accountId } } }, env, 'evt_order_stale');
  const result = await applyDodoWebhookToD1(db, stale, '{}');
  assert.equal(result.entitlementChanged, false);
  const row = db.sqlite.prepare('SELECT tier_id,status FROM eon_entitlements WHERE account_id=?').get(accountId);
  assert.equal(row.tier_id, 'free'); assert.equal(row.status, 'revoked');
  db.sqlite.close();
});
