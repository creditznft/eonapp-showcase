/**
 * EONAPP ad-sponsored subscription helper.
 *
 * Converts capped reward-gateway credits into local, time-boxed ad-sponsored access.
 * This does not create a paid server entitlement; it activates a local Supporter/Starter pass
 * only after the user has earned enough gateway credits under the cooldown/daily/monthly caps.
 */
import { AD_GATEWAY_POLICY } from '../ads/config.js';
import { getCreditSummary } from '../ads/reward-gateway.js';
import { applyAdSponsoredEntitlement, getEntitlementState } from './entitlements.js';

const HISTORY_KEY = 'eon:ad-sponsored-subscription:v1';
const HOUR_MS = 60 * 60 * 1000;

function now() { return Date.now(); }

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function readHistory() {
  const value = safeRead(HISTORY_KEY, { activations: [] });
  return { activations: Array.isArray(value.activations) ? value.activations.slice(-80) : [] };
}

function writeHistory(history) {
  safeWrite(HISTORY_KEY, { activations: Array.isArray(history.activations) ? history.activations.slice(-80) : [] });
}

export function getAdSponsoredSubscriptionRules() {
  return Object.freeze({
    proofMode: AD_GATEWAY_POLICY.rewardProofMode,
    localOnlyUntilPostback: AD_GATEWAY_POLICY.ordinaryTagCannotGrantPaidEntitlement,
    temporarySupporter: Object.freeze({
      planId: 'supporter',
      label: '24h ad-sponsored Supporter preview',
      creditsRequired: AD_GATEWAY_POLICY.temporaryUpgradeCreditsRequired,
      hours: AD_GATEWAY_POLICY.temporaryUpgradeHours
    }),
    weeklySupporter: Object.freeze({
      planId: 'supporter',
      label: '7-day ad-sponsored Supporter pass',
      creditsRequired: AD_GATEWAY_POLICY.freeSupporterUnlockCreditsRequired,
      hours: AD_GATEWAY_POLICY.supporterPassHours
    }),
    monthlyTarget: Object.freeze({
      planId: 'supporter',
      label: 'Monthly ad-sponsored Supporter target',
      creditsRequired: AD_GATEWAY_POLICY.monthlySupporterUnlockCreditsRequired,
      hours: 30 * 24,
      requiresServerProof: true
    })
  });
}

export function getAdSponsoredSubscriptionStatus(t = now()) {
  const rules = getAdSponsoredSubscriptionRules();
  const credits = getCreditSummary(t);
  const entitlement = getEntitlementState();
  const renewMs = Date.parse(entitlement?.renewsAt || '');
  const isAdSponsored = String(entitlement?.paymentAsset || '') === 'ad_sponsored' && String(entitlement?.status || '') === 'active' && Number.isFinite(renewMs) && renewMs > t;
  const history = readHistory();
  return {
    credits,
    active: Boolean(isAdSponsored),
    activePlanId: isAdSponsored ? String(entitlement.activePlanId || 'supporter') : 'free',
    renewsAt: isAdSponsored ? entitlement.renewsAt : null,
    remainingHours: isAdSponsored ? Math.max(0, Math.ceil((renewMs - t) / HOUR_MS)) : 0,
    nextTemporaryCredits: Math.max(0, rules.temporarySupporter.creditsRequired - credits.total),
    nextWeeklyCredits: Math.max(0, rules.weeklySupporter.creditsRequired - credits.total),
    nextMonthlyCredits: Math.max(0, rules.monthlyTarget.creditsRequired - credits.total),
    activations: history.activations,
    rules
  };
}

function alreadyActivated(kind, history) {
  return history.activations.some((entry) => String(entry.kind || '') === kind);
}

export function evaluateAndApplyAdSponsoredAccess(options = {}) {
  const t = Number(options.now || now());
  const summary = getCreditSummary(t);
  const rules = getAdSponsoredSubscriptionRules();
  const history = readHistory();
  const provider = String(options.provider || 'monetag');
  const source = String(options.source || 'reward-access');

  let target = null;
  if (summary.total >= rules.weeklySupporter.creditsRequired && !alreadyActivated('weekly-supporter', history)) {
    target = { kind: 'weekly-supporter', ...rules.weeklySupporter };
  } else if (summary.total >= rules.temporarySupporter.creditsRequired && !alreadyActivated('temporary-supporter', history)) {
    target = { kind: 'temporary-supporter', ...rules.temporarySupporter };
  }

  if (!target) {
    return { ok: false, reason: 'not-enough-new-credits', status: getAdSponsoredSubscriptionStatus(t) };
  }

  const applied = applyAdSponsoredEntitlement({
    planId: target.planId,
    hours: target.hours,
    source: `${source}:${provider}:${target.kind}`,
    creditsSpent: target.creditsRequired,
    proofMode: AD_GATEWAY_POLICY.rewardProofMode,
    startedAt: t
  });
  if (!applied?.ok) {
    return { ok: false, reason: applied?.reason || 'entitlement-apply-failed', status: getAdSponsoredSubscriptionStatus(t) };
  }
  history.activations.push({
    kind: target.kind,
    planId: target.planId,
    hours: target.hours,
    creditsRequired: target.creditsRequired,
    provider,
    source,
    at: new Date(t).toISOString(),
    proofMode: AD_GATEWAY_POLICY.rewardProofMode,
    localOnlyUntilPostback: AD_GATEWAY_POLICY.ordinaryTagCannotGrantPaidEntitlement
  });
  writeHistory(history);
  return { ok: true, reason: 'ad-sponsored-access-active', activation: history.activations.at(-1), state: applied.state, status: getAdSponsoredSubscriptionStatus(t) };
}

export default {
  getAdSponsoredSubscriptionRules,
  getAdSponsoredSubscriptionStatus,
  evaluateAndApplyAdSponsoredAccess
};
