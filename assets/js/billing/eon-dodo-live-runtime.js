import { assertD1SchemaAuthority } from '../infrastructure/eon-d1-schema-authority.js';
import { EON_KEYS_REFERRAL_POLICY, EON_PAID_TIER_IDS, EON_SUBSCRIPTION_TRIAL_DAYS, getEonPaidSubscriptionPlans } from '../commerce/eon-commercial-catalog.js';
import { applyReferralBillingSignal, getReferralRuntimeConfig, resolveReferralDatabase } from '../referrals/eon-referral-server-runtime.js';
import { buildBillingPublicState, deriveBillingTransition, normalizeBillingLifecycleEvent, safeBillingLink } from './eon-billing-lifecycle.js';
import { prepareBillingCommand, reconcileBillingCommandFromWebhook, updateBillingCommand } from './eon-billing-command-ledger.js';
import { EON_REQUEST_LIMITS, isJsonContentType, readBoundedText, safeDodoUrl } from '../../../functions/_shared/eon-request-security.js';
import { pruneEonPushSubscriptionsToPolicy, resolveEonPushDevicePolicy } from '../../../functions/_shared/eon-push-device-policy.js';
import { applySoftwareGrantEventToD1, readSoftwareGrantByPaymentRef } from './eon-premium-software-grant-ledger.js';
import { recordGrowthAccountLifecycle } from '../../../functions/_shared/eon-growth-attribution.js';

/**
 * W621/W628 — Dodo live billing runtime for Cloudflare Pages Functions.
 *
 * Server-only. Checkout attempts are written before the provider call. Signed
 * provider webhooks are the sole entitlement authority. Duplicate delivery can
 * repair an interrupted write and out-of-order events never overwrite newer
 * lifecycle state.
 */
export const W621_DODO_LIVE_SCHEMA = 'eonapp.billing.dodo-live-runtime.w621.v1';
export const W628_DODO_LIFECYCLE_SCHEMA = 'eonapp.billing.dodo-lifecycle.w628.v1';
export const W621_DODO_LIVE_API_BASE = 'https://live.dodopayments.com';
export const W621_DODO_TEST_API_BASE = 'https://test.dodopayments.com';
export const W621_ALLOWED_ROLLOUTS = Object.freeze(['testing', 'production']);
export const W621_TRIAL_DAYS = EON_SUBSCRIPTION_TRIAL_DAYS;

const CORE_PAID_TIERS = EON_PAID_TIER_IDS;
const SUPPORTED_SUBSCRIPTION_TIERS = CORE_PAID_TIERS;
const SAFE_TEXT = /[^a-zA-Z0-9._:@/?=&%-]/g;
const encoder = new TextEncoder();
function cleanText(value = '', max = 256) { return String(value || '').trim().replace(SAFE_TEXT, '').slice(0, max); }
function cleanTier(value = '') { const tier = cleanText(value, 24).toLowerCase(); return SUPPORTED_SUBSCRIPTION_TIERS.includes(tier) ? tier : ''; }
function nowMs() { return Date.now(); }
function attemptId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return cleanText(`billing_${globalThis.crypto.randomUUID()}`, 128);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return cleanText(`billing_${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')}`, 128);
  }
  throw new Error('secure-billing-id-unavailable');
}
function toHex(bytes) { return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
function toBase64(bytes) { let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
function toBase64Url(bytes) { return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function timingSafeEqual(left = '', right = '') { const a = String(left || ''); const b = String(right || ''); const length = Math.max(a.length, b.length); let mismatch = a.length ^ b.length; for (let i = 0; i < length; i += 1) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return mismatch === 0; }
async function hmacSha256Bytes(message = '', secret = '') { const key = await crypto.subtle.importKey('raw', encoder.encode(String(secret || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(String(message || '')))); }
async function sha256Hex(value = '') { return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(value || ''))))); }
function signatureCandidates(signature = '') { const raw = String(signature || '').trim(); if (!raw) return []; const output = new Set([raw]); for (const part of raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean)) { output.add(part); const separator = part.indexOf('='); if (separator > 0) output.add(part.slice(separator + 1)); } return [...output].filter(Boolean); }

export function getDodoProductMap(env = {}) {
  return Object.freeze({
    plus: cleanText(env.DODO_PRODUCT_PLUS || '', 96),
    studio: cleanText(env.DODO_PRODUCT_STUDIO || '', 96),
    power: cleanText(env.DODO_PRODUCT_POWER || '', 96),
    max: cleanText(env.DODO_PRODUCT_MAX || '', 96),
    pro: cleanText(env.DODO_PRODUCT_PRO || '', 96),
    ultra: cleanText(env.DODO_PRODUCT_ULTRA || '', 96)
  });
}
export function getDodoApiEnvironment(env = {}, rolloutHint = '') {
  const rollout = cleanText(rolloutHint || env.EON_BILLING_ROLLOUT || '', 24).toLowerCase();
  const explicit = cleanText(env.DODO_API_ENVIRONMENT || '', 16).toLowerCase();
  const expected = rollout === 'production' ? 'live' : 'test';
  const environment = ['test', 'live'].includes(explicit) ? explicit : expected;
  return Object.freeze({ environment, expected, explicit: explicit || null, valid: environment === expected, apiBase: environment === 'test' ? W621_DODO_TEST_API_BASE : W621_DODO_LIVE_API_BASE });
}
export function getPremiumDodoProductMap(env = {}) {
  // Only Ultimate has a separate software-grant lifecycle. Pro and Ultra are
  // ordinary recurring subscriptions and stay on the same Dodo lifecycle as
  // Plus through Max.
  return Object.freeze({ ultimate: cleanText(env.DODO_PRODUCT_ULTIMATE || '', 96) });
}
export function getAllDodoProductMap(env = {}) { return Object.freeze({ ...getDodoProductMap(env), ...getPremiumDodoProductMap(env) }); }
export function getTierForDodoProductId(productId = '', env = {}) { const safe = cleanText(productId, 96); return Object.entries(getAllDodoProductMap(env)).find(([, value]) => value && value === safe)?.[0] || ''; }
export function getDodoBillingConfig(env = {}) {
  const rollout = cleanText(env.EON_BILLING_ROLLOUT || '', 24).toLowerCase();
  const productMap = getDodoProductMap(env);
  const apiEnvironment = getDodoApiEnvironment(env, rollout);
  const missing = [];
  if (!W621_ALLOWED_ROLLOUTS.includes(rollout)) missing.push('EON_BILLING_ROLLOUT');
  if (W621_ALLOWED_ROLLOUTS.includes(rollout) && !apiEnvironment.valid) missing.push('DODO_API_ENVIRONMENT');
  if (!env.EON_BILLING_DB) missing.push('EON_BILLING_DB');
  if (!String(env.DODO_PAYMENTS_API_KEY || env.DODO_API_KEY || '').trim()) missing.push('DODO_PAYMENTS_API_KEY');
  if (!String(env.DODO_WEBHOOK_SECRET || '').trim()) missing.push('DODO_WEBHOOK_SECRET');
  if (!String(env.EON_ENTITLEMENT_SIGNING_KEY || '').trim()) missing.push('EON_ENTITLEMENT_SIGNING_KEY');
  for (const tier of CORE_PAID_TIERS) if (!productMap[tier]) missing.push(`DODO_PRODUCT_${tier.toUpperCase()}`);
  return Object.freeze({ schema: W628_DODO_LIFECYCLE_SCHEMA, liveReady: missing.length === 0, rollout: W621_ALLOWED_ROLLOUTS.includes(rollout) ? rollout : 'disabled', missing: Object.freeze(missing), productMap, apiEnvironment: apiEnvironment.environment, apiBase: apiEnvironment.apiBase, trialDays: W621_TRIAL_DAYS });
}

