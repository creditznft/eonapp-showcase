import { getIdentityConfig, readSession } from './eon-auth.js';
import { buildBillingStatusPayload, readAccountBillingLifecycle, readAccountEntitlement } from '../../assets/js/billing/eon-dodo-live-runtime.js';


export function isEonPaidAdFreeBillingState(billing = null) {
  return Boolean(
    billing
    && billing.serverAuthoritative === true
    && billing.accessActive === true
    && String(billing.tierId || 'free').trim().toLowerCase() !== 'free'
  );
}

// RT96 product boundary: ordinary display/banner advertising is disabled for
// guests, Free accounts and paid accounts. Vexrail sponsored AI and voluntary
// rewarded Sponsor Terminal are separate opt-in contracts and are not affected
// by this helper.
export function isEonOrdinaryAdsAllowed(_eligibility = null) {
  return false;
}

export function isEonRewardedAdsAllowed(eligibility = null) {
  return Boolean(eligibility?.ok && eligibility?.signedIn);
}

export async function readEonMonetizationAccountEligibility(request, env = {}) {
  let identity;
  let session;
  try {
    identity = getIdentityConfig(request, env);
    if (!identity?.configured) return Object.freeze({ ok: false, status: 503, reason: 'identity_unavailable', signedIn: false, accountId: '', paid: false, free: false, billing: null, identity });
    session = await readSession(identity, request);
  } catch {
    return Object.freeze({ ok: false, status: 503, reason: 'identity_unavailable', signedIn: false, accountId: '', paid: false, free: false, billing: null, identity: null });
  }
  if (!session?.accountId) return Object.freeze({ ok: true, status: 200, reason: 'sign_in_required', signedIn: false, accountId: '', paid: false, free: false, billing: null, identity, session: null });
  if (!env.EON_BILLING_DB?.prepare) return Object.freeze({ ok: false, status: 503, reason: 'billing_unavailable', signedIn: true, accountId: session.accountId, paid: false, free: false, billing: null, identity, session });
  try {
    const [entitlement, lifecycle] = await Promise.all([
      readAccountEntitlement(env.EON_BILLING_DB, session.accountId),
      readAccountBillingLifecycle(env.EON_BILLING_DB, session.accountId)
    ]);
    const billing = buildBillingStatusPayload(env, session.accountId, entitlement, lifecycle, null)?.account?.billing || null;
    if (!billing || billing.serverAuthoritative !== true) return Object.freeze({ ok: false, status: 503, reason: 'billing_unavailable', signedIn: true, accountId: session.accountId, paid: false, free: false, billing: null, identity, session });
    const paid = isEonPaidAdFreeBillingState(billing);
    const base = { ok: true, status: 200, reason: paid ? 'paid_ordinary_ads_off' : 'ordinary_ads_product_disabled', signedIn: true, accountId: session.accountId, paid, free: !paid, billing, identity, session };
    return Object.freeze({
      ...base,
      ordinaryAdsAllowed: isEonOrdinaryAdsAllowed(base),
      rewardedAdsAllowed: isEonRewardedAdsAllowed(base)
    });
  } catch {
    return Object.freeze({ ok: false, status: 503, reason: 'billing_unavailable', signedIn: true, accountId: session.accountId, paid: false, free: false, billing: null, identity, session });
  }
}

export default readEonMonetizationAccountEligibility;
