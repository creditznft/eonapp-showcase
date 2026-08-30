/**
 * R4-COMM-02 — global commerce, EON Invite and multi-currency planning.
 *
 * This contract supersedes only the *planning direction* in R4-COMM-01.
 * It deliberately activates nothing: no checkout, provider account, webhook,
 * licence entitlement, subscription, coupon, referral reward, payout, ad or
 * customer account migration exists in this wave.
 */

export const R4_COMM02_SCHEMA = 'eonapp.r4.comm02.global-commerce.v1';
export const R4_COMM02_VERSION = 1;

export const R4_COMM02_FEATURE_FLAGS = Object.freeze({
  providerSelected: false,
  merchantApproved: false,
  publicPricingActive: false,
  hostedCheckoutActive: false,
  recurringBillingActive: false,
  oneTimePackSalesActive: false,
  webhookProcessingActive: false,
  serverEntitlementActive: false,
  eonInviteActive: false,
  eonInviteCouponActive: false,
  eonInviteFreeTimeActive: false,
  affiliateProgramActive: false,
  commissionPayoutActive: false,
  adInventoryActive: false,
  cpaOfferwallActive: false,
  sponsoredDiscoveryActive: false,
  enterpriseSalesActive: false
});

/**
 * Provider research is a selection rubric, not an integration. The order is
 * intentionally chosen for a solo India-based digital-product founder who
 * wants global checkout and the least merchant-operation burden.
 */
export const R4_COMM02_PROVIDER_STRATEGY = Object.freeze({
  state: 'research-complete-provider-not-selected',
  primaryCandidate: Object.freeze({
    name: 'Dodo Payments',
    model: 'merchant-of-record-candidate',
    fit: 'Candidate only for a tightly scoped EON Official Blueprint Pack catalogue with immediate digital delivery. It is not a presumptive fit for a broad EONAPP membership because the product contains financial-research and City/game-adjacent surfaces that require separate written acceptance.',
    mandatoryBeforeSelection: Object.freeze([
      'Written acceptance of the narrowly scoped EON Official Blueprint Pack catalogue and its immediate digital delivery.',
      'Written confirmation that no checkout covers Market Intelligence, financial research, City/game access, crypto or virtual-goods activity.',
      'Written confirmation that an Individual India-based seller can receive the proposed payout method and convert or receive any non-INR payout currency.',
      'Written confirmation that the EON Invite customer-promotion design is permitted.',
      'Test-mode proof for checkout, webhook verification, refund or dispute reversal, and licence revocation.'
    ])
  }),
  backupCandidate: Object.freeze({
    name: 'Lemon Squeezy',
    model: 'merchant-of-record-candidate',
    fit: 'Global digital-product fallback for a narrow EON Official Blueprint Pack catalogue when India payout and product review are accepted; it is not a presumptive approval for a broad EONAPP membership.',
    mandatoryBeforeSelection: Object.freeze([
      'Verify the exact India payout route for the selected merchant account.',
      'Written acceptance of the narrow Blueprint Pack catalogue and EON Invite promotion.',
      'Test-mode proof for subscription cancellation, refunds, reversals and licence state.'
    ])
  }),
  deferredDirectGateways: Object.freeze([
    Object.freeze({ name: 'Razorpay', reason: 'Useful later for India-local rails, but direct-gateway KYC, merchant responsibility and support/refund operations make it a later stage rather than the first low-operations global path.' }),
    Object.freeze({ name: 'Cashfree', reason: 'Useful later for India-local rails, but direct-gateway merchant onboarding, KYC and operating responsibilities make it a later stage rather than the first low-operations global path.' })
  ]),
  notSelected: Object.freeze({
    name: 'PayU',
    reason: 'Do not select as the default for this roadmap. Its public restricted-category list includes referral-income and broad intangible-goods language, while its offer tooling does not itself amount to approval for EONAPP. The merchant would also retain customer, refund and dispute responsibility.'
  }),
  rejectedShortcuts: Object.freeze([
    'KYC avoidance',
    'using browser localStorage as an entitlement ledger',
    'browser-only payment confirmation',
    'unapproved affiliate or revenue-share scheme',
    'crypto as a subscription or referral foundation'
  ])
});

/**
 * EON Invite is deliberately a simple customer promotion, not an affiliate
 * economy. It has no cash value, no conversion to a balance and no second
 * level. It is planning-only until provider approval and server-side proof.
 */
