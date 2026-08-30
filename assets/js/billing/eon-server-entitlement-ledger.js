import {
  W619_DODO_SERVER_LEDGER_SCHEMA,
  W619_FREE_TIER_ID,
  W619_PAID_TIER_IDS,
  W619_RECOGNIZED_PROVIDER_EVENTS,
  W619_REFERRAL_RULES,
  W619_RUNTIME_FLAGS,
  decideW619PaidActivation,
  getW619DodoServerLedgerPlan,
  validateW619DodoServerLedgerContract
} from '../../../config/w619-dodo-server-ledger-contract.mjs';

const SAFE_TEXT = /[^a-zA-Z0-9._:@/-]/g;
const DISABLED_REASON = 'Dodo checkout, trials, webhook processing, entitlement writes, referral grants and EON Key redemption are disabled until server proof and CEO activation exist.';

function freeze(value) {
  return Object.freeze(value);
}

function cleanText(value = '', max = 128) {
  return String(value || '').trim().replace(SAFE_TEXT, '').slice(0, max);
}

function cleanTier(value = '') {
  const tier = cleanText(value, 24).toLowerCase();
  return W619_PAID_TIER_IDS.includes(tier) ? tier : W619_FREE_TIER_ID;
}

function cleanEventType(value = '') {
  const eventType = cleanText(value, 64).toLowerCase();
  return W619_RECOGNIZED_PROVIDER_EVENTS.includes(eventType) ? eventType : '';
}

function hasAnyEnabledRuntimeFlag(flags = W619_RUNTIME_FLAGS) {
  return Object.values(flags).some((value) => value !== false);
}

export function buildW619PublicBillingStatus(input = {}) {
  const plan = getW619DodoServerLedgerPlan();
  const activation = decideW619PaidActivation(input.proof || {});
  return freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    lifecycle: plan.lifecycle,
    checkoutActive: false,
    trialActive: false,
    dodoWebhookAdapterLive: false,
    entitlementLedgerWriteEnabled: false,
    referralLedgerWriteEnabled: false,
    eonKeyRedemptionActive: false,
    browserUnlockAllowed: false,
    paidTiers: freeze([...W619_PAID_TIER_IDS]),
    decision: activation.decision,
    blockers: activation.blockers,
    warnings: activation.warnings,
    message: DISABLED_REASON,
    supportRoute: '/billing'
  });
}

export function createW619CheckoutPreparationDecision(input = {}) {
  const tierId = cleanTier(input.tierId || input.tier || '');
  const errors = [];
  if (tierId === W619_FREE_TIER_ID) errors.push('Only paid tiers can request future Dodo checkout preparation.');
  if (input.browserEntitlementClaim) errors.push('Browser entitlement claims are never accepted as payment or access proof.');
  if (input.clientPaymentCallback) errors.push('Client payment callbacks are not settlement proof.');
  if (input.activation?.enablePaidActivation === true) errors.push('W619 source cannot enable paid activation; Codex/server proof and a later reviewed wave are required.');
  return freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    ok: false,
    status: 'disabled',
    tierId,
    checkoutCreated: false,
    networkRequestCreated: false,
    paymentRequestCreated: false,
    trialCreated: false,
    entitlementCreated: false,
    dodoProductIdExposedToBrowser: false,
    reason: errors[0] || DISABLED_REASON,
    errors: freeze(errors),
    nextRequiredProof: freeze(['Dodo product proof', 'hosted checkout proof', 'signed webhook proof', 'server entitlement ledger idempotency proof', 'Cloudflare deploy proof'])
  });
}

