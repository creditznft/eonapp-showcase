/**
 * W620 — EON Keys feature-unlock ledger contract.
 *
 * This is a pure, source-level model for the CEO referral decision:
 * referrals unlock individual app features, limits and cosmetics through
 * non-transferable EON Keys. They do not grant cash, wallets, tokens, NFTs,
 * commissions, renewal discounts, free months or browser-only subscriptions.
 *
 * The model is intentionally generous over time, but it does not promise
 * permanent all-Max access from unlimited invites. Max-level access remains
 * short, selected feature passes unless a later server-reviewed plan changes it.
 */
import {
  EON_AI_COST_BOUNDARY,
  EON_KEY_TYPES,
  EON_KEY_UNLOCK_MENU,
  EON_REFERRAL_REWARD_MATRIX,
  EON_SUBSCRIPTION_TIERS
} from './eon-keys-catalog.js';

export const EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA = 'eonapp.referrals.eon-keys-feature-unlock-ledger.w620.v1';
export const EON_KEYS_FEATURE_UNLOCK_LEDGER_VERSION = 1;

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));
const clean = (value = '', max = 128) => String(value ?? '').replace(/[^a-z0-9_.:-]/gi, '').slice(0, max);
const nowMs = () => Date.now();

export const EON_KEYS_CEO_REFERRAL_DECISION = freeze({
  schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA,
  decision: 'feature-unlocks-not-subscription-rewards',
  liveNow: false,
  serverLedgerRequired: true,
  browserInviteCannotGrant: true,
  oneLevelOnly: true,
  inviteClickReward: false,
  freeActivationCanEarnSignalKey: true,
  paidReferralCanEarnBuilderOrPowerKeyAfterRetention: true,
  paidRetentionDays: 14,
  maxPaidReferralRewardsPerInviterPerYear: 3,
  maxMonthlyFreeSignalGrants: 5,
  userCanAccumulateManyFeatureUnlocksOverTime: true,
  permanentFullSubscriptionGrant: false,
  permanentAllMaxFeaturesFree: false,
  selectedMaxFeaturePassesAllowed: true,
  platformPaidAiCreditsIncluded: false,
  aiRail: EON_AI_COST_BOUNDARY.defaultGenerationRail,
  prohibitedRewards: freeze(['cash', 'upi', 'paypal', 'gift_card', 'wallet', 'crypto', 'token', 'nft', 'commission', 'payout', 'free_month', 'renewal_discount', 'lottery', 'multi_level_income'])
});