export const R4_COMM02_EON_INVITE = Object.freeze({
  publicName: 'EON Invite',
  status: 'planned-not-active-provider-approval-required',
  objective: 'Give a real product benefit for successful introductions without making users earn from other users.',
  qualification: Object.freeze({
    required: Object.freeze([
      'A distinct new account created through a valid invitation.',
      'The invitee completes a first eligible paid purchase.',
      'The payment survives the provider refund, dispute and chargeback review window.',
      'Server-side verification confirms no self-referral or duplicate-account pattern.'
    ]),
    neverQualifies: Object.freeze([
      'a link click',
      'a share',
      'a free signup',
      'a trial start',
      'a refunded, disputed or charged-back payment',
      'a duplicate or self-referral'
    ])
  }),
  proposedBenefit: Object.freeze({
    invitee: 'One 20% first-purchase coupon for one eligible official Pack or membership.',
    inviter: 'One 20% coupon for the inviter’s next eligible official Pack or membership after a qualified referral.',
    milestone: 'After three qualified referrals in a rolling 12 months: choose one 30-day Plus extension or one 20% annual-membership renewal coupon.',
    limits: Object.freeze([
      'One tier only; no downstream levels.',
      'No coupon stacking with other promotions or annual discount.',
      'Maximum four inviter coupons in any rolling 12 months.',
      'Maximum one free-time extension in any rolling 12 months.',
      'Coupons expire, are non-transferable, and are not a stored-value balance.'
    ])
  }),
  prohibited: Object.freeze([
    'cash',
    'commission',
    'revenue share',
    'percentage of another user payment',
    'affiliate income',
    'payout',
    'bank transfer',
    'crypto',
    'token',
    'points with cash-equivalent value',
    'gift card',
    'multilevel reward',
    'reward on clicks, shares, free signups or trials',
    'automatic client-side reward grant'
  ]),
  activationPrerequisites: Object.freeze([
    'Written acceptance by the selected provider for the product catalogue and promotion.',
    'Server-backed account, purchase, refund and entitlement records.',
    'Idempotent issuance, redemption and reversal rules.',
    'Visible promotion terms and simple abuse review path.',
    'Privacy-preserving abuse controls; no hidden fingerprinting or raw IP retention as the default proof method.',
    'Test-mode proof that refund, dispute and chargeback events revoke an unredeemed benefit and reconcile a redeemed benefit safely.'
  ])
});

/**
 * Price books are internal planning values. Checkout chooses the approved
 * currency and tax treatment; browser-side exchange-rate conversion is banned.
 */
export const R4_COMM02_PRICE_BOOKS = Object.freeze({
  status: 'planned-not-public-not-for-sale',
  pricingRule: 'Use fixed regional price books. Do not derive a checkout price from client-side foreign-exchange calculations.',
  india: Object.freeze({
    currency: 'INR',
    entries: Object.freeze([
      Object.freeze({ id: 'eon-free', billing: 'free', price: 0 }),
      Object.freeze({ id: 'official-pack-essential', billing: 'one-time', price: 299 }),
      Object.freeze({ id: 'official-pack-professional', billing: 'one-time', price: 699 }),
      Object.freeze({ id: 'official-pack-signature', billing: 'one-time', price: 1499 }),
      Object.freeze({ id: 'eon-plus', billing: 'monthly', price: 299 }),
      Object.freeze({ id: 'eon-plus', billing: 'annual', price: 2999 }),
      Object.freeze({ id: 'eon-studio', billing: 'monthly', price: 799 }),
      Object.freeze({ id: 'eon-studio', billing: 'annual', price: 7999 }),
      Object.freeze({ id: 'eon-team', billing: 'per-seat-monthly', price: 1199, minimumSeats: 3 }),
      Object.freeze({ id: 'eon-team', billing: 'per-seat-annual', price: 11990, minimumSeats: 3 }),
      Object.freeze({ id: 'eon-scale', billing: 'organisation-monthly', price: 15999, includedSeats: 10 })
    ])
  }),
  global: Object.freeze({
    currency: 'USD',
    entries: Object.freeze([
      Object.freeze({ id: 'eon-free', billing: 'free', price: 0 }),
      Object.freeze({ id: 'official-pack-essential', billing: 'one-time', price: 9 }),
      Object.freeze({ id: 'official-pack-professional', billing: 'one-time', price: 19 }),
      Object.freeze({ id: 'official-pack-signature', billing: 'one-time', price: 39 }),
      Object.freeze({ id: 'eon-plus', billing: 'monthly', price: 4.99 }),
      Object.freeze({ id: 'eon-plus', billing: 'annual', price: 49 }),
      Object.freeze({ id: 'eon-studio', billing: 'monthly', price: 12.99 }),
      Object.freeze({ id: 'eon-studio', billing: 'annual', price: 129 }),
      Object.freeze({ id: 'eon-team', billing: 'per-seat-monthly', price: 19, minimumSeats: 3 }),
      Object.freeze({ id: 'eon-team', billing: 'per-seat-annual', price: 190, minimumSeats: 3 }),
      Object.freeze({ id: 'eon-scale', billing: 'organisation-monthly', price: 199, includedSeats: 10 })
    ])
  })
});

