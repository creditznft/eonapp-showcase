/** W628 — provider-origin billing lifecycle and certification truth. */
const freeze = Object.freeze;
export const W628_BILLING_LIFECYCLE_SCHEMA = 'eonapp.billing.lifecycle.w628.v1';
export const W628_ACCESS_STATUSES = freeze(['free', 'trialing', 'active', 'cancelling', 'grace', 'past_due', 'revoked', 'disputed']);
export const W628_REAL_EVIDENCE_KEYS = freeze([
  'realCheckout', 'providerWebhook', 'd1Ledger', 'entitlementActivation', 'crossSessionRefresh',
  'portal', 'cancellation', 'reactivation', 'failedPayment', 'refund', 'dispute', 'duplicateReplay',
  'outOfOrder', 'forgedRejected', 'tierChange', 'receiptTaxLinks', 'rollbackSupport'
]);

const PAID = new Set(['plus', 'studio', 'power', 'max', 'pro', 'ultra']);
const ACTIVE = new Set(['trialing', 'active', 'cancelling', 'grace']);
const REVOKE_EVENTS = new Set(['subscription_expired', 'payment_refunded', 'chargeback_lost']);
const HARD_DISPUTE_EVENTS = new Set(['chargeback_opened']);
const SUCCESS_EVENTS = new Set(['trial_started', 'payment_succeeded', 'subscription_renewed', 'subscription_active', 'plan_changed']);

function text(value = '', max = 160) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9._:@/?=&%-]/g, '').slice(0, max);
}
function tier(value = '') { const candidate = text(value, 24).toLowerCase(); return PAID.has(candidate) ? candidate : 'free'; }
function epoch(value = 0) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Math.floor(Number(value));
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function boundedGraceHours(value = 0) { return Math.min(72, Math.max(0, Math.floor(Number(value) || 0))); }

export function normalizeBillingLifecycleEvent(candidate = {}, { now = Date.now(), graceHours = 0 } = {}) {
  const occurredAt = epoch(candidate.occurredAt || candidate.occurred_at || candidate.timestamp) || now;
  const currentPeriodEnd = epoch(candidate.currentPeriodEnd || candidate.current_period_end || candidate.nextBillingDate || candidate.next_billing_date);
  const trialEndsAt = epoch(candidate.trialEndsAt || candidate.trial_ends_at || candidate.trial_end);
  const explicitGrace = epoch(candidate.graceEndsAt || candidate.grace_ends_at);
  const graceEndsAt = explicitGrace || (boundedGraceHours(graceHours) > 0 ? occurredAt + boundedGraceHours(graceHours) * 3600000 : 0);
  return freeze({
    schema: W628_BILLING_LIFECYCLE_SCHEMA,
    providerEventId: text(candidate.providerEventId || candidate.provider_event_id, 160),
    rawEventType: text(candidate.rawEventType || candidate.raw_event_type, 96).toLowerCase(),
    eventType: text(candidate.eventType || candidate.event_type, 64).toLowerCase() || 'ignored',
    accountId: text(candidate.accountId || candidate.account_id, 80),
    tierId: tier(candidate.tierId || candidate.tier_id),
    providerCustomerRef: text(candidate.providerCustomerRef || candidate.provider_customer_ref, 128),
    providerSubscriptionRef: text(candidate.providerSubscriptionRef || candidate.provider_subscription_ref, 128),
    checkoutAttemptId: text(candidate.checkoutAttemptId || candidate.checkout_attempt_id, 128),
    paymentRef: text(candidate.paymentRef || candidate.payment_ref, 128),
    providerStatus: text(candidate.providerStatus || candidate.provider_status, 48).toLowerCase(),
    cancelAtPeriodEnd: candidate.cancelAtPeriodEnd === true || candidate.cancel_at_next_billing_date === true,
    currentPeriodEnd,
    trialEndsAt,
    graceEndsAt,
    invoiceUrl: safeBillingLink(candidate.invoiceUrl || candidate.invoice_url),
    receiptUrl: safeBillingLink(candidate.receiptUrl || candidate.receipt_url),
    occurredAt
  });
}