export async function ensureBillingSchema(database) {
  if (!database?.prepare) throw new Error('billing_db_missing');
  await assertD1SchemaAuthority(database, 'billing');
  return Object.freeze({ ok: true, schema: W628_DODO_LIFECYCLE_SCHEMA, migrationOnly: true });
}

export async function readAccountEntitlement(database, accountId = '') {
  const account = cleanText(accountId, 80); if (!database?.prepare || !account) return null;
  await ensureBillingSchema(database);
  return (await database.prepare(`SELECT account_id, tier_id, status, provider_customer_ref, provider_subscription_ref, source_event_id, updated_at, renews_at, revoked_at, reason FROM eon_entitlements WHERE account_id = ? LIMIT 1`).bind(account).first()) || null;
}
export async function readAccountBillingLifecycle(database, accountId = '') {
  const account = cleanText(accountId, 80); if (!database?.prepare || !account) return null;
  await ensureBillingSchema(database);
  return (await database.prepare(`SELECT account_id, tier_id, access_status, provider_status, provider_customer_ref, provider_subscription_ref, payment_ref, checkout_attempt_id, cancel_at_period_end, current_period_end, trial_ends_at, grace_ends_at, last_invoice_url, last_receipt_url, source_event_id, source_event_type, source_occurred_at, reason, updated_at FROM eon_billing_lifecycle WHERE account_id = ? LIMIT 1`).bind(account).first()) || null;
}
export async function recordBillingActionAudit(database, { actionId = attemptId(), accountId = '', actionType = '', requestedTierId = '', providerSubscriptionRef = '', resultStatus = '', providerHttpStatus = 0 } = {}) {
  await ensureBillingSchema(database);
  await database.prepare(`INSERT INTO eon_billing_action_audit (action_id, account_id, action_type, requested_tier_id, provider_subscription_ref, result_status, provider_http_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(cleanText(actionId, 128), cleanText(accountId, 80), cleanText(actionType, 48), cleanTier(requestedTierId) || null, cleanText(providerSubscriptionRef, 128) || null, cleanText(resultStatus, 80), Number(providerHttpStatus || 0) || null, nowMs()).run();
  return Object.freeze({ ok: true, actionId: cleanText(actionId, 128) });
}

function buildPublicEntitlement(entitlement = null) {
  if (!entitlement || typeof entitlement !== 'object') return null;
  return Object.freeze({
    tier_id: cleanTier(entitlement.tier_id) || 'free',
    status: cleanText(entitlement.status || 'free', 48),
    renews_at: Number(entitlement.renews_at || 0) || null,
    revoked_at: Number(entitlement.revoked_at || 0) || null,
    reason: cleanText(entitlement.reason || '', 64),
    updated_at: entitlement.updated_at ?? null
  });
}

export function buildBillingStatusPayload(env = {}, accountId = '', entitlement = null, lifecycle = null, trialEligibility = null) {
  const config = getDodoBillingConfig(env); const referral = getReferralRuntimeConfig(env); const publicState = buildBillingPublicState(entitlement, lifecycle);
  return Object.freeze({
    schema: W628_DODO_LIFECYCLE_SCHEMA, ok: true, rollout: config.rollout, checkoutActive: config.liveReady, trialActive: config.liveReady,
    dodoWebhookAdapterLive: config.liveReady, entitlementLedgerWriteEnabled: config.liveReady, lifecycleLedgerWriteEnabled: config.liveReady,
    customerPortalActive: config.liveReady && publicState.providerCustomerAvailable, subscriptionActionsActive: config.liveReady && publicState.providerSubscriptionAvailable,
    referralLedgerWriteEnabled: referral.active, eonKeyRedemptionActive: referral.active,
    referralPolicy: Object.freeze({ rewardCurrency: EON_KEYS_REFERRAL_POLICY.rewardCurrency, subscriptionDiscounts: false, subscriptionRenewalCredits: false, freeSubscriptionTiers: false, wholeTierEntitlements: false, unlockScope: EON_KEYS_REFERRAL_POLICY.unlockScope }),
    browserUnlockAllowed: false, paidTiers: CORE_PAID_TIERS,
    plans: Object.freeze(getEonPaidSubscriptionPlans().map((plan) => Object.freeze({ id: plan.id, label: plan.label, monthlyUsd: plan.monthlyUsd, currency: plan.currency, interval: plan.interval, trialDays: plan.trialDays }))),
    trialDays: W621_TRIAL_DAYS,
    configured: Object.freeze({ d1: Boolean(env.EON_BILLING_DB), dodoApiKey: Boolean(String(env.DODO_PAYMENTS_API_KEY || env.DODO_API_KEY || '').trim()), webhookSecret: Boolean(String(env.DODO_WEBHOOK_SECRET || '').trim()), entitlementSigningKey: Boolean(String(env.EON_ENTITLEMENT_SIGNING_KEY || '').trim()), products: Object.freeze(Object.fromEntries(CORE_PAID_TIERS.map((tier) => [tier, Boolean(config.productMap[tier])]))) }),
    missing: config.missing,
    account: accountId ? Object.freeze({ signedIn: true, trialEligible: trialEligibility !== false, entitlement: buildPublicEntitlement(entitlement), billing: publicState }) : Object.freeze({ signedIn: false, trialEligible: null, entitlement: null, billing: publicState }),
    message: config.liveReady ? 'Dodo billing is configured. Access changes only after a verified provider webhook updates the server ledger.' : 'Dodo billing runtime is not fully configured.'
  });
}

function safeReturnUrl(request, path = '/billing') { const origin = new URL(request.url).origin; return `${origin}${String(path || '/billing').startsWith('/') ? path : '/billing'}`; }
function normalizeCheckoutReturnPath(value = '', fallback = '/billing') {
  const raw = cleanText(value || fallback, 180);
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  try {
    const parsed = new URL(raw, 'https://eonapp.invalid');
    if (!['/billing', '/eoncity'].includes(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch { return fallback; }
}
export function normalizeCheckoutRequest(input = {}, env = {}) {
  const tier = cleanTier(input.tier || input.tierId || '');
  const productId = tier ? getDodoProductMap(env)[tier] : '';
  const idempotencyKey = cleanText(input.idempotencyKey || '', 180);
  const errors = [];
  if (!tier) errors.push('Invalid or missing paid tier.');
  if (!productId) errors.push('Missing Dodo product id for requested tier.');
  if (!/^[a-zA-Z0-9:_-]{8,180}$/.test(idempotencyKey)) errors.push('A valid idempotency key is required.');
  if (input.browserEntitlementClaim || input.clientPaymentCallback) errors.push('Browser payment or entitlement claims are not accepted.');
  const returnPath = normalizeCheckoutReturnPath(input.returnPath, '/billing?checkout=return');
  const cancelPath = normalizeCheckoutReturnPath(input.cancelPath, '/billing?checkout=cancelled');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), tier, productId, idempotencyKey, returnPath, cancelPath });
}

export async function createDodoCheckoutSession({ request, env, accountId, input = {}, fetchImpl = globalThis.fetch }) {
  const config = getDodoBillingConfig(env);
  if (!config.liveReady) return Object.freeze({ ok: false, status: 'not_configured', errors: config.missing });
  const normalized = normalizeCheckoutRequest(input, env);
  if (!normalized.ok) return Object.freeze({ ok: false, status: 'invalid_request', errors: normalized.errors });
  let prepared;
  try {
    await ensureBillingSchema(env.EON_BILLING_DB);
    prepared = await prepareBillingCommand(env.EON_BILLING_DB, {
      accountId,
      operation: 'checkout',
      requestedTierId: normalized.tier,
      idempotencyKey: normalized.idempotencyKey,
      statePrecondition: 'no-active-subscription'
    });
  } catch {
    return Object.freeze({ ok: false, status: 'checkout_ledger_unavailable', retryable: true });
  }
  if (!prepared.ok) return Object.freeze({ ok: false, status: prepared.status, duplicate: prepared.duplicate === true, command: prepared.command });
  if (prepared.duplicate) {
    const redirect = safeDodoUrl(prepared.providerRedirectUrl || '');
    return Object.freeze({
      ok: Boolean(redirect),
      status: redirect ? 'checkout_created' : prepared.status,
      duplicate: true,
      checkoutUrl: redirect,
      checkoutAttemptId: prepared.command?.commandId || '',
      trialDays: prepared.command?.trialDays || 0,
      entitlementGranted: false,
      webhookRequired: true,
      command: prepared.command
    });
  }
  const id = prepared.command.commandId;
  const createdAt = nowMs();
  try {
    await env.EON_BILLING_DB.prepare(`INSERT INTO eon_billing_checkout_sessions (attempt_id, account_id, tier_id, product_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'creating', ?, ?)`)
      .bind(id, cleanText(accountId, 80), normalized.tier, normalized.productId, createdAt, createdAt).run();
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'provider_pending', resultStatus: 'creating_checkout' });
  } catch {
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', resultStatus: 'checkout_ledger_unavailable', errorCode: 'checkout_session_write_failed' }).catch(() => null);
    return Object.freeze({ ok: false, status: 'checkout_ledger_unavailable', retryable: true, checkoutAttemptId: id });
  }
  const trialDays = prepared.command.trialDays;
  const payload = {
    product_cart: [{ product_id: normalized.productId, quantity: 1 }],
    return_url: safeReturnUrl(request, normalized.returnPath),
    cancel_url: safeReturnUrl(request, normalized.cancelPath),
    subscription_data: { trial_period_days: trialDays },
    metadata: {
      eon_schema: W628_DODO_LIFECYCLE_SCHEMA,
      eon_account_id: accountId,
      eon_tier_id: normalized.tier,
      eon_checkout_attempt_id: id,
      eon_billing_command_id: id,
      eon_trial_days: String(trialDays),
      eon_source: 'cloudflare-pages-functions'
    }
  };
  let response; let body = null;
  try {
    response = await fetchImpl(`${config.apiBase}/checkouts`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${String(env.DODO_PAYMENTS_API_KEY || env.DODO_API_KEY || '').trim()}`,
        'content-type': 'application/json',
        accept: 'application/json',
        'idempotency-key': normalized.idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    try { body = await response.json(); } catch { body = null; }
  } catch {
    await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET status = 'failed', error_code = 'provider_network_error', updated_at = ? WHERE attempt_id = ?`).bind(nowMs(), id).run();
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', resultStatus: 'provider_network_error', errorCode: 'provider_network_error' });
    return Object.freeze({ ok: false, status: 'dodo_checkout_failed', error: 'provider_network_error', retryable: true, checkoutAttemptId: id });
  }
  if (!response.ok || !body?.checkout_url) {
    const error = cleanText(body?.error || body?.message || 'checkout_failed', 180);
    await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET status = 'failed', error_code = ?, updated_at = ? WHERE attempt_id = ?`).bind(error, nowMs(), id).run();
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', providerHttpStatus: response.status, resultStatus: 'provider_rejected', errorCode: error });
    return Object.freeze({ ok: false, status: 'dodo_checkout_failed', httpStatus: response.status, error, checkoutAttemptId: id });
  }
  const sessionId = cleanText(body.checkout_id || body.session_id || body.id || '', 128);
  const checkoutUrl = safeDodoUrl(body.checkout_url || '');
  if (!checkoutUrl) {
    await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET status = 'failed', error_code = 'untrusted_checkout_url', updated_at = ? WHERE attempt_id = ?`).bind(nowMs(), id).run();
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', providerHttpStatus: 502, resultStatus: 'untrusted_checkout_url', errorCode: 'untrusted_checkout_url' });
    return Object.freeze({ ok: false, status: 'dodo_checkout_failed', httpStatus: 502, error: 'untrusted_checkout_url', checkoutAttemptId: id });
  }
  await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET provider_session_ref = ?, status = 'created', updated_at = ? WHERE attempt_id = ?`).bind(sessionId || null, nowMs(), id).run();
  const command = await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'provider_accepted', providerObjectRef: sessionId, providerRedirectUrl: checkoutUrl, providerHttpStatus: response.status, resultStatus: 'checkout_created' });
  return Object.freeze({ ok: true, status: 'checkout_created', duplicate: false, tier: normalized.tier, trialDays, checkoutUrl, checkoutAttemptId: id, entitlementGranted: false, webhookRequired: true, command });
}