export const EON_KEYS_UNLOCK_POLICY = freeze({
  schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA,
  keyTypes: freeze(EON_KEY_TYPES.map((key) => key.id)),
  paidTierIds: freeze(EON_SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free').map((tier) => tier.id)),
  unlockCategories: freeze([...new Set(EON_KEY_UNLOCK_MENU.map((unlock) => unlock.category))]),
  directUnlockOnly: true,
  subscriptionEquivalentCopyAllowed: true,
  subscriptionEntitlementCreated: false,
  browserRedeemActive: false,
  serverRedeemRequired: true,
  revocableWhenFraudRefundOrDispute: true
});

export function summarizeEonKeyUnlockCoverage() {
  const byKey = new Map();
  const byPlan = new Map();
  const permanent = [];
  const temporary = [];
  for (const unlock of EON_KEY_UNLOCK_MENU) {
    const key = clean(unlock.keyType || 'unknown', 32);
    const plan = clean(unlock.planEquivalent || 'none', 48);
    byKey.set(key, (byKey.get(key) || 0) + 1);
    byPlan.set(plan, (byPlan.get(plan) || 0) + 1);
    if (unlock.permanent === true) permanent.push(unlock.id);
    if (Number(unlock.durationDays || 0) > 0) temporary.push(unlock.id);
  }
  return freeze({
    schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA,
    unlockCount: EON_KEY_UNLOCK_MENU.length,
    keyTypeCount: EON_KEY_TYPES.length,
    byKeyType: freeze(Object.fromEntries(byKey)),
    byPlanEquivalent: freeze(Object.fromEntries(byPlan)),
    permanentUnlockCount: permanent.length,
    temporaryUnlockCount: temporary.length,
    coversPlusStudioPowerAndSelectedMax: ['plus', 'studio', 'power', 'max'].every((plan) => byPlan.has(plan)),
    platformPaidAiCost: false,
    directFeatureAndLimitUnlocks: true,
    subscriptionGrant: false
  });
}

export function chooseEonKeyUnlock({ keyType = 'signal', requestedUnlockId = '', alreadyGrantedIds = [] } = {}) {
  const normalizedKey = clean(keyType, 32).toLowerCase();
  const requested = clean(requestedUnlockId, 96);
  const granted = new Set((Array.isArray(alreadyGrantedIds) ? alreadyGrantedIds : []).map((item) => clean(item, 96)));
  const candidates = EON_KEY_UNLOCK_MENU.filter((unlock) => unlock.keyType === normalizedKey && !granted.has(unlock.id));
  const selected = (requested && candidates.find((unlock) => unlock.id === requested)) || candidates[0] || null;
  if (!selected) {
    return freeze({ ok: false, schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA, reason: 'no-unspent-unlock-choice', unlock: null, entitlementCreated: false, subscriptionCreated: false });
  }
  return freeze({
    ok: true,
    schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA,
    keyType: normalizedKey,
    unlock: freeze(clone(selected)),
    directFeatureUnlock: true,
    entitlementCreated: false,
    subscriptionCreated: false,
    platformPaidAiCost: false,
    requiresUserLocalOrOwnProviderKey: Boolean(selected.requiresUserLocalOrOwnProviderKey),
    transferable: false,
    cashValue: false
  });
}

export function buildEonKeyGrantPreview(input = {}) {
  const eventType = clean(input.eventType || 'activated-free-invite', 64).toLowerCase();
  const paid = eventType === 'first-payment' || eventType === 'paid-milestone' || input.inviteePaid === true;
  const retainedDays = Number(input.retainedDays || 0);
  const freeSignalCountThisMonth = Number(input.freeSignalCountThisMonth || 0);
  const paidRewardCountThisYear = Number(input.paidRewardCountThisYear || 0);
  const browserQueryParamGrant = input.browserQueryParamGrant === true;
  const refundedOrDisputed = input.refunded === true || input.disputed === true;
  const serverLedgerProof = input.serverLedgerProof === true;
  const errors = [];

  if (browserQueryParamGrant) errors.push('Browser invite/query state cannot grant EON Keys.');
  if (input.multiLevel === true) errors.push('Multi-level referrals are not allowed.');
  if (eventType === 'invite-click') errors.push('Invite clicks never grant rewards.');
  if (!serverLedgerProof) errors.push('Server referral ledger proof is required before a grant can be live.');
  if (!paid && freeSignalCountThisMonth >= EON_KEYS_CEO_REFERRAL_DECISION.maxMonthlyFreeSignalGrants) errors.push('Monthly free Signal Key cap reached.');
  if (paid && retainedDays < EON_KEYS_CEO_REFERRAL_DECISION.paidRetentionDays) errors.push('Paid referral must pass the 14-day retained/no-refund check.');
  if (paid && paidRewardCountThisYear >= EON_KEYS_CEO_REFERRAL_DECISION.maxPaidReferralRewardsPerInviterPerYear) errors.push('Yearly paid-referral reward cap reached.');
  if (refundedOrDisputed) errors.push('Refunded or disputed paid referrals cannot grant keys.');

  const keyType = eventType === 'paid-milestone' ? 'power' : (paid ? 'builder' : 'signal');
  const unlockDecision = chooseEonKeyUnlock({ keyType, requestedUnlockId: input.requestedUnlockId, alreadyGrantedIds: input.alreadyGrantedIds });

  return freeze({
    schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA,
    liveNow: false,
    ok: errors.length === 0 && unlockDecision.ok,
    keyType,
    eventType,
    rewardRail: 'non-transferable-feature-unlock',
    errors: freeze(errors),
    previewUnlock: unlockDecision.ok ? unlockDecision.unlock : null,
    grantCreated: false,
    subscriptionCreated: false,
    fullMaxAccessCreated: false,
    cashOrDiscountCreated: false,
    walletOrCryptoCreated: false,
    transferable: false,
    browserGrantAccepted: false,
    issuedAt: input.issuedAt || nowMs()
  });
}

export function validateEonKeysFeatureUnlockLedger() {
  const errors = [];
  const coverage = summarizeEonKeyUnlockCoverage();
  if (coverage.unlockCount < 20) errors.push('EON Keys unlock menu is too thin for direct feature/limit unlocks.');
  if (!coverage.coversPlusStudioPowerAndSelectedMax) errors.push('EON Keys must cover Plus, Studio, Power and selected Max equivalents.');
  if (coverage.subscriptionGrant !== false) errors.push('EON Keys must not create subscription entitlements.');
  if (EON_KEYS_CEO_REFERRAL_DECISION.permanentAllMaxFeaturesFree !== false) errors.push('Launch decision must not promise permanent all-Max access from referrals.');
  if (EON_KEYS_CEO_REFERRAL_DECISION.maxPaidReferralRewardsPerInviterPerYear > 3) errors.push('Paid referral yearly cap must stay at or below 3 for launch.');
  if (!EON_REFERRAL_REWARD_MATRIX.some((item) => item.id === 'activated-free-invite' && item.inviterReward.some((reward) => /Signal Key/.test(reward)))) errors.push('Activated free invite must map to Signal Key progress.');
  const click = buildEonKeyGrantPreview({ eventType: 'invite-click', serverLedgerProof: true });
  if (click.ok || !click.errors.some((error) => /clicks never grant/i.test(error))) errors.push('Invite clicks must not grant rewards.');
  const freePreview = buildEonKeyGrantPreview({ eventType: 'activated-free-invite', serverLedgerProof: true, freeSignalCountThisMonth: 0 });
  if (!freePreview.ok || freePreview.keyType !== 'signal' || freePreview.subscriptionCreated || freePreview.fullMaxAccessCreated) errors.push('Activated invite should preview only a Signal feature unlock.');
  const paidTooSoon = buildEonKeyGrantPreview({ eventType: 'first-payment', serverLedgerProof: true, retainedDays: 3 });
  if (paidTooSoon.ok || !paidTooSoon.errors.some((error) => /14-day/.test(error))) errors.push('Paid referral must wait for 14-day retention.');
  const capped = buildEonKeyGrantPreview({ eventType: 'paid-milestone', serverLedgerProof: true, retainedDays: 21, paidRewardCountThisYear: 3 });
  if (capped.ok || !capped.errors.some((error) => /cap/.test(error))) errors.push('Paid referral yearly cap must block additional grants.');
  const serialized = JSON.stringify({ coverage, decision: EON_KEYS_CEO_REFERRAL_DECISION, policy: EON_KEYS_UNLOCK_POLICY }).toLowerCase();
  const forbidden = [/cashback active/, /wallet balance created/, /crypto payout active/, /commission payout active/, /free month reward active/, /renewal discount reward active/, /all max features free forever/];
  for (const pattern of forbidden) if (pattern.test(serialized)) errors.push(`Forbidden referral promise matched: ${pattern.source}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_KEYS_FEATURE_UNLOCK_LEDGER_SCHEMA, checks: 16, coverage });
}

export default freeze({
  EON_KEYS_CEO_REFERRAL_DECISION,
  EON_KEYS_UNLOCK_POLICY,
  summarizeEonKeyUnlockCoverage,
  chooseEonKeyUnlock,
  buildEonKeyGrantPreview,
  validateEonKeysFeatureUnlockLedger
});
