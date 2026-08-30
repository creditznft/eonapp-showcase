import { getProfile, isAdminProfile } from './profile.js';
import { getTrustedNow, observeTrustedTime } from './trusted-time.js';

const STORAGE_KEY = 'eon:entitlements:v1';
const DEFAULT_RENEW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 80;
const MAX_BALANCE_CENTS = 1_000_000_000;
const MAX_RATE_CENTS_PER_EONL = 100_000;
const /** @type {any} */
ALLOWED_STATUS = new Set(['inactive', 'active', 'past_due', 'canceled']);
const /** @type {any} */
ALLOWED_PAYMENT_ASSETS = new Set(['stable', 'eonl', 'nowpayments', 'direct_evm', 'ad_sponsored']);
const appWin = /** @type {any} */ (window);
const rootScope = /** @type {any} */ (globalThis);

function trustedNowFloor() {
  try {
    return typeof getTrustedNow === 'function' ? getTrustedNow() : Date.now();
  } catch {
    return Date.now();
  }
}

function _observeTrustedFloor(/** @type {any} */ value) {
  try {
    return typeof observeTrustedTime === 'function' ? observeTrustedTime(value) : trustedNowFloor();
  } catch {
    return trustedNowFloor();
  }
}
void _observeTrustedFloor;

function recordSubAttr(/** @type {any} */ stage, /** @type {any} */ payload = {}) {
  try {
    if (rootScope.EONRecordSubscriptionAttribution) {
      rootScope.EONRecordSubscriptionAttribution(stage, payload);
      return;
    }
    import('./trust-telemetry.js')
      .then((/** @type {any} */ mod) => mod.recordSubscriptionAttribution?.(stage, payload))
      .catch(() => {});
  } catch {
    // ignore telemetry failures
  }
}

const LEGACY_PLAN_ALIASES = {
  spark: 'supporter',
  builder: 'core',
  operator: 'business'
};

export const /** @type {any} */
PLAN_DEFS = [
  { id: 'free',      label: 'Free',          stablePriceCents: 0,    monthlyEonl: 0,   features: ['Core tools', 'Core AI modes (Ask, Build, Code, Analyze, Hive)', 'Vault & IPFS', 'Pool Points 1x (500/day cap)', 'NFT lootbox drops', 'EON Browser'] },
  { id: 'supporter', label: 'EON Supporter', stablePriceCents: 100,  monthlyEonl: 5,   features: ['Ad-free', 'Priority AI routing', 'Voice (STT + TTS)', 'Multi-Language (20 langs)', 'Supporter perks'] },
  { id: 'starter',   label: 'EON Starter',   stablePriceCents: 300,  monthlyEonl: 15,  features: ['Everything in Supporter', 'Higher fair-use headroom', 'Priority queue', 'Starter vault perks'] },
  { id: 'core',      label: 'EON Core',      stablePriceCents: 500,  monthlyEonl: 25,  features: ['Creator Studio', 'Extra AI budget', 'Compute Marketplace', 'Automation rules', 'AI Agent mode', '11 supported languages', 'Bulk NFT merge'] },
  { id: 'pro',       label: 'EON Pro',       stablePriceCents: 1000, monthlyEonl: 50,  features: ['Monthly legendary lootbox', 'Advanced AI (Twin mode)', 'Priority inference', 'IoT Hub (25 devices)', 'Scene scheduling', 'AI voice music', 'Vault analytics', 'Governance lite'] },
  { id: 'creator',   label: 'EON Creator',   stablePriceCents: 2000, monthlyEonl: 100, features: ['Everything in Pro', 'Expanded creator quotas', 'Faster support', 'Deeper automation capacity'] },
  { id: 'business',  label: 'EON Business',  stablePriceCents: 5000, monthlyEonl: 250, features: ['On-chain governance', 'Priority epoch window', 'Full AI budget (unlimited)', 'IoT Hub (100 devices)', 'AI auto-moderation', 'Compute API access', 'Full operator workspace', 'Tools API access'] }
];
const PLAN_ORDER = PLAN_DEFS.map((/** @type {any} */ plan) => plan.id);

