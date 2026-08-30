/** W628D/F — server-only Dodo customer portal and reviewed subscription actions. */
import { EON_PAID_TIER_IDS } from '../commerce/eon-commercial-catalog.js';
import { getDodoBillingConfig, getDodoProductMap } from './eon-dodo-live-runtime.js';
import { safeBillingLink } from './eon-billing-lifecycle.js';
const freeze = Object.freeze;
const ACTIONS = new Set(['portal', 'cancel-at-period-end', 'reactivate', 'change-plan', 'preview-change-plan']);
const TIER_RANK = Object.freeze({ free: 0, plus: 1, studio: 2, power: 3, max: 4, pro: 5, ultra: 6 });
function clean(value = '', max = 160) { return String(value || '').trim().replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max); }
const ALL_RECURRING_TIERS = EON_PAID_TIER_IDS;
function paidTier(value = '') { const tier = clean(value, 24).toLowerCase(); return ALL_RECURRING_TIERS.includes(tier) ? tier : ''; }
function apiKey(env = {}) { return String(env.DODO_PAYMENTS_API_KEY || env.DODO_API_KEY || '').trim(); }
async function responseJson(response) { try { return await response.json(); } catch { return null; } }

function changePlanBody(normalized, productId) {
  return {
    product_id: productId,
    quantity: 1,
    effective_at: normalized.effectiveAt,
    proration_billing_mode: normalized.isDowngrade ? 'do_not_bill' : 'prorated_immediately',
    on_payment_failure: 'prevent_change',
    metadata: { eon_requested_tier: normalized.requestedTier, eon_source: 'eonapp-billing-reviewed-action' }
  };
}
function previewSummary(payload = {}) {
  const raw = payload?.immediate_charge?.summary ?? payload?.immediateCharge?.summary ?? payload?.summary ?? '';
  if (typeof raw === 'string') {
    return [...raw].filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    }).join('').trim().slice(0, 240);
  }
  if (typeof raw === 'number') return String(raw);
  return '';
}

export function normalizeBillingAction(input = {}, entitlement = null) {
  const action = clean(input.action, 48).toLowerCase();
  const currentTier = paidTier(entitlement?.tier_id);
  const requestedTier = paidTier(input.tier || input.tierId);
  const idempotencyKey = clean(input.idempotencyKey, 180);
  const subscriptionRef = clean(entitlement?.provider_subscription_ref, 128);
  const customerRef = clean(entitlement?.provider_customer_ref, 128);
  const errors = [];
  if (!ACTIONS.has(action)) errors.push('Unsupported billing action.');
  if (input.confirmed !== true) errors.push('Explicit review confirmation is required.');
  if (action === 'portal' && !customerRef) errors.push('No provider customer reference is available.');
  if (action !== 'portal' && !subscriptionRef) errors.push('No provider subscription reference is available.');
  if ((action === 'change-plan' || action === 'preview-change-plan') && !requestedTier) errors.push('A valid paid target tier is required.');
  if ((action === 'change-plan' || action === 'preview-change-plan') && requestedTier === currentTier) errors.push('The requested tier is already current.');
  if (!/^[a-zA-Z0-9:_-]{8,180}$/.test(idempotencyKey)) errors.push('A valid idempotency key is required.');
  const isDowngrade = (action === 'change-plan' || action === 'preview-change-plan') && TIER_RANK[requestedTier] < TIER_RANK[currentTier];
  return freeze({ ok: errors.length === 0, errors: freeze(errors), action, currentTier, requestedTier, subscriptionRef, customerRef, idempotencyKey, isDowngrade, effectiveAt: isDowngrade ? 'next_billing_date' : 'immediately' });
}

export async function createDodoCustomerPortal({ request, env, entitlement, fetchImpl = globalThis.fetch }) {
  const normalized = normalizeBillingAction({ action: 'portal', confirmed: true, idempotencyKey: 'portal:server-reviewed' }, entitlement);
  const config = getDodoBillingConfig(env);
  if (!config.liveReady) return freeze({ ok: false, status: 'not_configured', errors: config.missing });
  if (!normalized.ok) return freeze({ ok: false, status: 'invalid_request', errors: normalized.errors });
  const returnUrl = `${new URL(request.url).origin}/billing?portal=return`;
  const query = new URLSearchParams({ return_url: returnUrl, send_email: 'false' });
  const response = await fetchImpl(`${config.apiBase}/customers/${encodeURIComponent(normalized.customerRef)}/customer-portal/session?${query}`, { method: 'POST', headers: { authorization: `Bearer ${apiKey(env)}`, accept: 'application/json' } });
  const body = await responseJson(response);
  const link = safeBillingLink(body?.link || '');
  if (!response.ok || !link) return freeze({ ok: false, status: 'portal_session_failed', httpStatus: response.status, error: clean(body?.message || body?.error || 'portal_failed', 180) });
  return freeze({ ok: true, status: 'portal_session_created', portalUrl: link, directEntitlementChange: false });
}