async function computeWebhookSignatures(webhookId = '', webhookTimestamp = '', rawPayload = '', secret = '') { const bytes = await hmacSha256Bytes(`${webhookId}.${webhookTimestamp}.${rawPayload}`, secret); return Object.freeze([toHex(bytes), toBase64(bytes), toBase64Url(bytes)]); }
export async function verifyDodoWebhookSignature({ rawPayload = '', headers = {}, secret = '', toleranceSeconds = 600 }) {
  const webhookId = cleanText(headers['webhook-id'] || headers.get?.('webhook-id') || '', 160); const signature = String(headers['webhook-signature'] || headers.get?.('webhook-signature') || '').trim(); const timestamp = cleanText(headers['webhook-timestamp'] || headers.get?.('webhook-timestamp') || '', 40); const seconds = Number(timestamp);
  if (!webhookId || !signature || !timestamp || !secret) return Object.freeze({ ok: false, reason: 'missing_webhook_signature_headers', webhookId });
  if (!Number.isFinite(seconds)) return Object.freeze({ ok: false, reason: 'invalid_webhook_timestamp', webhookId });
  const age = Math.abs(Math.floor(Date.now() / 1000) - seconds); if (age > toleranceSeconds) return Object.freeze({ ok: false, reason: 'stale_webhook_timestamp', webhookId, ageSeconds: age });
  const expected = await computeWebhookSignatures(webhookId, timestamp, rawPayload, secret); const candidates = signatureCandidates(signature); const ok = expected.some((value) => candidates.some((candidate) => timingSafeEqual(candidate, value)));
  return Object.freeze({ ok, reason: ok ? 'verified' : 'signature_mismatch', webhookId });
}
function walkFind(value, keys, depth = 0) { if (depth > 7 || value == null || typeof value !== 'object') return ''; for (const key of keys) if (Object.prototype.hasOwnProperty.call(value, key) && value[key] != null && typeof value[key] !== 'object') return cleanText(value[key], 200); for (const child of Object.values(value)) { const found = walkFind(child, keys, depth + 1); if (found) return found; } return ''; }
function walkBool(value, keys, depth = 0) { if (depth > 7 || value == null || typeof value !== 'object') return false; for (const key of keys) if (Object.prototype.hasOwnProperty.call(value, key)) return value[key] === true; for (const child of Object.values(value)) if (walkBool(child, keys, depth + 1)) return true; return false; }
function premiumCheckoutRollout(env = {}) { const value = cleanText(env.EON_PREMIUM_CHECKOUT_ROLLOUT || '', 24).toLowerCase(); return ['testing', 'production'].includes(value) ? value : 'disabled'; }
function extractDodoMetadata(payload = {}) { const data = payload?.data && typeof payload.data === 'object' ? payload.data : {}; return data?.metadata && typeof data.metadata === 'object' ? data.metadata : (payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}); }
export function detectDodoPremiumProduct(payload = {}, env = {}) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const metadata = extractDodoMetadata(payload);
  const productId = cleanText(walkFind(data, ['product_id', 'productId']), 96);
  const configured = getPremiumDodoProductMap(env);
  const productTier = configured.ultimate && configured.ultimate === productId ? 'ultimate' : '';
  const metadataTier = cleanText(metadata.eon_tier_id || metadata.tier_id || '', 24).toLowerCase();
  const tier = productTier || (metadataTier === 'ultimate' ? 'ultimate' : '');
  return Object.freeze({
    premium: tier === 'ultimate',
    tier,
    productId,
    configuredProductId: tier ? configured[tier] || '' : '',
    verifiedProductMatch: Boolean(tier && productId && configured[tier] && configured[tier] === productId),
    checkoutAttemptId: cleanText(metadata.eon_checkout_attempt_id || walkFind(data, ['eon_checkout_attempt_id']), 128),
    accountId: cleanText(metadata.eon_account_id || metadata.account_id || walkFind(data, ['eon_account_id', 'account_id']), 80),
    paymentRef: cleanText(walkFind(data, ['payment_id', 'paymentId']), 160),
    orderRef: cleanText(walkFind(data, ['order_id', 'orderId', 'checkout_id', 'checkoutId']), 160)
  });
}
function ultimateEventType(rawType = '') {
  const type = cleanText(rawType, 80).toLowerCase();
  if (type === 'payment.succeeded') return 'grant';
  if (['refund.succeeded', 'dispute.opened', 'dispute.lost', 'dispute.expired', 'dispute.accepted'].includes(type)) return 'revoke';
  if (type === 'dispute.won') return 'restore';
  return 'ignored';
}
function normalizeUltimateSoftwareGrantEvent(payload = {}, premium = {}, webhookId = '') {
  const rawType = cleanText(payload?.type || '', 80).toLowerCase();
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const metadata = extractDodoMetadata(payload);
  const paymentRef = premium.paymentRef || cleanText(walkFind(data, ['payment_id', 'paymentId']), 160);
  const orderRef = premium.orderRef || cleanText(walkFind(data, ['order_id', 'orderId', 'checkout_id', 'checkoutId']), 160) || paymentRef;
  const occurredAt = Date.parse(payload?.timestamp || data?.updated_at || data?.created_at || '') || nowMs();
  const eventType = ultimateEventType(rawType);
  return Object.freeze({
    providerEventId: cleanText(webhookId || payload?.id || payload?.event_id || walkFind(payload, ['event_id', 'id']), 160),
    rawEventType: rawType,
    eventType,
    accountId: premium.accountId || cleanText(metadata.eon_account_id || metadata.account_id, 80),
    bundleId: 'ultimate',
    sourceOrderRef: orderRef,
    sourcePaymentRef: paymentRef,
    occurredAt,
    revocationReason: eventType === 'revoke' ? rawType.replace(/[^a-z0-9._-]/g, '-') : ''
  });
}
function eventTypeToLedgerType(type = '') {
  const map = { 'subscription.active': 'subscription_active', 'subscription.updated': 'subscription_updated', 'subscription.renewed': 'subscription_renewed', 'subscription.plan_changed': 'plan_changed', 'payment.succeeded': 'payment_succeeded', 'subscription.cancelled': 'subscription_cancelled', 'subscription.expired': 'subscription_expired', 'subscription.failed': 'subscription_failed', 'subscription.on_hold': 'subscription_on_hold', 'payment.failed': 'payment_failed', 'payment.cancelled': 'payment_failed', 'refund.succeeded': 'payment_refunded', 'refund.failed': 'refund_failed', 'dispute.opened': 'chargeback_opened', 'dispute.lost': 'chargeback_lost', 'dispute.expired': 'chargeback_lost', 'dispute.accepted': 'chargeback_lost', 'dispute.won': 'chargeback_won', 'entitlement_grant.revoked': 'payment_refunded' };
  return map[cleanText(type, 80).toLowerCase()] || 'ignored';
}
export function normalizeDodoWebhookPayload(payload = {}, env = {}, webhookId = '') {
  const rawType = cleanText(payload?.type || '', 80).toLowerCase(); const data = payload?.data && typeof payload.data === 'object' ? payload.data : {}; const metadata = data?.metadata && typeof data.metadata === 'object' ? data.metadata : (payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {});
  const accountId = cleanText(metadata.eon_account_id || metadata.account_id || walkFind(data, ['eon_account_id', 'account_id']), 80); let tierId = cleanTier(metadata.eon_tier_id || metadata.tier_id || walkFind(data, ['eon_tier_id', 'tier_id'])); const productId = cleanText(walkFind(data, ['product_id', 'productId']), 96); if (!tierId && productId) tierId = getTierForDodoProductId(productId, env);
  const occurredAt = Date.parse(payload?.timestamp || data?.updated_at || data?.created_at || '') || nowMs();
  return normalizeBillingLifecycleEvent({
    providerEventId: cleanText(webhookId || payload?.id || payload?.event_id || walkFind(payload, ['event_id', 'id']), 160), rawEventType: rawType, eventType: eventTypeToLedgerType(rawType), accountId, tierId: tierId || 'free',
    providerCustomerRef: walkFind(data, ['customer_id', 'customerId']), providerSubscriptionRef: walkFind(data, ['subscription_id', 'subscriptionId']), checkoutAttemptId: metadata.eon_checkout_attempt_id || walkFind(data, ['eon_checkout_attempt_id']), paymentRef: walkFind(data, ['payment_id', 'paymentId']), providerStatus: walkFind(data, ['status']), cancelAtPeriodEnd: walkBool(data, ['cancel_at_next_billing_date', 'cancel_at_period_end']), currentPeriodEnd: walkFind(data, ['next_billing_date', 'current_period_end', 'expires_at']), trialEndsAt: walkFind(data, ['trial_end', 'trial_ends_at']), graceEndsAt: walkFind(data, ['grace_ends_at']), invoiceUrl: walkFind(data, ['invoice_url']), receiptUrl: walkFind(data, ['receipt_url']), occurredAt
  }, { graceHours: Number(env.EON_BILLING_GRACE_HOURS || 0) });
}