function defaultState() {
  return {
    ownerUid: '',
    activePlanId: 'free',
    status: 'inactive',
    paymentAsset: 'stable',
    stableBalanceCents: 0,
    stableCentsPerEonl: 20,
    autoRenew: false,
    renewsAt: null,
    txHistory: [],
    updatedAt: new Date().toISOString()
  };
}

function getCurrentProfileUid() {
  try {
    const profile = getProfile?.() || rootScope.EONProfile?.getProfile?.() || null;
    return String(profile?.uid || profile?.id || '').trim();
  } catch {
    return '';
  }
}

function applyAdminOverrides(/** @type {any} */ state) {
  if (!isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return state;
  }
  return {
    ...state,
    activePlanId: 'business',
    status: 'active',
    paymentAsset: 'stable',
    autoRenew: false,
    renewsAt: null
  };
}

function clampInt(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, Math.floor(numeric)));
}

function normalizePlanId(/** @type {any} */ planId) {
  const raw = String(planId || '').trim().toLowerCase();
  const id = LEGACY_PLAN_ALIASES[raw] || raw;
  return PLAN_DEFS.some((/** @type {any} */ plan) => plan.id === id) ? id : 'free';
}

function entitlementPlanForAccess(/** @type {any} */ state) {
  const planId = normalizePlanId(state?.activePlanId);
  if (planId === 'free') return 'free';
  return normalizeStatus(state?.status) === 'active' ? planId : 'free';
}

function reconcileExternalEntitlement(/** @type {any} */ state) {
  if (!state || isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return state;
  }
  if (!['nowpayments', 'direct_evm'].includes(normalizePaymentAsset(state.paymentAsset))) {
    return state;
  }
  const renewAtMs = Date.parse(state.renewsAt || '');
  if (!state.renewsAt || !Number.isFinite(renewAtMs) || Date.now() < renewAtMs) {
    return state;
  }
  const expiredPlanId = normalizePlanId(state.activePlanId);
  if (expiredPlanId === 'free' && normalizeStatus(state.status) === 'past_due') {
    return state;
  }
  state.activePlanId = 'free';
  state.status = 'past_due';
  state.autoRenew = false;
  const paymentAsset = normalizePaymentAsset(state.paymentAsset);
  pushHistory(state, { type: 'subscription-expired', asset: paymentAsset, amount: 0, source: expiredPlanId });
  recordSubAttr('subscription-expired', { plan: expiredPlanId, asset: paymentAsset });
  return state;
}

function normalizeStatus(/** @type {any} */ status) {
  const normalized = String(status || '').trim().toLowerCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : 'inactive';
}

function normalizePaymentAsset(/** @type {any} */ asset) {
  const normalized = String(asset || '').trim().toLowerCase();
  return ALLOWED_PAYMENT_ASSETS.has(normalized) ? normalized : 'stable';
}