export async function executeDodoSubscriptionAction({ env, input, entitlement, fetchImpl = globalThis.fetch }) {
  const normalized = normalizeBillingAction(input, entitlement);
  const config = getDodoBillingConfig(env);
  if (!config.liveReady) return freeze({ ok: false, status: 'not_configured', errors: config.missing });
  if (!normalized.ok) return freeze({ ok: false, status: 'invalid_request', errors: normalized.errors });
  if (normalized.action === 'portal') return freeze({ ok: false, status: 'use_portal_route' });
  let url = `${config.apiBase}/subscriptions/${encodeURIComponent(normalized.subscriptionRef)}`;
  let method = 'PATCH';
  let body;
  if (normalized.action === 'cancel-at-period-end') body = { cancel_at_next_billing_date: true, cancel_reason: 'cancelled_by_customer', cancellation_comment: 'Customer confirmed cancellation from EONAPP Billing.' };
  if (normalized.action === 'reactivate') body = { cancel_at_next_billing_date: false };
  if (normalized.action === 'change-plan') {
    const productMap = getDodoProductMap(env);
    const productId = productMap[normalized.requestedTier] || '';
    if (!productId) return freeze({ ok: false, status: 'target_product_not_configured', action: normalized.action, directEntitlementChange: false });
    url += '/change-plan';
    method = 'POST';
    body = changePlanBody(normalized, productId);
  }
  const response = await fetchImpl(url, { method, headers: { authorization: `Bearer ${apiKey(env)}`, accept: 'application/json', 'content-type': 'application/json', 'idempotency-key': normalized.idempotencyKey }, body: JSON.stringify(body) });
  const payload = await responseJson(response);
  if (!response.ok) return freeze({ ok: false, status: 'provider_action_failed', httpStatus: response.status, action: normalized.action, error: clean(payload?.message || payload?.error || 'provider_action_failed', 180) });
  return freeze({ ok: true, status: 'provider_action_accepted_webhook_pending', action: normalized.action, requestedTier: normalized.requestedTier, effectiveAt: normalized.effectiveAt, directEntitlementChange: false, webhookReconciliationRequired: true });
}


export async function previewDodoSubscriptionChange({ env, input, entitlement, fetchImpl = globalThis.fetch }) {
  const normalized = normalizeBillingAction({ ...input, action: 'preview-change-plan', confirmed: true }, entitlement);
  const config = getDodoBillingConfig(env);
  if (!config.liveReady) return freeze({ ok: false, status: 'not_configured', errors: config.missing });
  if (!normalized.ok) return freeze({ ok: false, status: 'invalid_request', errors: normalized.errors });
  const productMap = getDodoProductMap(env);
  const productId = productMap[normalized.requestedTier] || '';
  if (!productId) return freeze({ ok: false, status: 'target_product_not_configured', directEntitlementChange: false });
  const url = `${config.apiBase}/subscriptions/${encodeURIComponent(normalized.subscriptionRef)}/change-plan/preview`;
  const response = await fetchImpl(url, { method: 'POST', headers: { authorization: `Bearer ${apiKey(env)}`, accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify(changePlanBody(normalized, productId)) });
  const payload = await responseJson(response);
  if (!response.ok) return freeze({ ok: false, status: 'provider_preview_failed', httpStatus: response.status, error: clean(payload?.message || payload?.error || 'provider_preview_failed', 180) });
  return freeze({
    ok: true,
    status: 'provider_plan_change_preview',
    currentTier: normalized.currentTier,
    requestedTier: normalized.requestedTier,
    isDowngrade: normalized.isDowngrade,
    effectiveAt: normalized.effectiveAt,
    immediateChargeSummary: previewSummary(payload),
    directEntitlementChange: false
  });
}

export function getDodoCustomerActionTruth() {
  return freeze({ portalEndpoint: '/customers/{customer_id}/customer-portal/session', planChangePreviewEndpoint: '/subscriptions/{subscription_id}/change-plan/preview', cancellationUsesProviderSubscriptionPatch: true, reactivationUsesProviderSubscriptionPatch: true, upgradesImmediate: true, downgradesAtNextBillingDate: true, planChangesPreviewBeforeCommit: true, paymentFailurePreventsPlanChange: true, directEntitlementMutation: false, signedWebhookReconciliationRequired: true });
}
