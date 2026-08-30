import { getIdentityConfig, jsonResponse, readSession } from '../../_shared/eon-auth.js';
import { W628_DODO_LIFECYCLE_SCHEMA, buildBillingStatusPayload, readAccountBillingLifecycle, readAccountEntitlement } from '../../../assets/js/billing/eon-dodo-live-runtime.js';
import { readAccountTrialEligibility } from '../../../assets/js/billing/eon-billing-command-ledger.js';
import { getPremiumDodoRuntimeConfig } from '../../../assets/js/billing/eon-premium-dodo-runtime.js';
import { readAccountActiveSoftwareGrants, readPremiumSoftwareSchemaAuthority } from '../../../assets/js/billing/eon-premium-software-grant-ledger.js';
import { RT92_PREMIUM_DODO_PRODUCTS } from '../../../config/rt92-premium-dodo-catalogue-blueprint.mjs';

const BILLING_STATUS_ENDPOINT = '/api/billing/status';

function publicPremiumPlans(checkoutActive = false) {
  return RT92_PREMIUM_DODO_PRODUCTS.filter((product) => product.tierId === 'ultimate').map((product) => Object.freeze({
    id: product.tierId,
    label: product.tierId === 'pro' ? 'Pro' : product.tierId === 'ultra' ? 'Ultra' : 'Ultimate',
    priceUsd: Number(product.priceUsd || 0),
    pricingType: product.pricingType,
    interval: product.pricingType === 'subscription' ? 'month' : 'one-time',
    trialDays: Number(product.trialDays || 0),
    checkoutActive: checkoutActive === true
  }));
}

export async function buildPremiumStatus(env = {}, accountId = '') {
  const runtime = getPremiumDodoRuntimeConfig(env);
  const schema = await readPremiumSoftwareSchemaAuthority(env.EON_BILLING_DB);
  const checkoutActive = runtime.active === true && schema.ok === true;
  const grants = accountId && schema.ok ? await readAccountActiveSoftwareGrants(env.EON_BILLING_DB, accountId) : [];
  const bundles = [...new Set(grants.map((grant) => String(grant?.bundleId || '')).filter(Boolean))];
  return Object.freeze({
    rollout: runtime.rollout,
    checkoutActive,
    apiEnvironment: runtime.apiEnvironment,
    schemaReady: schema.ok === true,
    softwareGrantSchemaVersion: schema.ok ? schema.actualVersion : 0,
    plans: Object.freeze(publicPremiumPlans(checkoutActive)),
    configured: Object.freeze({
      products: Object.freeze({ ultimate: Boolean(runtime.productMap?.ultimate) }),
      apiEnvironment: runtime.apiEnvironment
    }),
    missing: Object.freeze([...(runtime.missing || []), ...(schema.ok ? [] : ['PREMIUM_BILLING_SCHEMA'])]),
    account: Object.freeze({ softwareBundles: Object.freeze(bundles), ultimateOwned: bundles.includes('ultimate') }),
    browserGrantAllowed: false,
    signedWebhookRequired: true,
    hostedCapacityBundledWithUltimate: false
  });
}

async function withPremiumStatus(base = {}, env = {}, accountId = '') {
  try { return { ...base, premium: await buildPremiumStatus(env, accountId) }; }
  catch { return { ...base, premium: { rollout: 'disabled', checkoutActive: false, schemaReady: false, plans: publicPremiumPlans(false), configured: { products: { ultimate: false } }, missing: ['PREMIUM_STATUS_UNAVAILABLE'], account: { softwareBundles: [], ultimateOwned: false }, browserGrantAllowed: false, signedWebhookRequired: true, hostedCapacityBundledWithUltimate: false } }; }
}

function unavailableBillingStatus(env = {}, session = null, referenceCode = 'billing-status-unavailable') {
  const configured = buildBillingStatusPayload(env, '', null, null, null);
  const checkedAt = new Date().toISOString();
  return {
    ...configured,
    schema: W628_DODO_LIFECYCLE_SCHEMA,
    ok: false,
    statusState: 'unavailable',
    available: false,
    configuredActive: configured.checkoutActive === true,
    endpoint: BILLING_STATUS_ENDPOINT,
    checkedAt,
    referenceCode,
    checkoutActive: false,
    trialActive: false,
    dodoWebhookAdapterLive: false,
    entitlementLedgerWriteEnabled: false,
    lifecycleLedgerWriteEnabled: false,
    customerPortalActive: false,
    subscriptionActionsActive: false,
    account: { signedIn: Boolean(session?.accountId), trialEligible: null, entitlement: null, billing: null },
    message: 'Billing status could not be verified. No checkout or subscription action is available.',
    freshness: { checkedAt, cacheControl: 'no-store' }
  };
}

function response(body, status = 200) {
  return jsonResponse(body, status, { 'cache-control': 'no-store, max-age=0', vary: 'cookie' });
}

export async function onRequestGet(context) {
  let session = null;
  try {
    const config = getIdentityConfig(context.request, context.env);
    session = await readSession(config, context.request);
  } catch {
    return response(unavailableBillingStatus(context.env, null, 'billing-identity-read-failed'), 503);
  }

  if (!session?.accountId) {
    return response(await withPremiumStatus(buildBillingStatusPayload(context.env, '', null, null, null), context.env, ''));
  }

  try {
    const entitlement = await readAccountEntitlement(context.env.EON_BILLING_DB, session.accountId);
    const lifecycle = await readAccountBillingLifecycle(context.env.EON_BILLING_DB, session.accountId);
    const trialEligible = await readAccountTrialEligibility(context.env.EON_BILLING_DB, session.accountId);
    return response(await withPremiumStatus(buildBillingStatusPayload(context.env, session.accountId, entitlement, lifecycle, trialEligible), context.env, session.accountId));
  } catch {
    return response(unavailableBillingStatus(context.env, session, 'billing-ledger-read-failed'), 503);
  }
}