function normalizeIsoDate(/** @type {any} */ value) {
  if (!value) return null;
  const timestamp = Date.parse(String(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function normalizeHistoryEntry(/** @type {any} */ entry) {
  if (!entry || typeof entry !== 'object') return null;
  const type = String(entry.type || '').trim().slice(0, 40);
  if (!type) return null;
  return {
    type,
    asset: normalizePaymentAsset(entry.asset || 'stable'),
    amount: clampInt(entry.amount, 0, MAX_BALANCE_CENTS),
    source: String(entry.source || 'unknown').trim().slice(0, 80),
    at: normalizeIsoDate(entry.at) || new Date().toISOString()
  };
}

function normalizeHistory(/** @type {any} */ entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .slice(-MAX_HISTORY_ENTRIES);
}

function getReferralSourceContext() {
  try {
    const raw = JSON.parse(localStorage.getItem('eon:referral:source:v1') || 'null');
    if (!raw || typeof raw !== 'object') return null;
    if (!raw.fromId) return null;
    return { fromId: String(raw.fromId), capturedAt: Number(raw.capturedAt || 0) };
  } catch {
    return null;
  }
}

function readState() {
  try {
    const currentUid = getCurrentProfileUid();
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const merged = parsed && typeof parsed === 'object'
      ? { ...defaultState(), ...parsed }
      : defaultState();
    const ownerUid = String(merged.ownerUid || currentUid || '').trim();
    if (currentUid && ownerUid && ownerUid !== currentUid) {
      return applyAdminOverrides(defaultState());
    }
    return applyAdminOverrides({
      ...merged,
      ownerUid: ownerUid || currentUid || '',
      activePlanId: normalizePlanId(merged.activePlanId),
      status: normalizeStatus(merged.status),
      paymentAsset: normalizePaymentAsset(merged.paymentAsset),
      stableBalanceCents: clampInt(merged.stableBalanceCents, 0, MAX_BALANCE_CENTS),
      stableCentsPerEonl: clampInt(merged.stableCentsPerEonl, 1, MAX_RATE_CENTS_PER_EONL),
      autoRenew: Boolean(merged.autoRenew),
      renewsAt: normalizeIsoDate(merged.renewsAt),
      txHistory: normalizeHistory(merged.txHistory)
    });
  } catch {
    return applyAdminOverrides(defaultState());
  }
}

function writeState(/** @type {any} */ next) {
  const currentUid = getCurrentProfileUid();
  const /** @type {any} */
normalized = {
    ...defaultState(),
    ...next,
    ownerUid: String(next.ownerUid || currentUid || '').trim(),
    activePlanId: normalizePlanId(next.activePlanId),
    status: normalizeStatus(next.status),
    paymentAsset: normalizePaymentAsset(next.paymentAsset),
    stableBalanceCents: clampInt(next.stableBalanceCents, 0, MAX_BALANCE_CENTS),
    stableCentsPerEonl: clampInt(next.stableCentsPerEonl, 1, MAX_RATE_CENTS_PER_EONL),
    autoRenew: Boolean(next.autoRenew),
    renewsAt: normalizeIsoDate(next.renewsAt),
    txHistory: normalizeHistory(next.txHistory),
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    return readState();
  }
  return normalized;
}

function pushHistory(/** @type {any} */ state, /** @type {any} */ entry) {
  const normalizedEntry = normalizeHistoryEntry(entry);
  if (!normalizedEntry) return;
  state.txHistory.push(normalizedEntry);
  state.txHistory = normalizeHistory(state.txHistory);
}

function recordEntitlementReceipt(/** @type {any} */ state, /** @type {any} */ plan, /** @type {any} */ quote, /** @type {any} */ source = 'activation') {
  const receipt = {
    receiptId: `receipt-${plan.id}-${quote.asset}-${Date.now().toString(36)}-${(function(){if(!window.crypto?.getRandomValues)return'def';const b=new Uint8Array(3);window.crypto.getRandomValues(b);return Array.from(b,x=>x.toString(36)).join('')})()}`,
    planId: plan.id,
    status: state.status,
    paymentAsset: quote.asset,
    issuer: 'local-vault',
    signature: 'local-device',
    issuedAt: new Date().toISOString(),
    renewsAt: state.renewsAt,
    expiresAt: state.renewsAt,
    source
  };
  try {
    rootScope.EONProfile?.appendEntitlementReceipt?.(receipt);
  } catch {
    // keep the local entitlement state working even if profile sync fails
  }
  return receipt;
}

/**
 * Returns all available plan definitions.
 * @returns {Array<{id: string, label: string, stablePriceCents: number, monthlyEonl: number, features: string[]}>}
 */
export function getPlans() {
  return PLAN_DEFS.slice();
}

/**
 * Returns the plan definition for the given plan ID, falling back to the free plan.
 * @param {string} planId
 * @returns {{id: string, label: string, stablePriceCents: number, monthlyEonl: number, features: string[]}}
 */
export function getPlan(/** @type {any} */ planId) {
  const normalizedPlanId = normalizePlanId(planId);
  return PLAN_DEFS.find((/** @type {any} */ plan) => plan.id === normalizedPlanId) || PLAN_DEFS[0];
}

/**
 * Returns true if `planId` is at or above `minimumPlanId` in the plan tier hierarchy.
 * @param {string} planId
 * @param {string} minimumPlanId
 * @returns {boolean}
 */
export function isPlanAtLeast(/** @type {any} */ planId, /** @type {any} */ minimumPlanId) {
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return true;
  }
  const current = PLAN_ORDER.indexOf(normalizePlanId(planId));
  const minimum = PLAN_ORDER.indexOf(normalizePlanId(minimumPlanId));
  if (current === -1 || minimum === -1) return false;
  return current >= minimum;
}

/**
 * Returns true if the active plan includes the specified feature (case-insensitive).
 * @param {string} feature - Feature label to check.
 * @param {object} [state] - Entitlement state; defaults to reading from local storage.
 * @returns {boolean}
 */
export function hasEntitlementFeature(/** @type {any} */ feature, /** @type {any} */ state = readState()) {
  const normalizedFeature = String(feature || '').trim().toLowerCase();
  if (!normalizedFeature) return false;
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return true;
  }
  const effectivePlan = getPlan(entitlementPlanForAccess(state));
  return effectivePlan.features.some((/** @type {any} */ entry) => String(entry || '').trim().toLowerCase() === normalizedFeature);
}

/**
 * Formats a cent amount as a USD dollar string (e.g. `$5.00`).
 * @param {number} [cents=0]
 * @returns {string}
 */
export function formatStable(/** @type {any} */ cents = 0) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

/**
 * Returns the current entitlement state from local storage, including the active plan.
 * @returns {{activePlanId: string, status: string, paymentAsset: string, stableBalanceCents: number, stableCentsPerEonl: number, autoRenew: boolean, renewsAt: string|null, txHistory: Array<object>, updatedAt: string}}
 */
export function getEntitlementState() {
  const state = reconcileExternalEntitlement(readState());
  return writeState(state);
}

/**
 * Returns a payment quote for activating the given plan.
 * @param {string} planId
 * @param {string} [paymentAsset='stable'] - `'stable'` or `'eonl'`.
 * @param {object} [state] - Entitlement state; defaults to reading from local storage.
 * @returns {{asset: string, amount: number, stablePriceCents: number}}
 */
export function quotePlan(/** @type {any} */ planId, /** @type {any} */ paymentAsset = 'stable', /** @type {any} */ state = readState()) {
  const plan = getPlan(planId);
  const normalizedAsset = normalizePaymentAsset(paymentAsset);
  if (normalizedAsset === 'eonl') {
    const dynamicAmount = Math.ceil(plan.stablePriceCents / Math.max(1, state.stableCentsPerEonl));
    return {
      asset: 'eonl',
      amount: plan.stablePriceCents > 0 ? dynamicAmount : 0,
      stablePriceCents: plan.stablePriceCents
    };
  }
  if (normalizedAsset === 'nowpayments' || normalizedAsset === 'direct_evm') {
    return {
      asset: normalizedAsset,
      amount: plan.stablePriceCents,
      stablePriceCents: plan.stablePriceCents
    };
  }
  return {
    asset: 'stable',
    amount: plan.stablePriceCents,
    stablePriceCents: plan.stablePriceCents
  };
}

/**
 * Adds funds to the user's stable balance.
 * @param {number} stableCents - Amount in cents to credit.
 * @param {string} [source='vault-topup'] - Transaction source label recorded in history.
 * @returns {object} Updated entitlement state.
 */
export function topUpStableBalance(/** @type {any} */ stableCents, /** @type {any} */ source = 'vault-topup') {
  const state = readState();
  const amount = clampInt(stableCents, 0, MAX_BALANCE_CENTS);
  if (!amount) {
    return state;
  }
  state.stableBalanceCents = clampInt(state.stableBalanceCents + amount, 0, MAX_BALANCE_CENTS);
  pushHistory(state, { type: 'top-up', asset: 'stable', amount, source });
  return writeState(state);
}

/**
 * Updates the stable-to-EonLite exchange rate used when quoting plans in EonLite.
 * @param {number} stableCentsPerEonl - New rate in stable cents per one EonLite token.
 * @returns {object} Updated entitlement state.
 */
export function setStableRate(/** @type {any} */ stableCentsPerEonl) {
  const state = readState();
  state.stableCentsPerEonl = clampInt(stableCentsPerEonl || state.stableCentsPerEonl, 1, MAX_RATE_CENTS_PER_EONL);
  return writeState(state);
}

/**
 * Processes any pending auto-renewal if the renewal date has passed.
 * Deducts payment or sets the subscription to `past_due` if insufficient funds.
 * @returns {object} Updated entitlement state.
 */
export function processRenewals() {
  const state = reconcileExternalEntitlement(readState());
  const plan = getPlan(state.activePlanId);
  if (['nowpayments', 'direct_evm'].includes(normalizePaymentAsset(state.paymentAsset))) {
    return writeState(state);
  }
  const renewAtMs = Date.parse(state.renewsAt || '');
  if (!state.autoRenew || !state.renewsAt || !Number.isFinite(renewAtMs) || Date.now() < renewAtMs) {
    if (state.autoRenew && state.renewsAt && !Number.isFinite(renewAtMs)) {
      state.autoRenew = false;
      state.status = 'past_due';
      pushHistory(state, { type: 'renewal-failed', asset: state.paymentAsset, amount: 0, source: 'invalid-renewal-date' });
      return writeState(state);
    }
    return state;
  }

  const quote = quotePlan(plan.id, state.paymentAsset, state);
  if (quote.asset === 'stable') {
    if (state.stableBalanceCents < quote.amount) {
      state.status = 'past_due';
      recordSubAttr('renewal-failed', { asset: 'stable', plan: plan.id, amount: quote.amount });
      pushHistory(state, { type: 'renewal-failed', asset: 'stable', amount: quote.amount, source: plan.id });
      return writeState(state);
    }
    state.stableBalanceCents -= quote.amount;
  } else if (!appWin.EonWallet || !appWin.EonWallet.spend(quote.amount, `Subscription renewal: ${plan.label}`)) {
    state.status = 'past_due';
    recordSubAttr('renewal-failed', { asset: 'eonl', plan: plan.id, amount: quote.amount });
    pushHistory(state, { type: 'renewal-failed', asset: 'eonl', amount: quote.amount, source: plan.id });
    return writeState(state);
  }

  state.status = 'active';
  state.renewsAt = new Date(Date.now() + DEFAULT_RENEW_MS).toISOString();
  recordSubAttr('renewal-success', { asset: quote.asset, plan: plan.id, amount: quote.amount });
  pushHistory(state, { type: 'renewal', asset: quote.asset, amount: quote.amount, source: plan.id });
  const written = writeState(state);
  recordEntitlementReceipt(written, plan, quote, 'renewal');
  return written;
}

/**
 * Activates the specified plan, deducting the required payment from the user's balance.
 * @param {string} planId
 * @param {string} [paymentAsset='stable'] - `'stable'` or `'eonl'`.
 * @param {{autoRenew?: boolean}} [options={}]
 * @returns {{ok: boolean, error?: string, state?: object, plan?: object, quote?: object}}
 */
export function activatePlan(/** @type {any} */ planId, /** @type {any} */ paymentAsset = 'stable', /** @type {any} */ options = {}) {
  const plan = getPlan(planId);
  const state = readState();
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    state.activePlanId = 'business';
    state.status = 'active';
    state.paymentAsset = 'stable';
    state.autoRenew = false;
    state.renewsAt = null;
    recordSubAttr('admin-unlimited-access', { requestedPlan: plan.id, plan: 'business' });
    pushHistory(state, { type: 'admin-override', asset: 'stable', amount: 0, source: plan.id });
    const writtenAdmin = writeState(state);
    return {
      ok: true,
      state: writtenAdmin,
      plan: getPlan('business'),
      quote: { asset: 'stable', amount: 0, stablePriceCents: 0 }
    };
  }
  const quote = quotePlan(plan.id, normalizePaymentAsset(paymentAsset), state);

  if (quote.asset === 'stable') {
    if (state.stableBalanceCents < quote.amount) {
      recordSubAttr('activation-failed', { reason: 'insufficient_stable', plan: plan.id, amount: quote.amount });
      return { ok: false, error: 'insufficient_stable' };
    }
    state.stableBalanceCents -= quote.amount;
  } else if (quote.asset === 'nowpayments' || quote.asset === 'direct_evm') {
    // External verified payment; no local balance deduction needed.
  } else if (!appWin.EonWallet || !appWin.EonWallet.spend(quote.amount, `Subscription: ${plan.label}`)) {
    recordSubAttr('activation-failed', { reason: 'insufficient_eonl', plan: plan.id, amount: quote.amount });
    return { ok: false, error: 'insufficient_eonl' };
  }

  state.activePlanId = plan.id;
  state.status = plan.id === 'free' ? 'inactive' : 'active';
  state.paymentAsset = quote.asset;
  state.autoRenew = Boolean(options.autoRenew);
  state.renewsAt = plan.id === 'free' ? null : new Date(Date.now() + DEFAULT_RENEW_MS).toISOString();
  recordSubAttr('activation-success', { plan: plan.id, asset: quote.asset, amount: quote.amount, autoRenew: state.autoRenew });
  if (plan.id !== 'free') {
    const referral = getReferralSourceContext();
    if (referral?.fromId) {
      recordSubAttr('referral-subscription-bonus-eligible', {
        fromId: referral.fromId,
        plan: plan.id,
        amount: quote.amount,
        asset: quote.asset
      });
    }
  }
  pushHistory(state, { type: 'activation', asset: quote.asset, amount: quote.amount, source: plan.id });
  const written = writeState(state);
  if (plan.id !== 'free') {
    recordEntitlementReceipt(written, plan, quote, 'activation');
  }
  return {
    ok: true,
    state: written,
    plan,
    quote
  };
}