async function resolveBillingLifecycleReference(database, candidate = {}) {
  let event = normalizeBillingLifecycleEvent(candidate);
  if (!database?.prepare) return event;
  let authority = null;
  const needsAuthority = !event.accountId || event.tierId === 'free' || !event.providerSubscriptionRef || !event.providerCustomerRef;
  if (needsAuthority && event.paymentRef) {
    authority = await database.prepare(`SELECT account_id, tier_id, provider_subscription_ref, provider_customer_ref FROM eon_billing_payment_refs WHERE payment_ref = ? LIMIT 1`).bind(event.paymentRef).first();
  }
  if ((!authority || !authority.account_id) && event.providerSubscriptionRef) {
    authority = await database.prepare(`SELECT account_id, tier_id, provider_subscription_ref, provider_customer_ref FROM eon_billing_lifecycle WHERE provider_subscription_ref = ? ORDER BY updated_at DESC LIMIT 1`).bind(event.providerSubscriptionRef).first();
  }
  if ((!authority || !authority.account_id) && event.accountId) {
    authority = await database.prepare(`SELECT account_id, tier_id, provider_subscription_ref, provider_customer_ref FROM eon_billing_lifecycle WHERE account_id = ? LIMIT 1`).bind(event.accountId).first();
  }
  if (!authority) return event;
  event = normalizeBillingLifecycleEvent({
    ...event,
    accountId: event.accountId || authority.account_id,
    tierId: event.tierId !== 'free' ? event.tierId : authority.tier_id,
    providerSubscriptionRef: event.providerSubscriptionRef || authority.provider_subscription_ref,
    providerCustomerRef: event.providerCustomerRef || authority.provider_customer_ref
  });
  return event;
}

