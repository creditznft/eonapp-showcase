/**
 * W620 — Dodo dashboard/manual setup contract.
 *
 * Historical dashboard/setup authority retained by the current live billing
 * implementation. It now mirrors the unified EONAPP catalogue: six recurring
 * subscriptions plus the Ultimate one-time product. Secrets remain server-only.
 */
import { EON_SUBSCRIPTION_TIERS } from '../assets/js/referrals/eon-keys-catalog.js';
import { W619_DODO_ENV_CONTRACT, W619_RUNTIME_FLAGS } from './w619-dodo-server-ledger-contract.mjs';

export const W620_DODO_SETUP_SCHEMA = 'eonapp.billing.dodo-dashboard-setup.w620.v1';
export const W620_DODO_SETUP_VERSION = 1;

const freeze = (value) => Object.freeze(value);
const paidTiers = EON_SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free');

export const W620_DODO_PRODUCT_SETUP = freeze(paidTiers.map((tier) => freeze({
  tierId: tier.id,
  label: tier.billingType === 'one-time' ? `EONAPP ${tier.label}` : `EONAPP ${tier.label} Monthly`,
  priceUsd: tier.billingType === 'one-time' ? tier.oneTimeUsd : tier.monthlyUsd,
  priceInrReference: tier.monthlyInr || null,
  billingType: tier.billingType === 'one-time' ? 'one-time' : 'subscription-monthly',
  dashboardProductIdSecret: `DODO_PRODUCT_${tier.id.toUpperCase()}`,
  trialPublic: Boolean(tier.trialPublic),
  trialContextual: Boolean(tier.trialContextual),
  trialDaysRecommended: tier.billingType === 'subscription' ? 7 : 0,
  metadataRequired: freeze(['eon_tier_id', 'account_id_or_session_ref', 'referral_code_if_present']),
  adaptivePricingRecommended: true,
  hostedCheckoutOnly: true
})));

export const W620_DODO_WEBHOOK_ENDPOINT = freeze({
  previewPattern: 'https://<cloudflare-preview-host>/api/billing/webhooks/dodo',
  production: 'https://eonapp.ch/api/billing/webhooks/dodo',
  method: 'POST',
  acceptsRawBody: true,
  requiresHeaders: freeze(['webhook-id', 'webhook-signature', 'webhook-timestamp']),
  idempotencyHeader: 'webhook-id',
  signingSecretCloudflareName: 'DODO_WEBHOOK_SECRET'
});

export const W620_REQUIRED_DODO_WEBHOOK_EVENTS = freeze([
  'payment.succeeded',
  'payment.failed',
  'refund.succeeded',
  'refund.failed',
  'subscription.active',
  'subscription.updated',
  'subscription.on_hold',
  'subscription.renewed',
  'subscription.plan_changed',
  'subscription.cancelled',
  'subscription.failed',
  'subscription.expired',
  'dispute.opened',
  'dispute.lost',
  'dispute.accepted',
  'entitlement_grant.revoked'
]);

export const W620_CLOUDFLARE_SECRET_SETUP = freeze({
  secrets: freeze([
    'DODO_PAYMENTS_API_KEY',
    'DODO_API_KEY',
    'DODO_WEBHOOK_SECRET',
    'DODO_PRODUCT_PLUS',
    'DODO_PRODUCT_STUDIO',
    'DODO_PRODUCT_POWER',
    'DODO_PRODUCT_MAX',
    'DODO_PRODUCT_PRO',
    'DODO_PRODUCT_ULTRA',
    'DODO_PRODUCT_ULTIMATE',
    'EON_ENTITLEMENT_SIGNING_KEY'
  ]),
  vars: freeze({ EON_BILLING_ROLLOUT: 'disabled|testing|production' }),
  bindings: freeze([
    freeze({ name: 'EON_BILLING_DB', type: 'D1', requiredBeforeLive: true })
  ]),
  forbiddenPrefixesInFrontend: freeze(['VITE_DODO_', 'PUBLIC_DODO_', 'NEXT_PUBLIC_DODO_']),
  neverPasteIntoChat: freeze(['DODO_PAYMENTS_API_KEY', 'DODO_WEBHOOK_SECRET', 'EON_ENTITLEMENT_SIGNING_KEY'])
});

export const W620_DODO_EVENT_TO_LEDGER_EVENT = freeze({
  'payment.succeeded': 'payment_succeeded',
  'subscription.active': 'subscription_active',
  'subscription.renewed': 'subscription_renewed',
  'subscription.plan_changed': 'subscription_plan_changed',
  'subscription.cancelled': 'subscription_cancelled',
  'subscription.expired': 'subscription_expired',
  'subscription.failed': 'subscription_failed',
  'subscription.on_hold': 'subscription_on_hold',
  'payment.failed': 'payment_failed',
  'refund.succeeded': 'payment_refunded',
  'refund.failed': 'refund_failed',
  'dispute.opened': 'chargeback_opened',
  'dispute.lost': 'chargeback_lost',
  'dispute.accepted': 'chargeback_accepted',
  'entitlement_grant.revoked': 'entitlement_grant_revoked'
});