export function safeBillingLink(value = '') {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return '';
    const host = url.hostname.toLowerCase();
    if (host === 'dodopayments.com' || host.endsWith('.dodopayments.com')) return url.href;
    return '';
  } catch { return ''; }
}

export function isBillingEventStale(current = null, event = {}) {
  const previous = epoch(current?.source_occurred_at || current?.sourceOccurredAt);
  const incoming = epoch(event?.occurredAt || event?.occurred_at);
  return previous > 0 && incoming > 0 && incoming < previous;
}

export function deriveBillingTransition(current = null, candidate = {}, { now = Date.now(), graceHours = 0 } = {}) {
  const event = normalizeBillingLifecycleEvent(candidate, { now, graceHours });
  const prior = freeze({
    tierId: tier(current?.tier_id || current?.tierId),
    status: W628_ACCESS_STATUSES.includes(current?.access_status || current?.status) ? (current.access_status || current.status) : 'free',
    currentPeriodEnd: epoch(current?.current_period_end || current?.currentPeriodEnd),
    trialEndsAt: epoch(current?.trial_ends_at || current?.trialEndsAt),
    graceEndsAt: epoch(current?.grace_ends_at || current?.graceEndsAt),
    cancelAtPeriodEnd: current?.cancel_at_period_end === 1 || current?.cancelAtPeriodEnd === true,
    sourceOccurredAt: epoch(current?.source_occurred_at || current?.sourceOccurredAt)
  });
  if (isBillingEventStale(current, event)) return freeze({ applied: false, stale: true, reason: 'out_of_order_event', event, previous: prior, next: prior, accessActive: ACTIVE.has(prior.status) && (prior.status !== 'grace' || prior.graceEndsAt > now) });

  let nextTier = event.tierId !== 'free' ? event.tierId : prior.tierId;
  let status = prior.status;
  const reason = event.eventType;
  const cancelAtPeriodEnd = event.cancelAtPeriodEnd;
  const currentPeriodEnd = event.currentPeriodEnd || prior.currentPeriodEnd;
  const trialEndsAt = event.trialEndsAt || prior.trialEndsAt;
  let graceEndsAt = prior.graceEndsAt;

  if (SUCCESS_EVENTS.has(event.eventType)) {
    status = trialEndsAt > now ? 'trialing' : (cancelAtPeriodEnd ? 'cancelling' : 'active');
    graceEndsAt = 0;
  } else if (event.eventType === 'subscription_updated') {
    status = cancelAtPeriodEnd ? 'cancelling' : 'active';
    graceEndsAt = 0;
  } else if (event.eventType === 'subscription_cancelled') {
    if ((currentPeriodEnd > now) || cancelAtPeriodEnd) status = 'cancelling';
    else { status = 'revoked'; nextTier = 'free'; }
  } else if (event.eventType === 'payment_failed' || event.eventType === 'subscription_on_hold') {
    graceEndsAt = event.graceEndsAt;
    status = graceEndsAt > now ? 'grace' : 'past_due';
  } else if (HARD_DISPUTE_EVENTS.has(event.eventType)) {
    status = 'disputed'; nextTier = 'free'; graceEndsAt = 0;
  } else if (REVOKE_EVENTS.has(event.eventType)) {
    status = 'revoked'; nextTier = 'free'; graceEndsAt = 0;
  } else if (event.eventType === 'chargeback_won') {
    status = cancelAtPeriodEnd ? 'cancelling' : 'active';
  } else if (event.eventType === 'ignored' || event.eventType === 'refund_failed' || event.eventType === 'subscription_failed') {
    return freeze({ applied: false, stale: false, reason: 'no_entitlement_change', event, previous: prior, next: prior, accessActive: ACTIVE.has(prior.status) && (prior.status !== 'grace' || prior.graceEndsAt > now) });
  }

  const next = freeze({
    tierId: nextTier,
    status,
    providerStatus: event.providerStatus,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    trialEndsAt,
    graceEndsAt,
    sourceOccurredAt: event.occurredAt,
    reason
  });
  return freeze({ applied: true, stale: false, reason, event, previous: prior, next, accessActive: ACTIVE.has(status) && nextTier !== 'free' && (status !== 'grace' || graceEndsAt > now) });
}