/**
 * Applies a verified external payment locally and extends existing access when appropriate.
 * @param {{tier: string, payment_asset?: string, renew_days?: number, source?: string, stable_price_cents?: number}} snapshot
 * @returns {object} Updated entitlement state.
 */
export function applyVerifiedExternalPayment(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.tier) {
    return readState();
  }
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return readState();
  }
  const state = reconcileExternalEntitlement(readState());
  const plan = getPlan(normalizePlanId(snapshot.tier));
  const renewDays = Math.max(1, Number(snapshot.renew_days || 30));
  const currentRenewMs = Date.parse(state.renewsAt || '');
  const baseline = state.activePlanId === plan.id && normalizeStatus(state.status) === 'active' && Number.isFinite(currentRenewMs) && currentRenewMs > Date.now()
    ? currentRenewMs
    : Date.now();
  state.activePlanId = plan.id;
  state.status = plan.id === 'free' ? 'inactive' : 'active';
  state.paymentAsset = normalizePaymentAsset(snapshot.payment_asset || 'direct_evm');
  state.autoRenew = false;
  state.renewsAt = plan.id === 'free' ? null : new Date(baseline + renewDays * 24 * 60 * 60 * 1000).toISOString();
  pushHistory(state, {
    type: 'external-verified-payment',
    asset: state.paymentAsset,
    amount: clampInt(snapshot.stable_price_cents || plan.stablePriceCents || 0, 0, MAX_BALANCE_CENTS),
    source: String(snapshot.source || 'external')
  });
  const written = writeState(state);
  if (plan.id !== 'free') {
    recordEntitlementReceipt(written, plan, quotePlan(plan.id, state.paymentAsset, written), snapshot.source || 'external-verified-payment');
  }
  return written;
}