export function mapDodoWebhookTypeToW620LedgerEvent(type = '') {
  const eventType = String(type || '').trim().toLowerCase();
  return freeze({
    schema: W620_DODO_SETUP_SCHEMA,
    inputType: eventType,
    ledgerEventType: W620_DODO_EVENT_TO_LEDGER_EVENT[eventType] || '',
    recognized: Boolean(W620_DODO_EVENT_TO_LEDGER_EVENT[eventType]),
    grantsAccess: ['payment.succeeded', 'subscription.active', 'subscription.renewed'].includes(eventType),
    revokesOrBlocksAccess: ['refund.succeeded', 'dispute.opened', 'dispute.lost', 'subscription.cancelled', 'subscription.expired', 'subscription.failed', 'subscription.on_hold', 'entitlement_grant.revoked'].includes(eventType),
    requiresIdempotency: true,
    requiresSignatureVerification: true
  });
}

export function buildW620DodoOwnerChecklist({ includeProduction = false } = {}) {
  return freeze({
    schema: W620_DODO_SETUP_SCHEMA,
    mode: includeProduction ? 'production-after-preview-proof' : 'test-preview-first',
    productsToCreate: W620_DODO_PRODUCT_SETUP,
    webhookEndpoint: includeProduction ? W620_DODO_WEBHOOK_ENDPOINT.production : W620_DODO_WEBHOOK_ENDPOINT.previewPattern,
    webhookEventsToEnable: W620_REQUIRED_DODO_WEBHOOK_EVENTS,
    cloudflareSecrets: W620_CLOUDFLARE_SECRET_SETUP.secrets,
    cloudflareVars: W620_CLOUDFLARE_SECRET_SETUP.vars,
    cloudflareBindings: W620_CLOUDFLARE_SECRET_SETUP.bindings,
    checkoutEndpoint: '/api/billing/checkout',
    statusEndpoint: '/api/billing/status',
    referralStatusEndpoint: '/api/billing/referral-status',
    currentRuntimeFlags: W619_RUNTIME_FLAGS,
    keepDisabledUntilProof: true,
    ownerMustNotPasteSecretsIntoChat: true
  });
}

export function validateW620DodoDashboardSetupContract() {
  const errors = [];
  if (W620_DODO_PRODUCT_SETUP.length !== 7) errors.push('Dodo setup must include Plus, Studio, Power, Max, Pro, Ultra and Ultimate products.');
  for (const product of W620_DODO_PRODUCT_SETUP) {
    if (!/^DODO_PRODUCT_(PLUS|STUDIO|POWER|MAX|PRO|ULTRA|ULTIMATE)$/.test(product.dashboardProductIdSecret)) errors.push(`Unexpected product secret name: ${product.dashboardProductIdSecret}`);
    if (product.priceUsd < 1) errors.push(`Dodo subscription product price is below documented minimum for ${product.tierId}.`);
    if (!product.metadataRequired.includes('eon_tier_id')) errors.push(`Missing eon_tier_id metadata for ${product.tierId}.`);
  }
  for (const required of ['payment.succeeded', 'subscription.active', 'subscription.renewed', 'subscription.cancelled', 'subscription.expired', 'refund.succeeded', 'dispute.opened']) {
    if (!W620_REQUIRED_DODO_WEBHOOK_EVENTS.includes(required)) errors.push(`Missing required webhook event: ${required}`);
  }
  for (const header of ['webhook-id', 'webhook-signature', 'webhook-timestamp']) {
    if (!W620_DODO_WEBHOOK_ENDPOINT.requiresHeaders.includes(header)) errors.push(`Missing required webhook header: ${header}`);
  }
  for (const secret of W619_DODO_ENV_CONTRACT.forbiddenInFrontend) {
    if (String(secret).startsWith('DODO_') && !W620_CLOUDFLARE_SECRET_SETUP.secrets.includes(secret) && !(secret === 'DODO_API_KEY' && W620_CLOUDFLARE_SECRET_SETUP.secrets.includes('DODO_PAYMENTS_API_KEY'))) {
      errors.push(`W619 frontend-forbidden Dodo secret not represented for Cloudflare setup: ${secret}`);
    }
  }
  if (W620_CLOUDFLARE_SECRET_SETUP.secrets.some((secret) => /^VITE_|^PUBLIC_|^NEXT_PUBLIC_/.test(secret))) errors.push('Dodo secrets must not be frontend/public variables.');
  const activeFlags = Object.entries(W619_RUNTIME_FLAGS).filter(([, value]) => value !== false);
  if (activeFlags.length) errors.push(`W619 runtime flag unexpectedly active: ${activeFlags.map(([key]) => key).join(', ')}`);
  const mapped = mapDodoWebhookTypeToW620LedgerEvent('subscription.active');
  if (!mapped.recognized || !mapped.grantsAccess) errors.push('subscription.active must map to an access-granting ledger event.');
  const revoked = mapDodoWebhookTypeToW620LedgerEvent('refund.succeeded');
  if (!revoked.recognized || !revoked.revokesOrBlocksAccess) errors.push('refund.succeeded must map to a revocation ledger event.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: W620_DODO_SETUP_SCHEMA, checks: 18 });
}

export default freeze({
  W620_DODO_PRODUCT_SETUP,
  W620_DODO_WEBHOOK_ENDPOINT,
  W620_REQUIRED_DODO_WEBHOOK_EVENTS,
  W620_CLOUDFLARE_SECRET_SETUP,
  mapDodoWebhookTypeToW620LedgerEvent,
  buildW620DodoOwnerChecklist,
  validateW620DodoDashboardSetupContract
});
