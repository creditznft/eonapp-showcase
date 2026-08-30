import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDodoBillingConfig, getTierForDodoProductId, normalizeCheckoutRequest, normalizeDodoWebhookPayload, verifyDodoWebhookSignature, W621_TRIAL_DAYS } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { buildW621LiveRolloutChecklist, validateW621LiveDodoRolloutContract } from '../../config/w621-live-dodo-cloudflare-rollout-contract.mjs';
import { inspectW621LiveDodoCloudflareRolloutGate } from '../../scripts/w621-live-dodo-cloudflare-rollout-gate.mjs';

const env = {
  EON_BILLING_ROLLOUT: 'production',
  DODO_API_ENVIRONMENT: 'live',
  EON_BILLING_DB: { prepare() {} },
  DODO_PAYMENTS_API_KEY: 'live_api_key_placeholder_for_unit_test',
  DODO_WEBHOOK_SECRET: 'whsec_unit_test_secret',
  EON_ENTITLEMENT_SIGNING_KEY: 'entitlement_unit_test_secret',
  DODO_PRODUCT_PLUS: 'pdt_0Nis1ygG50cHTUTsp7Gwa',
  DODO_PRODUCT_STUDIO: 'pdt_0Nis7CRUoZ9B0QfEzQ1w3',
  DODO_PRODUCT_POWER: 'pdt_0Nis7RsQydyq2vm7Yn5i0',
  DODO_PRODUCT_MAX: 'pdt_0Nis7lrISs3fLPlO5t39E',
  DODO_PRODUCT_PRO: 'pdt_0NlZKlIoQ2A6bSFNbBwMk',
  DODO_PRODUCT_ULTRA: 'pdt_0NlZLXhMLMnLeFkxNZMSw',
  DODO_PRODUCT_ULTIMATE: 'pdt_0NlZMVaq84ItJEM2lPSrZ',
  EON_PREMIUM_CHECKOUT_ROLLOUT: 'production'
};

function base64(bytes) {
  let output = '';
  for (const byte of bytes) output += String.fromCharCode(byte);
  return btoa(output);
}

async function signWebhook({ id, timestamp, payload, secret }) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
  return base64(new Uint8Array(signature));
}

test('W621 validates configured live Dodo/Cloudflare rollout contract', () => {
  assert.equal(validateW621LiveDodoRolloutContract().ok, true);
  const checklist = buildW621LiveRolloutChecklist();
  assert.equal(checklist.cloudflare.rollout, 'production');
  assert.equal(checklist.dodoProducts.plus.priceUsd, 4.99);
  assert.equal(checklist.dodoProducts.max.priceUsd, 49.99);
  assert.equal(Object.keys(checklist.dodoProducts).length, 7);
  assert.equal(checklist.dodoProducts.pro.priceUsd, 99);
  assert.equal(checklist.dodoProducts.ultra.priceUsd, 199);
  assert.equal(checklist.dodoProducts.ultimate.priceUsd, 1299);
  assert.equal(checklist.dodoProducts.ultimate.billingType, 'one-time');
  assert.equal(checklist.dodoProducts.ultimate.trialDays, 0);
  assert.ok(checklist.codexMustProve.includes('Dodo checkout URL returned for all seven paid products'));
});

test('W621 billing config requires Dodo secrets, products and D1 binding', () => {
  const config = getDodoBillingConfig(env);
  assert.equal(config.liveReady, true, config.missing.join('\n'));
  assert.equal(config.rollout, 'production');
  assert.equal(config.trialDays, 7);
  assert.equal(config.apiEnvironment, 'live');
  assert.equal(config.apiBase, 'https://live.dodopayments.com');
  assert.equal(getTierForDodoProductId(env.DODO_PRODUCT_POWER, env), 'power');
});


