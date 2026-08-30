/**
 * W450 — Dodo Payments approval-gated billing readiness.
 *
 * This is deliberately a no-network, no-secret planning contract. It records
 * the chosen merchant candidate and the server-side proof required before a
 * checkout, subscription, free trial, customer portal, webhook, or entitlement
 * can be exposed to a user.
 */
export const W450_DODO_APPROVAL_SCHEMA = 'eonapp.w450.dodo-approval-readiness.v1';

export const W450_DODO_STATUS = Object.freeze({
  provider: 'Dodo Payments',
  providerModel: 'merchant-of-record-candidate',
  merchantApplication: 'individual-underwriting-pending',
  providerSelectedForPlanning: true,
  merchantApproved: false,
  checkoutConnected: false,
  recurringBillingConnected: false,
  webhookProcessorConnected: false,
  entitlementServiceConnected: false,
  publicPricingActive: false,
  publicTrialActive: false,
  customerPortalConnected: false,
  sourceOnly: true
});

/**
 * Non-public planning envelope only. Exact SKU pricing, local-currency display,
 * taxes, invoice wording and annual terms cannot be published until Dodo
 * approves the catalogue and test-mode lifecycle proof is complete.
 */
export const W450_DODO_CATALOGUE_ENVELOPE = Object.freeze({
  lifecycle: 'planned-not-public',
  displayCurrencyReference: 'USD',
  adaptiveCurrency: 'provider-configured-after-approval',
  maximumMonthlyUsd: 49.99,
  tiers: Object.freeze([
    Object.freeze({ id: 'eon-free', lifecycle: 'active-local-free', trialEligible: false, pricing: '0-usd-reference' }),
    Object.freeze({ id: 'eon-plus', lifecycle: 'planned-not-public', trialEligible: true, pricing: 'not-finalized-within-monthly-cap' }),
    Object.freeze({ id: 'eon-studio', lifecycle: 'planned-not-public', trialEligible: true, pricing: 'not-finalized-within-monthly-cap' }),
    Object.freeze({ id: 'eon-power', lifecycle: 'planned-not-public', trialEligible: true, pricing: 'not-finalized-within-monthly-cap' }),
    Object.freeze({ id: 'eon-max', lifecycle: 'planned-not-public', trialEligible: true, pricing: 'not-finalized-within-monthly-cap' })
  ]),
  rules: Object.freeze([
    'One transparent seven-day trial may be offered only to approved paid tiers after hosted-checkout and entitlement proof.',
    'No exact price, local-currency conversion, tax treatment, renewal date or payment method may be shown before the approved catalogue is configured and independently tested.',
    'A recurring tier may not exceed the USD reference monthly ceiling without a new owner decision and a revised source contract.'
  ])
});

export const W450_DODO_TRIAL_POLICY = Object.freeze({
  lifecycle: 'planned-not-public',
  objective: 'Offer a clear, conversion-focused trial only after merchant approval and end-to-end entitlement proof.',
  proposedDurationDays: 7,
  proposedEligibleTiers: Object.freeze(['eon-plus', 'eon-studio', 'eon-power', 'eon-max']),
  qualification: Object.freeze([
    'One verified trial per customer identity across the entire paid ladder.',
    'A provider-hosted checkout or mandate flow must complete before the trial is recorded.',
    'A browser redirect, localStorage record, plan switch, referral link or client-side clock can never create or extend a trial.',
    'Trial copy must state the exact price, renewal date, cancellation path and regional payment-method conditions before consent.'
  ]),
  prohibited: Object.freeze([
    'silent automatic enrollment',
    'trial without explicit checkout consent',
    'multiple plan-hop trials',
    'client-side entitlement grant',
    'trial reward for sharing or referral activity',
    'trial copy before provider approval and verified checkout exist'
  ])
});

/**
 * Planning record of guidance supplied during merchant onboarding. This is not
 * a live Dodo integration claim. The account's approved documentation and a
 * full test-mode lifecycle must replace this record before public billing copy
 * can make timing promises.
 */
export const W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY = Object.freeze({
  status: 'merchant-guidance-reported-not-account-verified',
  recurringCoverage: 'International card/local methods and India UPI AutoPay or Indian card mandate support were reported during onboarding.',
  indiaRenewalTiming: 'Onboarding guidance reported that final confirmation for an India renewal can remain pending for approximately 48–51 hours.',
  requiredHandling: 'Treat a pending mandate, scheduled debit or checkout return as non-settlement. Never extend a new access period until a verified provider success event is processed.',
  publicCopyRule: 'Do not publish a timing promise until it is confirmed in the approved account and tested across the actual lifecycle.'
});

