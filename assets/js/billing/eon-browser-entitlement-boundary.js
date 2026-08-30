/**
 * RT92 browser entitlement boundary.
 *
 * Current runtime helper only: browser/local/query state can never grant a paid
 * entitlement or Sponsor/referral value. Paid access is resolved from signed
 * server authorities (Dodo webhook ledger / capability snapshot).
 */
export const EON_BROWSER_ENTITLEMENT_BOUNDARY_SCHEMA = 'eonapp.billing.browser-entitlement-boundary.rt92.v1';

const freeze = Object.freeze;

export function rejectBrowserEntitlementClaim(input = {}) {
  const source = String(input?.source || 'browser').trim().slice(0, 64) || 'browser';
  const claimedTier = String(input?.claimedTier || '').trim().slice(0, 64);
  return freeze({
    schema: EON_BROWSER_ENTITLEMENT_BOUNDARY_SCHEMA,
    rejected: true,
    claimedTier,
    source,
    entitlementCreated: false,
    keyGrantCreated: false,
    sponsorKeyGrantCreated: false,
    referralGrantCreated: false,
    reason: `Browser authority rejected (${source}). localStorage, query parameters and browser callbacks cannot grant paid access or EONKEY value; use the signed server ledger.`
  });
}

export function getEonBrowserEntitlementBoundaryTruth() {
  return freeze({
    schema: `${EON_BROWSER_ENTITLEMENT_BOUNDARY_SCHEMA}.truth`,
    browserCanGrantPaidEntitlement: false,
    browserCanGrantReferralKey: false,
    browserCanGrantSponsorKey: false,
    signedServerAuthorityRequired: true,
    networkRequestCreated: false,
    mutationCreated: false
  });
}