async function recordBillingPaymentReference(database, event = {}, processedAt = Date.now()) {
  if (!database?.prepare || !event.paymentRef || !event.accountId || event.tierId === 'free') return false;
  await database.prepare(`INSERT INTO eon_billing_payment_refs (payment_ref, account_id, tier_id, provider_subscription_ref, provider_customer_ref, source_event_id, occurred_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(payment_ref) DO UPDATE SET account_id=excluded.account_id, tier_id=excluded.tier_id, provider_subscription_ref=COALESCE(excluded.provider_subscription_ref,eon_billing_payment_refs.provider_subscription_ref), provider_customer_ref=COALESCE(excluded.provider_customer_ref,eon_billing_payment_refs.provider_customer_ref), source_event_id=excluded.source_event_id, occurred_at=excluded.occurred_at, updated_at=excluded.updated_at`)
    .bind(event.paymentRef, event.accountId, event.tierId, event.providerSubscriptionRef || null, event.providerCustomerRef || null, event.providerEventId, event.occurredAt, processedAt).run();
  return true;
}

async function resolvePremiumProductAuthority(payload = {}, env = {}, detected = null) {
  const direct = detected || detectDodoPremiumProduct(payload, env);
  if (direct.premium) return direct;
  const rawType = cleanText(payload?.type || '', 80).toLowerCase();
  if (!rawType.startsWith('refund.') && !rawType.startsWith('dispute.')) return direct;
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const paymentRef = cleanText(walkFind(data, ['payment_id', 'paymentId']), 160);
  if (!paymentRef) return direct;
  const grant = await readSoftwareGrantByPaymentRef(env.EON_BILLING_DB, paymentRef);
  if (!grant || grant.bundleId !== 'ultimate' || grant.sourceProvider !== 'dodo') return direct;
  return Object.freeze({
    ...direct,
    premium: true,
    tier: 'ultimate',
    configuredProductId: getPremiumDodoProductMap(env).ultimate || '',
    verifiedProductMatch: true,
    accountId: grant.accountId,
    paymentRef,
    orderRef: grant.sourceOrderRef,
    serverLedgerResolved: true
  });
}