/**
 * Applies an ad-sponsored local entitlement after the reward gateway has credited the user.
 *
 * This is intentionally a local, time-boxed subscription pass. It is useful for client-side
 * feature gates and the visible subscription badge, but server-side paid features must still
 * verify a real payment or a future ad-network postback before granting account-level access.
 *
 * @param {{planId?: string, hours?: number, source?: string, creditsSpent?: number, proofMode?: string, startedAt?: number}} snapshot
 * @returns {{ok: boolean, state?: object, plan?: object, reason?: string}}
 */
export function applyAdSponsoredEntitlement(snapshot = {}) {
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return { ok: true, state: readState(), plan: getPlan('business'), reason: 'admin-profile' };
  }
  const requestedPlan = normalizePlanId(snapshot.planId || 'supporter');
  const allowedAdPlans = new Set(['supporter', 'starter']);
  if (!allowedAdPlans.has(requestedPlan)) {
    return { ok: false, reason: 'ad-sponsored-plan-not-allowed' };
  }
  const hours = clampInt(snapshot.hours || 24, 1, 168);
  const startedAt = Number(snapshot.startedAt || Date.now());
  const baseTime = Number.isFinite(startedAt) ? startedAt : Date.now();
  const state = reconcileExternalEntitlement(readState());
  const currentRenewMs = Date.parse(state.renewsAt || '');
  const baseline = entitlementPlanForAccess(state) === requestedPlan && Number.isFinite(currentRenewMs) && currentRenewMs > baseTime
    ? currentRenewMs
    : baseTime;
  const plan = getPlan(requestedPlan);
  state.activePlanId = plan.id;
  state.status = 'active';
  state.paymentAsset = 'ad_sponsored';
  state.autoRenew = false;
  state.renewsAt = new Date(baseline + hours * 60 * 60 * 1000).toISOString();
  pushHistory(state, {
    type: 'ad-sponsored-pass',
    asset: 'ad_sponsored',
    amount: clampInt(snapshot.creditsSpent || 0, 0, MAX_BALANCE_CENTS),
    source: String(snapshot.source || 'reward-access')
  });
  recordSubAttr('ad-sponsored-pass', {
    plan: plan.id,
    hours,
    source: String(snapshot.source || 'reward-access'),
    proofMode: String(snapshot.proofMode || 'client-capped-access-credit')
  });
  const written = writeState(state);
  recordEntitlementReceipt(written, plan, { asset: 'ad_sponsored', amount: 0, stablePriceCents: 0 }, 'ad-sponsored-pass');
  return { ok: true, state: written, plan, reason: 'ad-sponsored-pass-active' };
}

