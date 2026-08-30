import { ensureBillingSchema, getDodoApiEnvironment } from './eon-dodo-live-runtime.js';
import { prepareBillingCommand, updateBillingCommand } from './eon-billing-command-ledger.js';
import { ensurePremiumSoftwareGrantSchema, readAccountActiveSoftwareGrants } from './eon-premium-software-grant-ledger.js';
import { safeDodoUrl } from '../../../functions/_shared/eon-request-security.js';

/** RT92 premium Dodo checkout runtime. Commercially fail-closed by default. */
export const EON_PREMIUM_DODO_RUNTIME_SCHEMA = 'eonapp.premium-dodo-runtime.rt92.v1';
// This runtime is intentionally Ultimate-only. All recurring subscriptions
// (Plus through Ultra) use eon-dodo-live-runtime.js.
export const EON_PREMIUM_DODO_TIERS = Object.freeze(['ultimate']);
export const EON_PREMIUM_RECURRING_TIERS = Object.freeze([]);
export const EON_PREMIUM_CHECKOUT_ROLLOUTS = Object.freeze(['testing', 'production']);
const freeze = Object.freeze;
const SAFE = /[^a-zA-Z0-9._:@/?=&%-]/g;
function clean(value = '', max = 180) { return String(value || '').trim().replace(SAFE, '').slice(0, max); }
function premiumTier(value = '') { const tier = clean(value, 24).toLowerCase(); return EON_PREMIUM_DODO_TIERS.includes(tier) ? tier : ''; }
function apiKey(env = {}) { return String(env.DODO_PAYMENTS_API_KEY || env.DODO_API_KEY || '').trim(); }
function checkoutRollout(env = {}) { const value = clean(env.EON_PREMIUM_CHECKOUT_ROLLOUT || '', 24).toLowerCase(); return EON_PREMIUM_CHECKOUT_ROLLOUTS.includes(value) ? value : 'disabled'; }
function normalizePath(value = '', fallback = '/billing?checkout=return') {
  try {
    const parsed = new URL(String(value || ''), 'https://eonapp.invalid');
    if (!['/billing', '/eoncity'].includes(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch { return fallback; }
}
function returnUrl(request, path) { return `${new URL(request.url).origin}${normalizePath(path)}`; }
async function responseJson(response) { try { return await response.json(); } catch { return null; } }

export function getPremiumDodoProductMap(env = {}) {
  return freeze({ ultimate: clean(env.DODO_PRODUCT_ULTIMATE || '', 96) });
}

export function getPremiumDodoRuntimeConfig(env = {}) {
  const rollout = checkoutRollout(env);
  const productMap = getPremiumDodoProductMap(env);
  const apiEnvironment = getDodoApiEnvironment(env, rollout);
  const missing = [];
  if (!EON_PREMIUM_CHECKOUT_ROLLOUTS.includes(rollout)) missing.push('EON_PREMIUM_CHECKOUT_ROLLOUT');
  if (EON_PREMIUM_CHECKOUT_ROLLOUTS.includes(rollout) && !apiEnvironment.valid) missing.push('DODO_API_ENVIRONMENT');
  if (!env.EON_BILLING_DB?.prepare) missing.push('EON_BILLING_DB');
  if (!apiKey(env)) missing.push('DODO_PAYMENTS_API_KEY');
  if (!String(env.DODO_WEBHOOK_SECRET || '').trim()) missing.push('DODO_WEBHOOK_SECRET');
  if (!String(env.EON_ENTITLEMENT_SIGNING_KEY || '').trim()) missing.push('EON_ENTITLEMENT_SIGNING_KEY');
  for (const tier of EON_PREMIUM_DODO_TIERS) if (!productMap[tier]) missing.push(`DODO_PRODUCT_${tier.toUpperCase()}`);
  return freeze({ schema: EON_PREMIUM_DODO_RUNTIME_SCHEMA, rollout, active: missing.length === 0, missing: freeze(missing), productMap, apiEnvironment: apiEnvironment.environment, apiBase: apiEnvironment.apiBase, hostedCapacityBundledWithUltimate: false });
}

export function normalizePremiumCheckoutRequest(input = {}, env = {}) {
  const tier = premiumTier(input.tier || input.tierId);
  const productId = tier ? getPremiumDodoProductMap(env)[tier] : '';
  const idempotencyKey = clean(input.idempotencyKey, 180);
  const errors = [];
  if (!tier) errors.push('premium-tier-required');
  if (!productId) errors.push('premium-product-id-missing');
  if (!/^[a-zA-Z0-9:_-]{8,180}$/.test(idempotencyKey)) errors.push('idempotency-key-invalid');
  if (input.browserEntitlementClaim || input.clientPaymentCallback || input.hostedCapacityClaim) errors.push('browser-entitlement-or-capacity-claim-rejected');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), tier, productId, idempotencyKey, returnPath: normalizePath(input.returnPath, '/billing?checkout=return'), cancelPath: normalizePath(input.cancelPath, '/billing?checkout=cancelled'), pricingKind: 'one-time-software' });
}