export function normalizeVerifiedDodoEvent(input = {}) {
  const provider = cleanText(input.provider || 'dodo', 24).toLowerCase();
  const eventType = cleanEventType(input.eventType || input.type || '');
  const providerEventId = cleanText(input.providerEventId || input.eventId || '', 128);
  const accountId = cleanText(input.accountId || '', 96);
  const tierId = cleanTier(input.tierId || '');
  const providerCustomerRef = cleanText(input.providerCustomerRef || '', 128);
  const providerSubscriptionRef = cleanText(input.providerSubscriptionRef || '', 128);
  const occurredAt = Number.isFinite(Number(input.occurredAt)) ? Number(input.occurredAt) : 0;
  const errors = [];
  if (provider !== 'dodo') errors.push('Only Dodo events are recognized by this contract.');
  if (!eventType) errors.push('Unrecognized provider event type.');
  if (!providerEventId) errors.push('Missing provider event id for idempotency.');
  if (!accountId) errors.push('Missing server account id.');
  if (tierId === W619_FREE_TIER_ID && ['trial_started', 'payment_succeeded', 'subscription_renewed'].includes(eventType)) errors.push('Paid/trial events require a paid tier id.');
  if (input.sourceVerified !== true) errors.push('Provider signature/source verification is required before ledger normalization.');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    provider,
    eventType,
    providerEventId,
    accountId,
    tierId,
    providerCustomerRef,
    providerSubscriptionRef,
    occurredAt,
    sourceVerified: input.sourceVerified === true
  });
}

export function applyVerifiedDodoEventToSnapshot(snapshot = {}, input = {}) {
  const event = normalizeVerifiedDodoEvent(input);
  const events = new Map(Object.entries(snapshot.events || {}));
  const entitlements = new Map(Object.entries(snapshot.entitlements || {}));
  if (!event.ok) return freeze({ ok: false, errors: event.errors, duplicate: false, snapshot: freeze({ events: freeze(Object.fromEntries(events)), entitlements: freeze(Object.fromEntries(entitlements)) }) });
  if (events.has(event.providerEventId)) {
    return freeze({ ok: true, duplicate: true, event, entitlementChanged: false, snapshot: freeze({ events: freeze(Object.fromEntries(events)), entitlements: freeze(Object.fromEntries(entitlements)) }) });
  }
  events.set(event.providerEventId, freeze({ provider: event.provider, eventType: event.eventType, tierId: event.tierId, accountId: event.accountId }));
  const current = entitlements.get(event.accountId) || freeze({ tierId: W619_FREE_TIER_ID, status: 'free', sourceEventId: '' });
  let next = current;
  if (['trial_started', 'payment_succeeded', 'subscription_renewed'].includes(event.eventType)) {
    next = freeze({ tierId: event.tierId, status: event.eventType === 'trial_started' ? 'trialing' : 'active', sourceProvider: 'dodo', sourceEventId: event.providerEventId, providerSubscriptionRef: event.providerSubscriptionRef });
  }
  if (['subscription_cancelled', 'subscription_expired', 'payment_refunded', 'chargeback_opened', 'chargeback_lost'].includes(event.eventType)) {
    next = freeze({ tierId: W619_FREE_TIER_ID, status: 'revoked', sourceProvider: 'dodo', sourceEventId: event.providerEventId, providerSubscriptionRef: event.providerSubscriptionRef, reason: event.eventType });
  }
  entitlements.set(event.accountId, next);
  return freeze({
    ok: true,
    duplicate: false,
    event,
    entitlementChanged: next !== current,
    entitlement: next,
    snapshot: freeze({ events: freeze(Object.fromEntries(events)), entitlements: freeze(Object.fromEntries(entitlements)) })
  });
}

export function buildReferralGrantDecision(input = {}) {
  const paid = input.inviteePaid === true;
  const retainedDays = Number(input.retainedDays || 0);
  const refunded = input.refunded === true;
  const disputed = input.disputed === true;
  const yearlyCount = Number(input.inviterPaidRewardCountThisYear || 0);
  const errors = [];
  if (input.browserQueryParamGrant === true) errors.push('Browser query parameters cannot grant EON Keys.');
  if (input.multiLevel === true) errors.push('Multi-level referral grants are prohibited.');
  if (input.rewardType && !['signal', 'builder', 'power'].includes(cleanText(input.rewardType, 24).toLowerCase())) errors.push('Reward type must be a non-transferable EON Key.');
  if (paid && retainedDays < W619_REFERRAL_RULES.retentionDaysBeforePaidMilestone) errors.push('Paid referral milestone is still pending the 14-day retention check.');
  if (refunded || disputed) errors.push('Refunded or disputed paid referrals cannot grant paid milestone keys.');
  if (yearlyCount >= W619_REFERRAL_RULES.maxPaidReferralRewardsPerInviterPerYear) errors.push('Inviter yearly paid-referral reward cap reached.');
  return freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    liveNow: false,
    ok: errors.length === 0 && input.serverLedgerProof === true,
    rewardStatus: errors.length ? 'blocked-or-pending' : (input.serverLedgerProof === true ? 'eligible-after-future-activation' : 'server-proof-required'),
    keyType: cleanText(input.rewardType || (paid ? 'builder' : 'signal'), 24).toLowerCase(),
    errors: freeze(errors),
    grantCreated: false,
    cashOrDiscountCreated: false,
    walletOrCryptoCreated: false,
    transferable: false,
    browserGrantAccepted: false,
    rule: W619_REFERRAL_RULES.rail
  });
}