test('W621 testing rollout uses Dodo test mode and rejects an explicit live-mode mismatch', () => {
  const testing = getDodoBillingConfig({ ...env, EON_BILLING_ROLLOUT: 'testing', DODO_API_ENVIRONMENT: 'test' });
  assert.equal(testing.liveReady, true, testing.missing.join('\n'));
  assert.equal(testing.apiEnvironment, 'test');
  assert.equal(testing.apiBase, 'https://test.dodopayments.com');
  const mismatch = getDodoBillingConfig({ ...env, EON_BILLING_ROLLOUT: 'testing', DODO_API_ENVIRONMENT: 'live' });
  assert.equal(mismatch.liveReady, false);
  assert.ok(mismatch.missing.includes('DODO_API_ENVIRONMENT'));
});

test('W621 checkout requests map paid tiers to product ids and reject browser claims', () => {
  const plus = normalizeCheckoutRequest({ tier: 'plus', idempotencyKey: 'checkout:plus:test-1' }, env);
  assert.equal(plus.ok, true, plus.errors.join('\n'));
  assert.equal(plus.productId, env.DODO_PRODUCT_PLUS);
  const rejected = normalizeCheckoutRequest({ tier: 'max', idempotencyKey: 'checkout:max:test-1', browserEntitlementClaim: true }, env);
  assert.equal(rejected.ok, false);
  assert.match(rejected.errors.join(' '), /Browser payment|entitlement/i);
  assert.equal(W621_TRIAL_DAYS, 7);
});

test('W621 verifies Standard Webhooks-style signatures without exposing secrets', async () => {
  const payload = JSON.stringify({ type: 'payment.succeeded', timestamp: new Date().toISOString(), data: { metadata: { eon_account_id: 'acc_1', eon_tier_id: 'plus' } } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const id = 'wh_test_1';
  const signature = await signWebhook({ id, timestamp, payload, secret: env.DODO_WEBHOOK_SECRET });
  const ok = await verifyDodoWebhookSignature({ rawPayload: payload, headers: { 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': signature }, secret: env.DODO_WEBHOOK_SECRET });
  assert.equal(ok.ok, true, ok.reason);
  const bad = await verifyDodoWebhookSignature({ rawPayload: payload, headers: { 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': 'bad' }, secret: env.DODO_WEBHOOK_SECRET });
  assert.equal(bad.ok, false);
});

test('W621 normalizes Dodo webhook event payloads to server ledger events', () => {
  const event = normalizeDodoWebhookPayload({ type: 'subscription.plan_changed', timestamp: new Date().toISOString(), data: { subscription_id: 'sub_1', customer_id: 'cus_1', metadata: { eon_account_id: 'acc_1', eon_tier_id: 'max' } } }, env, 'wh_evt_1');
  assert.equal(event.providerEventId, 'wh_evt_1');
  assert.equal(event.eventType, 'plan_changed');
  assert.equal(event.accountId, 'acc_1');
  assert.equal(event.tierId, 'max');
  const refund = normalizeDodoWebhookPayload({ type: 'refund.succeeded', data: { metadata: { eon_account_id: 'acc_1', eon_tier_id: 'power' } } }, env, 'wh_evt_2');
  assert.equal(refund.eventType, 'payment_refunded');
});

test('W621 focused source gate passes', () => {
  const report = inspectW621LiveDodoCloudflareRolloutGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});

test('W621 maps Dodo subscription.failed separately from renewal on-hold', () => {
  const failed = normalizeDodoWebhookPayload({ type: 'subscription.failed', data: { metadata: { eon_account_id: 'acc_failed', eon_tier_id: 'pro' } } }, env, 'wh_evt_failed');
  const onHold = normalizeDodoWebhookPayload({ type: 'subscription.on_hold', data: { metadata: { eon_account_id: 'acc_hold', eon_tier_id: 'pro' } } }, env, 'wh_evt_hold');
  assert.equal(failed.eventType, 'subscription_failed');
  assert.equal(onHold.eventType, 'subscription_on_hold');
});