export async function createPremiumDodoCheckoutSession({ request, env, accountId, input = {}, fetchImpl = globalThis.fetch }) {
  const config = getPremiumDodoRuntimeConfig(env);
  if (!config.active) return freeze({ ok: false, status: 'premium_checkout_disabled', errors: config.missing, entitlementGranted: false });
  const normalized = normalizePremiumCheckoutRequest(input, env);
  if (!normalized.ok) return freeze({ ok: false, status: 'invalid_request', errors: normalized.errors, entitlementGranted: false });

  try {
    await ensureBillingSchema(env.EON_BILLING_DB);
    await ensurePremiumSoftwareGrantSchema(env.EON_BILLING_DB);
  } catch {
    return freeze({ ok: false, status: 'premium_billing_schema_unavailable', retryable: true, entitlementGranted: false });
  }

  if (normalized.tier === 'ultimate') {
    const grants = await readAccountActiveSoftwareGrants(env.EON_BILLING_DB, accountId);
    if (grants.some((grant) => grant.bundleId === 'ultimate')) return freeze({ ok: false, status: 'ultimate_already_owned', entitlementGranted: false, softwareAlreadyOwned: true });
  }

  const operation = 'software-purchase';
  let prepared;
  try {
    prepared = await prepareBillingCommand(env.EON_BILLING_DB, {
      accountId,
      operation,
      requestedTierId: normalized.tier,
      idempotencyKey: normalized.idempotencyKey,
      statePrecondition: 'no-active-ultimate-grant'
    });
  } catch {
    return freeze({ ok: false, status: 'premium_checkout_ledger_unavailable', retryable: true, entitlementGranted: false });
  }
  if (!prepared.ok) return freeze({ ok: false, status: prepared.status, duplicate: prepared.duplicate === true, command: prepared.command, entitlementGranted: false });
  if (prepared.duplicate) {
    const redirect = safeDodoUrl(prepared.providerRedirectUrl || '');
    return freeze({ ok: Boolean(redirect), status: redirect ? 'checkout_created' : prepared.status, duplicate: true, checkoutUrl: redirect, checkoutAttemptId: prepared.command?.commandId || '', trialDays: prepared.command?.trialDays || 0, entitlementGranted: false, webhookRequired: true, command: prepared.command });
  }

  const id = prepared.command.commandId;
  const now = Date.now();
  try {
    await env.EON_BILLING_DB.prepare(`INSERT INTO eon_billing_checkout_sessions (attempt_id, account_id, tier_id, product_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'creating', ?, ?)`)
      .bind(id, clean(accountId, 80), normalized.tier, normalized.productId, now, now).run();
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'provider_pending', resultStatus: 'creating_premium_checkout' });
  } catch {
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', resultStatus: 'premium_checkout_ledger_unavailable', errorCode: 'checkout_session_write_failed' }).catch(() => null);
    return freeze({ ok: false, status: 'premium_checkout_ledger_unavailable', retryable: true, checkoutAttemptId: id, entitlementGranted: false });
  }

  const payload = {
    product_cart: [{ product_id: normalized.productId, quantity: 1 }],
    return_url: returnUrl(request, normalized.returnPath),
    cancel_url: returnUrl(request, normalized.cancelPath),
    metadata: {
      eon_schema: EON_PREMIUM_DODO_RUNTIME_SCHEMA,
      eon_account_id: clean(accountId, 80),
      eon_tier_id: normalized.tier,
      eon_checkout_attempt_id: id,
      eon_billing_command_id: id,
      eon_billing_model: normalized.pricingKind,
      eon_hosted_capacity: 'separate',
      eon_source: 'cloudflare-pages-functions'
    }
  };

  let response;
  try {
    response = await fetchImpl(`${config.apiBase}/checkouts`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey(env)}`, 'content-type': 'application/json', accept: 'application/json', 'idempotency-key': normalized.idempotencyKey },
      body: JSON.stringify(payload)
    });
  } catch {
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', resultStatus: 'provider_network_error', errorCode: 'provider_network_error' });
    return freeze({ ok: false, status: 'dodo_checkout_failed', error: 'provider_network_error', retryable: true, checkoutAttemptId: id, entitlementGranted: false });
  }
  const body = await responseJson(response);
  const checkoutUrl = safeDodoUrl(body?.checkout_url || '');
  if (!response.ok || !checkoutUrl) {
    const error = clean(body?.error || body?.message || (checkoutUrl ? 'checkout_failed' : 'untrusted_checkout_url'), 180);
    await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'failed', providerHttpStatus: response.status, resultStatus: 'provider_rejected', errorCode: error });
    return freeze({ ok: false, status: 'dodo_checkout_failed', httpStatus: response.status, error, checkoutAttemptId: id, entitlementGranted: false });
  }
  const sessionId = clean(body?.checkout_id || body?.session_id || body?.id, 128);
  await env.EON_BILLING_DB.prepare(`UPDATE eon_billing_checkout_sessions SET provider_session_ref=?, status='created', updated_at=? WHERE attempt_id=?`).bind(sessionId || null, Date.now(), id).run();
  const command = await updateBillingCommand(env.EON_BILLING_DB, id, { status: 'provider_accepted', providerObjectRef: sessionId, providerRedirectUrl: checkoutUrl, providerHttpStatus: response.status, resultStatus: 'checkout_created' });
  return freeze({ ok: true, status: 'checkout_created', tier: normalized.tier, pricingKind: normalized.pricingKind, trialDays: prepared.command.trialDays, checkoutUrl, checkoutAttemptId: id, entitlementGranted: false, hostedCapacityGranted: false, webhookRequired: true, command });
}

export function getPremiumDodoRuntimeTruth() {
  return freeze({ schema: EON_PREMIUM_DODO_RUNTIME_SCHEMA, rolloutDefault: 'disabled', hostedCheckoutOnly: true, browserGrantAllowed: false, signedWebhookRequired: true, ultimateHostedCapacityIncluded: false, usesExistingBillingCommandLedger: true, usesExistingBillingCheckoutSessionLedger: true });
}

export default freeze({ EON_PREMIUM_DODO_RUNTIME_SCHEMA, EON_PREMIUM_DODO_TIERS, EON_PREMIUM_RECURRING_TIERS, getPremiumDodoProductMap, getPremiumDodoRuntimeConfig, normalizePremiumCheckoutRequest, createPremiumDodoCheckoutSession, getPremiumDodoRuntimeTruth });