export function rejectBrowserEntitlementClaim(input = {}) {
  return freeze({
    schema: W619_DODO_SERVER_LEDGER_SCHEMA,
    ok: false,
    rejected: true,
    claimedTier: cleanTier(input.tierId || input.claimedTier || ''),
    source: cleanText(input.source || 'browser', 64),
    entitlementCreated: false,
    keyGrantCreated: false,
    reason: 'Paid access and EON Key grants require server-ledger proof. localStorage, query parameters, client callbacks and editable browser state are rejected.'
  });
}

export function validateW619ServerLedgerModel() {
  const errors = [];
  const contract = validateW619DodoServerLedgerContract();
  if (!contract.ok) errors.push(...contract.errors);
  if (hasAnyEnabledRuntimeFlag()) errors.push('A W619 runtime flag is enabled.');
  const checkout = createW619CheckoutPreparationDecision({ tierId: 'plus', browserEntitlementClaim: true });
  if (checkout.checkoutCreated || checkout.entitlementCreated || checkout.networkRequestCreated) errors.push('Checkout preparation must not create network/payment/entitlement state.');
  const rejected = rejectBrowserEntitlementClaim({ claimedTier: 'max', source: 'localStorage' });
  if (!rejected.rejected || rejected.entitlementCreated || rejected.keyGrantCreated) errors.push('Browser entitlement claim was not rejected.');
  const event = normalizeVerifiedDodoEvent({ sourceVerified: true, providerEventId: 'evt_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'studio' });
  if (!event.ok) errors.push(`Verified Dodo event did not normalize: ${event.errors.join(', ')}`);
  const first = applyVerifiedDodoEventToSnapshot({}, { sourceVerified: true, providerEventId: 'evt_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'studio' });
  const second = applyVerifiedDodoEventToSnapshot(first.snapshot, { sourceVerified: true, providerEventId: 'evt_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'studio' });
  if (!first.ok || first.duplicate || first.entitlement?.tierId !== 'studio' || first.entitlement?.status !== 'active') errors.push('Verified payment snapshot did not activate the simulated server entitlement.');
  if (!second.ok || !second.duplicate || second.entitlementChanged) errors.push('Duplicate provider event did not remain idempotent.');
  const revoked = applyVerifiedDodoEventToSnapshot(first.snapshot, { sourceVerified: true, providerEventId: 'evt_2', eventType: 'payment_refunded', accountId: 'acc_1', tierId: 'studio' });
  if (!revoked.ok || revoked.entitlement?.status !== 'revoked') errors.push('Refund event did not revoke the simulated server entitlement.');
  const referral = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 7, rewardType: 'builder', serverLedgerProof: true });
  if (referral.ok || !referral.errors.some((error) => /14-day/.test(error))) errors.push('Referral paid milestone must wait for 14-day retention.');
  const capped = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 21, rewardType: 'power', inviterPaidRewardCountThisYear: 3, serverLedgerProof: true });
  if (capped.ok || !capped.errors.some((error) => /cap/.test(error))) errors.push('Referral yearly cap was not enforced.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: W619_DODO_SERVER_LEDGER_SCHEMA, checks: 31 });
}

export default freeze({
  buildW619PublicBillingStatus,
  createW619CheckoutPreparationDecision,
  normalizeVerifiedDodoEvent,
  applyVerifiedDodoEventToSnapshot,
  buildReferralGrantDecision,
  rejectBrowserEntitlementClaim,
  validateW619ServerLedgerModel
});