async function upsertLifecycle(database, event, transition, processedAt) {
  const next = transition.next;
  await database.prepare(`INSERT INTO eon_billing_lifecycle (account_id, tier_id, access_status, provider_status, provider_customer_ref, provider_subscription_ref, payment_ref, checkout_attempt_id, cancel_at_period_end, current_period_end, trial_ends_at, grace_ends_at, last_invoice_url, last_receipt_url, source_event_id, source_event_type, source_occurred_at, reason, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(account_id) DO UPDATE SET tier_id=excluded.tier_id, access_status=excluded.access_status, provider_status=excluded.provider_status, provider_customer_ref=COALESCE(excluded.provider_customer_ref,eon_billing_lifecycle.provider_customer_ref), provider_subscription_ref=COALESCE(excluded.provider_subscription_ref,eon_billing_lifecycle.provider_subscription_ref), payment_ref=COALESCE(excluded.payment_ref,eon_billing_lifecycle.payment_ref), checkout_attempt_id=COALESCE(excluded.checkout_attempt_id,eon_billing_lifecycle.checkout_attempt_id), cancel_at_period_end=excluded.cancel_at_period_end, current_period_end=COALESCE(excluded.current_period_end,eon_billing_lifecycle.current_period_end), trial_ends_at=COALESCE(excluded.trial_ends_at,eon_billing_lifecycle.trial_ends_at), grace_ends_at=excluded.grace_ends_at, last_invoice_url=COALESCE(excluded.last_invoice_url,eon_billing_lifecycle.last_invoice_url), last_receipt_url=COALESCE(excluded.last_receipt_url,eon_billing_lifecycle.last_receipt_url), source_event_id=excluded.source_event_id, source_event_type=excluded.source_event_type, source_occurred_at=excluded.source_occurred_at, reason=excluded.reason, updated_at=excluded.updated_at`)
    .bind(event.accountId, next.tierId, next.status, event.providerStatus || null, event.providerCustomerRef || null, event.providerSubscriptionRef || null, event.paymentRef || null, event.checkoutAttemptId || null, next.cancelAtPeriodEnd ? 1 : 0, next.currentPeriodEnd || null, next.trialEndsAt || null, next.graceEndsAt || null, safeBillingLink(event.invoiceUrl) || null, safeBillingLink(event.receiptUrl) || null, event.providerEventId, event.eventType, event.occurredAt, next.reason, processedAt).run();
  await database.prepare(`INSERT INTO eon_entitlements (account_id, tier_id, status, source_provider, source_event_id, provider_customer_ref, provider_subscription_ref, issued_at, renews_at, revoked_at, reason, updated_at) VALUES (?, ?, ?, 'dodo', ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(account_id) DO UPDATE SET tier_id=excluded.tier_id, status=excluded.status, source_provider='dodo', source_event_id=excluded.source_event_id, provider_customer_ref=COALESCE(excluded.provider_customer_ref,eon_entitlements.provider_customer_ref), provider_subscription_ref=COALESCE(excluded.provider_subscription_ref,eon_entitlements.provider_subscription_ref), issued_at=COALESCE(eon_entitlements.issued_at,excluded.issued_at), renews_at=excluded.renews_at, revoked_at=excluded.revoked_at, reason=excluded.reason, updated_at=excluded.updated_at`)
    .bind(event.accountId, transition.accessActive ? next.tierId : 'free', next.status, event.providerEventId, event.providerCustomerRef || null, event.providerSubscriptionRef || null, transition.accessActive ? processedAt : null, next.currentPeriodEnd || null, transition.accessActive ? null : processedAt, next.reason, processedAt).run();
}