export const W450_DODO_ENTITLEMENT_POLICY = Object.freeze({
  authority: 'server-side-signed-licence-or-subscription-state-only',
  neverAuthority: Object.freeze(['browser redirect', 'checkout initiation', 'client-side localStorage', 'payment-method mandate creation', 'unverified webhook body']),
  settlementRule: 'Only a verified provider success event may grant or extend paid access.',
  indiaRenewalRule: 'For an India-issued card or UPI renewal, a scheduled charge, mandate acknowledgement, provider redirect or reported pending-confirmation window never extends access. Preserve only the last paid-through state until a verified successful settlement event arrives.',
  pendingRenewalRule: 'A pending renewal is not a new entitlement period. Any grace or recovery experience must be explicitly published, separately approved and based only on the last verified paid-through record.',
  failureRule: 'A failed, held, cancelled, refunded, disputed or chargeback-reversed payment must not create a new entitlement. Any later recovery behaviour requires a published policy and verified event processing.',
  privacyBoundary: Object.freeze([
    'The billing service may store provider references, product/plan ID, settlement state, entitlement ID, signing-key version and support reference.',
    'It must not receive Chat text, prompts, project files, creator assets, Vault keys, raw card data, City telemetry or an unrestricted browser profile.'
  ])
});

export const W450_DODO_REQUIRED_PROOF = Object.freeze([
  'merchant-underwriting-approved-for-eonapp-scope',
  'approved-product-catalogue-and-public-terms',
  'hosted-checkout-test-success-and-cancel-path',
  'verified-webhook-signature-and-replay-rejection',
  'idempotent-entitlement-grant-revoke-and-restore',
  'subscription-trial-start-cancel-expiry-and-renewal-matrix',
  'india-upi-and-indian-card-pending-settlement-matrix',
  'merchant-guidance-versus-approved-account-confirmation-window-review',
  'payment-failed-hold-recovery-and-support-matrix',
  'refund-dispute-chargeback-revocation-matrix',
  'customer-portal-cancel-and-payment-method-update-matrix',
  'privacy-security-accessibility-and-rollback-review',
  'human-commercial-go-decision'
]);

export function validateW450DodoApprovalReadinessContract() {
  const errors = [];
  if (W450_DODO_STATUS.provider !== 'Dodo Payments') errors.push('Dodo Payments must remain the selected planning candidate.');
  if (W450_DODO_STATUS.providerSelectedForPlanning !== true) errors.push('Provider planning selection is missing.');
  for (const key of ['merchantApproved', 'checkoutConnected', 'recurringBillingConnected', 'webhookProcessorConnected', 'entitlementServiceConnected', 'publicPricingActive', 'publicTrialActive', 'customerPortalConnected']) {
    if (W450_DODO_STATUS[key] !== false) errors.push(`${key} must remain false until external proof exists.`);
  }
  if (W450_DODO_TRIAL_POLICY.lifecycle !== 'planned-not-public') errors.push('Free trial must remain planned and non-public.');
  if (W450_DODO_CATALOGUE_ENVELOPE.lifecycle !== 'planned-not-public' || W450_DODO_CATALOGUE_ENVELOPE.displayCurrencyReference !== 'USD') errors.push('Dodo catalogue envelope must remain non-public and USD-referenced.');
  if (W450_DODO_CATALOGUE_ENVELOPE.maximumMonthlyUsd !== 49.99) errors.push('Dodo paid-tier monthly ceiling must remain $49.99 until a new owner decision.');
  const paidEnvelopeIds = W450_DODO_CATALOGUE_ENVELOPE.tiers.filter((tier) => tier.trialEligible).map((tier) => tier.id);
  if (JSON.stringify(paidEnvelopeIds) !== JSON.stringify(W450_DODO_TRIAL_POLICY.proposedEligibleTiers)) errors.push('Dodo trial-eligible tiers must match the non-public catalogue envelope.');
  if (W450_DODO_TRIAL_POLICY.proposedDurationDays !== 7) errors.push('The conversion trial must have one explicit proposed duration.');
  if (!W450_DODO_TRIAL_POLICY.prohibited.includes('client-side entitlement grant')) errors.push('Trial policy must forbid client-side access grants.');
  if (!W450_DODO_ENTITLEMENT_POLICY.settlementRule.includes('verified provider success event')) errors.push('Entitlement policy must wait for verified settlement success.');
  if (!W450_DODO_ENTITLEMENT_POLICY.indiaRenewalRule.includes('never extends access')) errors.push('India pending renewal policy must fail closed.');
  if (W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY.status !== 'merchant-guidance-reported-not-account-verified') errors.push('Provider guidance must remain explicitly unverified until account proof exists.');
  if (!W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY.indiaRenewalTiming.includes('48–51')) errors.push('India renewal timing guidance must be recorded for verification, not treated as an entitlement rule.');
  if (W450_DODO_REQUIRED_PROOF.length < 10) errors.push('Dodo integration proof matrix is incomplete.');
  return Object.freeze(errors);
}