export function buildBillingPublicState(entitlement = null, lifecycle = null, { now = Date.now() } = {}) {
  const status = String(lifecycle?.access_status || entitlement?.status || 'free');
  const currentPeriodEnd = epoch(lifecycle?.current_period_end || entitlement?.renews_at);
  const graceEndsAt = epoch(lifecycle?.grace_ends_at);
  const accessActive = ACTIVE.has(status) && String(entitlement?.tier_id || lifecycle?.tier_id || 'free') !== 'free' && (status !== 'grace' || graceEndsAt > now);
  return freeze({
    schema: W628_BILLING_LIFECYCLE_SCHEMA,
    tierId: tier(entitlement?.tier_id || lifecycle?.tier_id),
    status,
    accessActive,
    cancelAtPeriodEnd: lifecycle?.cancel_at_period_end === 1 || lifecycle?.cancelAtPeriodEnd === true,
    currentPeriodEnd,
    trialEndsAt: epoch(lifecycle?.trial_ends_at),
    graceEndsAt,
    providerCustomerAvailable: Boolean(lifecycle?.provider_customer_ref || entitlement?.provider_customer_ref),
    providerSubscriptionAvailable: Boolean(lifecycle?.provider_subscription_ref || entitlement?.provider_subscription_ref),
    invoiceUrl: safeBillingLink(lifecycle?.last_invoice_url),
    receiptUrl: safeBillingLink(lifecycle?.last_receipt_url),
    reason: text(lifecycle?.reason || entitlement?.reason, 64),
    serverAuthoritative: true,
    browserUnlockAllowed: false
  });
}

export function redactBillingEvidence(candidate = {}) {
  const rows = Array.isArray(candidate.rows) ? candidate.rows : [];
  return freeze({
    schema: 'eonapp.billing.evidence.w628.v1',
    generatedAt: new Date().toISOString(),
    rows: freeze(rows.slice(0, 100).map((row) => freeze({
      proof: text(row.proof, 80),
      status: ['pass', 'fail', 'pending', 'blocked'].includes(row.status) ? row.status : 'pending',
      observedAt: text(row.observedAt, 40),
      providerEventType: text(row.providerEventType, 80),
      httpStatus: Number(row.httpStatus || 0) || 0,
      duplicate: row.duplicate === true,
      outOfOrder: row.outOfOrder === true,
      digest: text(row.digest, 96)
    }))),
    containsCustomerEmail: false,
    containsCardData: false,
    containsWebhookSecret: false,
    containsApiKey: false,
    containsRawPayload: false
  });
}

export function buildBillingCertificationBoard(evidence = {}) {
  const rows = Object.fromEntries(W628_REAL_EVIDENCE_KEYS.map((key) => [key, evidence[key] === true ? 'pass' : 'pending']));
  const passedCount = Object.values(rows).filter((value) => value === 'pass').length;
  const pass = passedCount === W628_REAL_EVIDENCE_KEYS.length && evidence.realDodoOrigin === true && evidence.realCustomer === true && evidence.realD1 === true;
  return freeze({
    schema: 'eonapp.billing.certification.w628f.v1',
    rows: freeze(rows),
    passedCount,
    totalCount: W628_REAL_EVIDENCE_KEYS.length,
    pass,
    verdict: pass ? 'go-genuine-dodo-billing-certified' : 'no-go-real-dodo-lifecycle-evidence-pending',
    publicAvailabilityClaimAllowed: pass,
    sourceIntegrationAloneCanPass: false,
    syntheticWebhookCanPass: false
  });
}

export function getW628BillingTruth() {
  return freeze({
    hostedCheckoutOnly: true,
    webhookAndServerLedgerAuthority: true,
    browserCallbackCanGrant: false,
    duplicateRepairRequired: true,
    outOfOrderMustNotOverwrite: true,
    portalAndActionsRequireSignedInOwner: true,
    cancelAtPeriodEndPreservesAccessUntilPeriodEnd: true,
    refundsAndLostDisputesRevoke: true,
    localDataRetentionIndependentFromBilling: true,
    sourceIntegrationAloneCanPass: false,
    realDodoOriginRequired: true
  });
}