export async function applyDodoWebhookToD1(database, eventCandidate, rawPayload = '', options = {}) {
  await ensureBillingSchema(database); const processedAt = nowMs(); const payloadHash = await sha256Hex(rawPayload); const normalizedEvent = normalizeBillingLifecycleEvent(eventCandidate, { graceHours: Number(options.graceHours || 0) }); const event = await resolveBillingLifecycleReference(database, normalizedEvent);
  await recordBillingPaymentReference(database, event, processedAt);
  const existing = await database.prepare(`SELECT provider_event_id, processing_status, payload_hash FROM eon_billing_events WHERE provider_event_id = ? LIMIT 1`).bind(event.providerEventId).first();
  if (existing?.payload_hash && !timingSafeEqual(String(existing.payload_hash), payloadHash)) {
    return Object.freeze({ ok: false, conflict: true, status: 'webhook_id_payload_mismatch', duplicate: true, repaired: false, stale: false, entitlementChanged: false, processingStatus: cleanText(existing.processing_status, 48) || 'unknown' });
  }
  if (existing?.processing_status === 'processed' || existing?.processing_status === 'processed_out_of_order' || existing?.processing_status === 'processed_no_entitlement_change') {
    const referral = options.referralActive !== true
      ? Object.freeze({ ok: true, status: 'referral_rollout_inactive' })
      : existing.processing_status === 'processed'
        ? await applyReferralBillingSignal(options.referralDatabase || database, event)
        : Object.freeze({ ok: true, status: existing.processing_status === 'processed_out_of_order' ? 'referral_out_of_order_ignored' : 'referral_no_entitlement_change' });
    return Object.freeze({ ok: true, duplicate: true, repaired: existing.processing_status === 'processed' && referral.status !== 'no_referral_action', stale: existing.processing_status === 'processed_out_of_order', entitlementChanged: false, processingStatus: existing.processing_status, referral });
  }
  if (!existing) await database.prepare(`INSERT INTO eon_billing_events (provider_event_id, provider, raw_event_type, event_type, provider_customer_ref, provider_subscription_ref, account_id, tier_id, occurred_at, processed_at, payload_hash, processing_status) VALUES (?, 'dodo', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`).bind(event.providerEventId, event.rawEventType, event.eventType, event.providerCustomerRef, event.providerSubscriptionRef, event.accountId, event.tierId, event.occurredAt, processedAt, payloadHash).run();
  else await database.prepare(`UPDATE eon_billing_events SET processed_at=?, payload_hash=?, processing_status='processing' WHERE provider_event_id=?`).bind(processedAt, payloadHash, event.providerEventId).run();

  let transition = { applied: false, stale: false, reason: 'missing_account_metadata', accessActive: false };
  let processingStatus = 'processed_no_entitlement_change'; let entitlementChanged = false;
  if (event.accountId) {
    const current = await database.prepare(`SELECT * FROM eon_billing_lifecycle WHERE account_id=? LIMIT 1`).bind(event.accountId).first();
    transition = deriveBillingTransition(current, event, { graceHours: Number(options.graceHours || 0) });
    if (transition.stale) processingStatus = 'processed_out_of_order';
    else if (transition.applied) { await upsertLifecycle(database, event, transition, processedAt); processingStatus = 'processed'; entitlementChanged = true; }
  }
  if (event.checkoutAttemptId) {
    const subscriptionCreationFailed = event.eventType === 'subscription_failed';
    const checkoutStatus = subscriptionCreationFailed ? 'failed' : (entitlementChanged ? 'reconciled' : 'provider_event_received');
    await database.prepare(`UPDATE eon_billing_checkout_sessions SET provider_payment_ref=COALESCE(?,provider_payment_ref), status=?, updated_at=? WHERE attempt_id=?`).bind(event.paymentRef || null, checkoutStatus, processedAt, event.checkoutAttemptId).run();
    if (subscriptionCreationFailed) {
      await updateBillingCommand(database, event.checkoutAttemptId, { status: 'failed', resultStatus: 'subscription_failed', errorCode: 'subscription_creation_failed' }, { now: processedAt });
    } else {
      await reconcileBillingCommandFromWebhook(database, event.checkoutAttemptId, { entitlementChanged, processingStatus, now: processedAt });
    }
  }
  const referral = options.referralActive !== true
    ? Object.freeze({ ok: true, status: 'referral_rollout_inactive' })
    : transition.applied && transition.stale !== true
      ? await applyReferralBillingSignal(options.referralDatabase || database, event)
      : Object.freeze({ ok: true, status: transition.stale ? 'referral_out_of_order_ignored' : 'referral_no_entitlement_change' });
  await database.prepare(`UPDATE eon_billing_events SET processing_status=?, processed_at=? WHERE provider_event_id=?`).bind(processingStatus, processedAt, event.providerEventId).run();
  return Object.freeze({ ok: true, duplicate: Boolean(existing), repaired: Boolean(existing), stale: transition.stale === true, entitlementChanged, processingStatus, transitionReason: transition.reason, referral });
}

