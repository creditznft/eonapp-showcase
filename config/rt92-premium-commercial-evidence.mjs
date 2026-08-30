import { validateRt92CloudflareDurableCostEvidence } from './rt92-cloudflare-durable-runtime-economics.mjs';

/**
 * RT92 commercial evidence gate.
 *
 * This validates metadata about current cost evidence. It intentionally cannot
 * verify a provider invoice/contract by itself, create products, or turn an
 * evidence declaration into payment/entitlement authority.
 */
export const RT92_PREMIUM_COMMERCIAL_EVIDENCE_SCHEMA = 'eonapp.rt92.premium-commercial-evidence.v1';
const DAY_MS = 86_400_000;
const freeze = Object.freeze;
const HOSTED_SOURCES = new Set(['official-provider-pricing', 'provider-invoice', 'provider-contract']);
const DODO_SOURCES = new Set(['dodo-account-settlement', 'dodo-account-contract']);

function clean(value = '', max = 220) {
  const text = String(value || '').trim().slice(0, max);
  return /^[a-zA-Z0-9._:/ -]{3,220}$/.test(text) ? text : '';
}
function finiteNonNegative(value) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; }
function freshness(observedAtMs, nowMs, maxAgeDays = 31) {
  const observed = Number(observedAtMs); const clock = Number(nowMs);
  const age = Number.isFinite(observed) && Number.isFinite(clock) ? clock - observed : Infinity;
  return freeze({
    observedAtMs: Number.isFinite(observed) ? observed : null,
    fresh: Number.isFinite(age) && age >= -5 * 60_000 && Math.max(0, age) <= Math.max(1, Number(maxAgeDays) || 31) * DAY_MS,
    ageDays: Number.isFinite(age) ? Math.max(0, age) / DAY_MS : null
  });
}

export function validateRt92HostedAiCostEvidence(evidence = {}, { nowMs = Date.now(), maxAgeDays = 31 } = {}) {
  const time = freshness(evidence.observedAtMs, nowMs, maxAgeDays);
  const sourceAuthority = String(evidence.sourceAuthority || '').trim();
  const providerId = clean(evidence.providerId, 80);
  const modelId = clean(evidence.modelId, 140);
  const workUnitDefinition = clean(evidence.workUnitDefinition, 220);
  const usdPerWorkUnit = finiteNonNegative(evidence.usdPerWorkUnit);
  const evidenceRef = clean(evidence.evidenceRef, 220);
  const ok = time.fresh && HOSTED_SOURCES.has(sourceAuthority) && Boolean(providerId && modelId && workUnitDefinition && evidenceRef) && usdPerWorkUnit !== null;
  return freeze({
    ok,
    ...time,
    sourceAuthority: HOSTED_SOURCES.has(sourceAuthority) ? sourceAuthority : '',
    providerId,
    modelId,
    workUnitDefinition,
    usdPerWorkUnit,
    evidenceRef,
    storesProviderCredential: false,
    authorizesProviderSpend: false
  });
}

export function validateRt92DodoAccountCostEvidence(evidence = {}, { nowMs = Date.now(), maxAgeDays = 31 } = {}) {
  const time = freshness(evidence.observedAtMs, nowMs, maxAgeDays);
  const sourceAuthority = String(evidence.sourceAuthority || '').trim();
  const evidenceRef = clean(evidence.evidenceRef, 220);
  const basePercentRate = finiteNonNegative(evidence.basePercentRate);
  const fixedFeeUsd = finiteNonNegative(evidence.fixedFeeUsd);
  const subscriptionPercentRate = finiteNonNegative(evidence.subscriptionPercentRate);
  const crossBorderPercentReserve = finiteNonNegative(evidence.crossBorderPercentReserve);
  const refundReserveUsdPerSale = finiteNonNegative(evidence.refundReserveUsdPerSale);
  const ok = time.fresh && DODO_SOURCES.has(sourceAuthority) && Boolean(evidenceRef)
    && [basePercentRate, fixedFeeUsd, subscriptionPercentRate, crossBorderPercentReserve, refundReserveUsdPerSale].every((value) => value !== null);
  return freeze({
    ok,
    ...time,
    sourceAuthority: DODO_SOURCES.has(sourceAuthority) ? sourceAuthority : '',
    evidenceRef,
    basePercentRate,
    fixedFeeUsd,
    subscriptionPercentRate,
    crossBorderPercentReserve,
    refundReserveUsdPerSale,
    storesPaymentCredential: false,
    createsCheckout: false
  });
}

export function evaluateRt92PremiumCommercialEvidence({ cloudflareEvidence = {}, hostedAiEvidence = {}, dodoAccountEvidence = {}, nowMs = Date.now() } = {}) {
  const cloudflare = validateRt92CloudflareDurableCostEvidence(cloudflareEvidence, { nowMs });
  const hostedAi = validateRt92HostedAiCostEvidence(hostedAiEvidence, { nowMs });
  const dodo = validateRt92DodoAccountCostEvidence(dodoAccountEvidence, { nowMs });
  const ready = cloudflare.ok && hostedAi.ok && dodo.ok;
  return freeze({
    schema: RT92_PREMIUM_COMMERCIAL_EVIDENCE_SCHEMA,
    ready,
    cloudflare,
    hostedAi,
    dodo,
    missing: freeze([
      ...(cloudflare.ok ? [] : ['current-cloudflare-runtime-cost-evidence']),
      ...(hostedAi.ok ? [] : ['current-hosted-ai-provider-cost-evidence']),
      ...(dodo.ok ? [] : ['current-dodo-account-fee-evidence'])
    ]),
    createsDodoProduct: false,
    enablesCheckout: false,
    grantsEntitlement: false,
    authorizesProviderSpend: false
  });
}

export function getRt92PremiumCommercialEvidenceTruth() {
  return freeze({
    schema: RT92_PREMIUM_COMMERCIAL_EVIDENCE_SCHEMA,
    currentCloudflareEvidenceRequired: true,
    accountSpecificDodoEvidenceRequired: true,
    selectedHostedProviderAndModelEvidenceRequired: true,
    publicMarketingPriceAloneIsDodoAccountAuthority: false,
    storesCredentials: false,
    createsDodoProduct: false,
    grantsEntitlement: false
  });
}