/**
 * Applies a remote entitlement snapshot from the server to local storage,
 * overwriting tier, status, payment asset, and renewal date.
 * @param {{tier: string, status?: string, payment_asset?: string, renews_at?: string, stable_price_cents?: number}} snapshot
 * @returns {object} Updated entitlement state.
 */
export function applyRemoteEntitlement(/** @type {any} */ snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.tier) {
    return readState();
  }
  if (isAdminProfile(getProfile?.() || rootScope.EONProfile?.getProfile?.() || null)) {
    return readState();
  }
  const state = reconcileExternalEntitlement(readState());
  const remotePlan = getPlan(normalizePlanId(snapshot.tier));
  state.activePlanId = remotePlan.id;
  state.status = normalizeStatus(snapshot.status || state.status);
  state.paymentAsset = normalizePaymentAsset(snapshot.payment_asset || state.paymentAsset);
  state.autoRenew = state.paymentAsset === 'nowpayments' ? false : state.autoRenew;
  state.renewsAt = normalizeIsoDate(snapshot.renews_at) || state.renewsAt;
  pushHistory(state, {
    type: 'remote-sync',
    asset: state.paymentAsset,
    amount: clampInt(snapshot.stable_price_cents || 0, 0, MAX_BALANCE_CENTS),
    source: remotePlan.id
  });
  recordSubAttr('remote-sync', { plan: remotePlan.id, status: state.status, asset: state.paymentAsset });
  return writeState(state);
}
