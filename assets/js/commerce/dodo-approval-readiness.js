import {
  W450_DODO_APPROVAL_SCHEMA,
  W450_DODO_ENTITLEMENT_POLICY,
  W450_DODO_STATUS,
  W450_DODO_TRIAL_POLICY,
  W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY
} from '../../../config/w450-dodo-approval-readiness-contract.mjs';

const freeze = (value) => Object.freeze(value);

/**
 * Public-safe view of the approval lane. It exposes no account IDs, API keys,
 * merchant details, checkout URLs, terms that are not yet live, or a browser
 * entitlement path.
 */
export function getDodoApprovalReadinessPublicStatus() {
  return freeze({
    schema: W450_DODO_APPROVAL_SCHEMA,
    provider: W450_DODO_STATUS.provider,
    status: W450_DODO_STATUS.merchantApplication,
    checkoutActive: false,
    recurringBillingActive: false,
    publicTrialActive: false,
    message: 'Dodo Payments review is in progress. No checkout, subscription, free trial, payment request or billing account is active in EONAPP yet.',
    trialMessage: `A ${W450_DODO_TRIAL_POLICY.proposedDurationDays}-day free-trial design is planned only after approval, a verified hosted checkout, signed webhook processing and entitlement proof.`,
    renewalMessage: 'A scheduled mandate, payment initiation or pending renewal never grants or extends access. EONAPP must wait for a verified successful settlement event.',
    approvalNote: W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY.publicCopyRule,
    privacyMessage: 'Future billing evidence is limited to provider and entitlement references; private Chat, projects, Vault data and raw payment data stay outside the billing service.'
  });
}

/**
 * Explicitly fail closed until the full external proof matrix is complete.
 * This function must remain network-free: it is not a checkout bootstrapper.
 */
export function requestDodoCheckout() {
  return freeze({
    ok: false,
    error: 'dodo-merchant-approval-and-proof-required',
    checkoutCreated: false,
    paymentRequestCreated: false,
    entitlementCreated: false,
    trialCreated: false,
    settlementRule: W450_DODO_ENTITLEMENT_POLICY.settlementRule
  });
}