export const R4_COMM02_TIER_DESIGN = Object.freeze([
  Object.freeze({
    id: 'eon-free',
    state: 'active-local',
    purpose: 'Generous local-first core with 32 active official Blueprints, 16 approval-first workflows, Apps, Workspace, Insights and data portability.',
    lockRule: 'Do not lock basic local work, exports, backup guidance, safety controls, ordinary workflows or artificial AI-message quotas.'
  }),
  Object.freeze({
    id: 'eon-plus',
    state: 'planned-not-for-sale',
    purpose: 'Maintained professional Pack collection, version notes and migrations.',
    gate: 'Build and maintain 24 Pro Pack deliverables, verified billing lifecycle, cancellation path and AI-first support operations.'
  }),
  Object.freeze({
    id: 'eon-studio',
    state: 'planned-not-for-sale',
    purpose: 'Deeper solo creator, business and research operating systems with reusable dashboards.',
    gate: 'Prove distinctive recurring value beyond Plus; no hosted AI token quota is implied.'
  }),
  Object.freeze({
    id: 'eon-team',
    state: 'future-specification-only',
    purpose: 'Small-team workspaces, roles, shared Pack use and administration.',
    gate: 'No sale before role controls, shared workspaces, audit trail, billing admin and data controls are built and tested.'
  }),
  Object.freeze({
    id: 'eon-scale',
    state: 'future-specification-only',
    purpose: 'Self-service organisation plan for up to ten seats with administration, policy controls and automated reporting.',
    gate: 'No sale before organisation roles, audit exports, workspace controls and an automated service-status/support system exist. It is not Enterprise.'
  }),
  Object.freeze({
    id: 'eon-enterprise',
    state: 'future-contract-only',
    purpose: 'A genuine governed deployment for organisations requiring SSO, contractual terms, data governance and human escalation.',
    gate: 'Do not publish, sell or label anything Enterprise until those capabilities and an accountable operating owner exist.'
  })
]);

export const R4_COMM02_SUPPORT_MODEL = Object.freeze({
  publicName: 'AI-first self-service support',
  state: 'planned-not-active',
  includes: Object.freeze([
    'EONBOT product guidance and diagnostics',
    'Searchable help and known-issue content',
    'Self-service billing portal supplied by the chosen provider where available',
    'Automated access and receipt checks',
    'Asynchronous owner escalation only for failed paid access, privacy deletion, security and unresolved billing exceptions'
  ]),
  boundaries: Object.freeze([
    'No live-chat promise.',
    'No onboarding call, consulting or account-management promise.',
    'No statement that a processor handles all product support.',
    'No fixed human response-time guarantee until an actual staffed support operation exists.'
  ]),
  principle: 'AI can absorb routine support. It cannot remove the seller’s responsibility to handle exceptional product-access, security, privacy or payment cases.'
});

export function validateR4Comm02Contract() {
  const errors = [];
  if (Object.values(R4_COMM02_FEATURE_FLAGS).some(Boolean)) errors.push('R4-COMM-02 must not activate commerce, rewards or providers.');
  if (R4_COMM02_PROVIDER_STRATEGY.primaryCandidate.name !== 'Dodo Payments') errors.push('Dodo Payments must remain the primary research candidate.');
  if (R4_COMM02_PROVIDER_STRATEGY.backupCandidate.name !== 'Lemon Squeezy') errors.push('Lemon Squeezy must remain the backup research candidate.');
  if (R4_COMM02_EON_INVITE.status !== 'planned-not-active-provider-approval-required') errors.push('EON Invite must remain inactive until provider approval and server proof exist.');
  if (R4_COMM02_EON_INVITE.prohibited.includes('commission') === false || R4_COMM02_EON_INVITE.prohibited.includes('multilevel reward') === false) errors.push('EON Invite must block affiliate-style and multilevel rewards.');
  if (!R4_COMM02_EON_INVITE.proposedBenefit.milestone.includes('30-day Plus extension')) errors.push('EON Invite must model the agreed non-cash product milestone.');
  if (R4_COMM02_PRICE_BOOKS.status !== 'planned-not-public-not-for-sale') errors.push('Price books must remain planning-only.');
  if (R4_COMM02_PRICE_BOOKS.global.entries.find((entry) => entry.id === 'eon-scale')?.price !== 199) errors.push('Global EON Scale plan must remain a future $199 organisation plan.');
  if (R4_COMM02_TIER_DESIGN.find((entry) => entry.id === 'eon-enterprise')?.state !== 'future-contract-only') errors.push('Enterprise must remain a future contract-only capability.');
  return Object.freeze(errors);
}