export async function processDodoWebhook({ request, env }) {
  const config = getDodoBillingConfig(env); if (!config.liveReady) return Object.freeze({ ok: false, httpStatus: 503, status: 'not_configured', errors: config.missing });
  if (!isJsonContentType(request.headers.get('content-type') || '')) return Object.freeze({ ok: false, httpStatus: 415, status: 'unsupported_media_type' });
  const raw = await readBoundedText(request, { maxBytes: EON_REQUEST_LIMITS.providerWebhook, allowEmpty: false });
  if (!raw.ok) return Object.freeze({ ok: false, httpStatus: raw.status, status: raw.error });
  const rawPayload = raw.text;
  const verification = await verifyDodoWebhookSignature({ rawPayload, headers: request.headers, secret: String(env.DODO_WEBHOOK_SECRET || '') });
  if (!verification.ok) return Object.freeze({ ok: false, httpStatus: 401, status: 'signature_rejected', reason: verification.reason });
  let payload; try { payload = JSON.parse(rawPayload); } catch { return Object.freeze({ ok: false, httpStatus: 400, status: 'invalid_json' }); }
  const premium = await resolvePremiumProductAuthority(payload, env, detectDodoPremiumProduct(payload, env));
  if (premium.premium) {
    if (!premium.verifiedProductMatch) return Object.freeze({ ok: false, httpStatus: 400, status: 'premium_product_mismatch', tier: premium.tier });
    if (premiumCheckoutRollout(env) === 'disabled') return Object.freeze({ ok: false, httpStatus: 503, status: 'premium_webhook_rollout_disabled', tier: premium.tier, retryable: true });
    if (premium.tier === 'ultimate') {
      const softwareEvent = normalizeUltimateSoftwareGrantEvent(payload, premium, verification.webhookId);
      if (!softwareEvent.providerEventId || !softwareEvent.rawEventType) return Object.freeze({ ok: false, httpStatus: 400, status: 'invalid_event_shape' });
      if (softwareEvent.eventType === 'ignored') return Object.freeze({ ok: true, httpStatus: 200, status: 'premium_ultimate_event_ignored', eventType: softwareEvent.rawEventType, entitlementChanged: false });
      let softwareApplied;
      try { softwareApplied = await applySoftwareGrantEventToD1(env.EON_BILLING_DB, softwareEvent, rawPayload); }
      catch { return Object.freeze({ ok: false, httpStatus: 503, status: 'premium_software_grant_delivery_retry_required', retryable: true, eventType: softwareEvent.rawEventType }); }
      if (!softwareApplied?.ok) return Object.freeze({ ok: false, httpStatus: softwareApplied.status === 'software_grant_event_payload_conflict' ? 409 : 400, status: softwareApplied.status || 'premium_software_grant_rejected' });
      if (premium.checkoutAttemptId && ['grant', 'restore'].includes(softwareEvent.eventType)) {
        const processedAt = nowMs();
        await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET provider_payment_ref=COALESCE(?,provider_payment_ref), status='reconciled', updated_at=? WHERE attempt_id=?`).bind(premium.paymentRef || null, processedAt, premium.checkoutAttemptId).run();
        await reconcileBillingCommandFromWebhook(env.EON_BILLING_DB, premium.checkoutAttemptId, { entitlementChanged: softwareApplied.changed === true, processingStatus: softwareApplied.status, now: processedAt });
      }
      return Object.freeze({ ok: true, httpStatus: 200, status: 'received', eventType: softwareEvent.rawEventType, ledgerEventType: `software_${softwareEvent.eventType}`, duplicate: softwareApplied.duplicate === true, entitlementChanged: softwareApplied.changed === true, softwareBundle: 'ultimate', hostedCapacityGranted: false });
    }
  }
  const event = normalizeDodoWebhookPayload(payload, env, verification.webhookId); if (!event.providerEventId || !event.rawEventType) return Object.freeze({ ok: false, httpStatus: 400, status: 'invalid_event_shape' });
  const referralConfig = getReferralRuntimeConfig(env); const referralDatabase = resolveReferralDatabase(env).database;
  let applied; try { applied = await applyDodoWebhookToD1(env.EON_BILLING_DB, event, rawPayload, { referralActive: referralConfig.active, referralDatabase, graceHours: Number(env.EON_BILLING_GRACE_HOURS || 0) }); }
  catch { return Object.freeze({ ok: false, httpStatus: 503, status: 'billing_or_referral_delivery_retry_required', eventType: event.rawEventType, ledgerEventType: event.eventType, retryable: true }); }
  if (applied?.ok === false) return Object.freeze({ ok: false, httpStatus: applied.conflict ? 409 : 400, status: applied.status || 'webhook_rejected', duplicate: applied.duplicate === true, processingStatus: applied.processingStatus || 'unknown' });

  let growthLifecycle = Object.freeze({ status: 'not_required' });
  if (event.accountId && env.EON_TRUST_DB?.prepare) {
    try {
      const lifecycle = await readAccountBillingLifecycle(env.EON_BILLING_DB, event.accountId);
      const successfulLifecycleEvent = ['payment_succeeded','subscription_renewed','subscription_active','plan_changed'].includes(event.eventType);
      const growthEvent = successfulLifecycleEvent && lifecycle?.tier_id && lifecycle.tier_id !== 'free'
        ? (lifecycle.access_status === 'trialing' ? 'trial_start' : (['active','cancelling'].includes(lifecycle.access_status) ? 'paid_subscription' : ''))
        : '';
      growthLifecycle = growthEvent
        ? await recordGrowthAccountLifecycle(env.EON_TRUST_DB, growthEvent, event.accountId, env, nowMs())
        : Object.freeze({ status: 'not_applicable' });
    } catch {
      // Growth telemetry is secondary evidence and must never roll back a signed
      // billing entitlement. Provider retries can self-repair via the idempotent
      // lifecycle receipt once Trust D1 is healthy again.
      growthLifecycle = Object.freeze({ status: 'growth_telemetry_deferred' });
    }
  }

  let pushDevicePolicy = Object.freeze({ status: 'not_required', maxActiveDevices: 1, olderDevicesDisabled: 0 });
  const pushRollout = cleanText(env.EON_PUSH_ROLLOUT || '', 24).toLowerCase();
  if (event.accountId && ['testing', 'production'].includes(pushRollout) && env.EON_IDENTITY_DB?.prepare) {
    try {
      const entitlement = await readAccountEntitlement(env.EON_BILLING_DB, event.accountId);
      const policy = resolveEonPushDevicePolicy(entitlement);
      const pruned = await pruneEonPushSubscriptionsToPolicy(env.EON_IDENTITY_DB, event.accountId, policy, nowMs());
      pushDevicePolicy = Object.freeze({ status: 'enforced', maxActiveDevices: policy.maxActiveDevices, deviceTier: policy.effectiveDeviceTier, entitlementStatus: policy.entitlementStatus, olderDevicesDisabled: pruned.olderDevicesDisabled });
    } catch {
      return Object.freeze({ ok: false, httpStatus: 503, status: 'push_device_policy_retry_required', retryable: true, billingEventApplied: true, eventType: event.rawEventType, ledgerEventType: event.eventType, duplicate: applied.duplicate, processingStatus: applied.processingStatus });
    }
  }

  return Object.freeze({ ok: true, httpStatus: 200, status: 'received', eventType: event.rawEventType, ledgerEventType: event.eventType, duplicate: applied.duplicate, repaired: applied.repaired, outOfOrder: applied.stale, entitlementChanged: applied.entitlementChanged, processingStatus: applied.processingStatus, referralStatus: applied.referral?.status || 'no_referral_action', referralDatabaseMode: referralConfig.databaseMode, growthLifecycle, pushDevicePolicy });
}
