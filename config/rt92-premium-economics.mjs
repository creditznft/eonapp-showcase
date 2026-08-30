/**
 * RT92 premium economics / commercial activation foundation.
 *
 * No provider prices are hard-coded here because those rates change. The model
 * accepts externally verified unit-cost evidence and fails closed when that
 * evidence is missing or stale. It creates no Dodo product and grants no plan.
 */
export const RT92_PREMIUM_ECONOMICS_SCHEMA = 'eonapp.rt92.premium-economics.v1';
export const RT92_PREMIUM_ECONOMICS_STATUS = 'design-only-not-for-sale';

const freeze = Object.freeze;
const DAY_MS = 86_400_000;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

function cleanEvidenceId(value = '') {
  const text = String(value || '').trim();
  return /^[a-zA-Z0-9._:/-]{4,180}$/.test(text) ? text : '';
}

export function validateRt92CostEvidence(evidence = {}, { nowMs = Date.now(), maxAgeDays = 31 } = {}) {
  const evidenceId = cleanEvidenceId(evidence.evidenceId);
  const observedAtMs = Number(evidence.observedAtMs);
  const evaluationNowMs = Number(nowMs);
  const futureSkewMs = Number.isFinite(observedAtMs) && Number.isFinite(evaluationNowMs) ? observedAtMs - evaluationNowMs : Infinity;
  const notFuture = Number.isFinite(futureSkewMs) && futureSkewMs <= 5 * 60_000;
  const ageMs = Number.isFinite(observedAtMs) && Number.isFinite(evaluationNowMs) ? Math.max(0, evaluationNowMs - observedAtMs) : Infinity;
  const unitCosts = evidence.unitCosts && typeof evidence.unitCosts === 'object' ? evidence.unitCosts : {};
  const required = ['hostedAiPerWorkUnitUsd', 'schedulerPerRunUsd', 'storagePerGbMonthUsd', 'computePerMinuteUsd'];
  const missingUnitCosts = required.filter((key) => !Number.isFinite(Number(unitCosts[key])) || Number(unitCosts[key]) < 0);
  const fresh = ageMs <= Math.max(1, Number(maxAgeDays) || 31) * DAY_MS;
  return freeze({
    ok: Boolean(evidenceId) && Number.isFinite(observedAtMs) && notFuture && fresh && missingUnitCosts.length === 0,
    evidenceId,
    observedAtMs: Number.isFinite(observedAtMs) ? observedAtMs : null,
    ageDays: Number.isFinite(ageMs) ? ageMs / DAY_MS : null,
    fresh,
    notFuture,
    missingUnitCosts: freeze(missingUnitCosts),
    unitCosts: freeze({
      hostedAiPerWorkUnitUsd: finite(unitCosts.hostedAiPerWorkUnitUsd),
      schedulerPerRunUsd: finite(unitCosts.schedulerPerRunUsd),
      storagePerGbMonthUsd: finite(unitCosts.storagePerGbMonthUsd),
      computePerMinuteUsd: finite(unitCosts.computePerMinuteUsd)
    })
  });
}

export function estimateRt92MonthlyVariableCost({ usage = {}, evidence = {}, nowMs = Date.now(), maxAgeDays = 31 } = {}) {
  const validated = validateRt92CostEvidence(evidence, { nowMs, maxAgeDays });
  if (!validated.ok) return freeze({ ok: false, reason: 'verified-current-cost-evidence-required', evidence: validated, monthlyVariableCostUsd: null });
  const workUnits = finite(usage.hostedAiWorkUnits);
  const scheduledRuns = finite(usage.scheduledRuns);
  const storageGb = finite(usage.storageGb);
  const computeMinutes = finite(usage.computeMinutes);
  const costs = validated.unitCosts;
  const components = freeze({
    hostedAiUsd: workUnits * costs.hostedAiPerWorkUnitUsd,
    schedulerUsd: scheduledRuns * costs.schedulerPerRunUsd,
    storageUsd: storageGb * costs.storagePerGbMonthUsd,
    computeUsd: computeMinutes * costs.computePerMinuteUsd
  });
  const monthlyVariableCostUsd = Object.values(components).reduce((sum, value) => sum + value, 0);
  return freeze({
    ok: true,
    evidence: validated,
    usage: freeze({ hostedAiWorkUnits: workUnits, scheduledRuns, storageGb, computeMinutes }),
    components,
    monthlyVariableCostUsd
  });
}

export function evaluateRt92PremiumPlanEconomics({
  planId = '',
  monthlyRevenueUsd = 0,
  paymentAndTaxReserveRate = 0,
  monthlyFixedCostAllocationUsd = 0,
  supportReserveUsd = 0,
  usage = {},
  evidence = {},
  minimumGrossMarginRate = 0.65,
  nowMs = Date.now(),
  maxCostEvidenceAgeDays = 31
} = {}) {
  const variable = estimateRt92MonthlyVariableCost({ usage, evidence, nowMs, maxAgeDays: maxCostEvidenceAgeDays });
  if (!variable.ok) return freeze({ ok: false, planId: String(planId || ''), readyForSale: false, reason: variable.reason, variable });
  const revenue = finite(monthlyRevenueUsd);
  const reserveRate = Math.min(1, finite(paymentAndTaxReserveRate));
  const reserveUsd = revenue * reserveRate;
  const fixedUsd = finite(monthlyFixedCostAllocationUsd);
  const supportUsd = finite(supportReserveUsd);
  const totalCostUsd = variable.monthlyVariableCostUsd + reserveUsd + fixedUsd + supportUsd;
  const grossProfitUsd = revenue - totalCostUsd;
  const grossMarginRate = revenue > 0 ? grossProfitUsd / revenue : -1;
  const threshold = Math.min(0.99, Math.max(0, Number(minimumGrossMarginRate) || 0.65));
  const readyForSale = revenue > 0 && grossProfitUsd > 0 && grossMarginRate >= threshold;
  return freeze({
    ok: true,
    schema: RT92_PREMIUM_ECONOMICS_SCHEMA,
    planId: String(planId || ''),
    monthlyRevenueUsd: revenue,
    totalCostUsd,
    grossProfitUsd,
    grossMarginRate,
    minimumGrossMarginRate: threshold,
    readyForSale,
    reason: readyForSale ? 'margin-gate-passed' : 'margin-gate-failed',
    variable,
    reserves: freeze({ paymentAndTaxReserveUsd: reserveUsd, monthlyFixedCostAllocationUsd: fixedUsd, supportReserveUsd: supportUsd })
  });
}

export function evaluateRt92UltimateSoftwareEconomics({
  oneTimeRevenueUsd = 0,
  paymentAndTaxReserveRate = 0,
  directFulfilmentCostUsd = 0,
  maintenanceReserveMonths = 0,
  monthlyMaintenanceReserveUsd = 0,
  includedHostedCapacityUnits = 0,
  minimumContributionMarginRate = 0.6
} = {}) {
  const revenue = finite(oneTimeRevenueUsd);
  const reserveRate = Math.min(1, finite(paymentAndTaxReserveRate));
  const fulfilment = finite(directFulfilmentCostUsd);
  const months = Math.trunc(finite(maintenanceReserveMonths));
  const monthlyMaintenance = finite(monthlyMaintenanceReserveUsd);
  const hostedCapacityUnits = finite(includedHostedCapacityUnits);
  const threshold = Math.min(0.99, Math.max(0, Number(minimumContributionMarginRate) || 0.6));

  if (hostedCapacityUnits > 0) {
    return freeze({
      ok: false,
      readyForSale: false,
      reason: 'ultimate-must-not-bundle-platform-hosted-capacity',
      includedHostedCapacityUnits: hostedCapacityUnits,
      subscriptionCapacityStillSeparate: true
    });
  }
  if (months < 36 || monthlyMaintenance <= 0) {
    return freeze({
      ok: false,
      readyForSale: false,
      reason: 'credible-software-maintenance-reserve-required',
      maintenanceReserveMonths: months,
      monthlyMaintenanceReserveUsd: monthlyMaintenance,
      subscriptionCapacityStillSeparate: true
    });
  }

  const paymentAndTaxReserveUsd = revenue * reserveRate;
  const maintenanceReserveUsd = months * monthlyMaintenance;
  const totalReservedCostUsd = paymentAndTaxReserveUsd + fulfilment + maintenanceReserveUsd;
  const contributionProfitUsd = revenue - totalReservedCostUsd;
  const contributionMarginRate = revenue > 0 ? contributionProfitUsd / revenue : -1;
  const readyForSale = revenue > 0 && contributionProfitUsd > 0 && contributionMarginRate >= threshold;

  return freeze({
    ok: true,
    schema: RT92_PREMIUM_ECONOMICS_SCHEMA,
    productId: 'ultimate',
    oneTimeRevenueUsd: revenue,
    totalReservedCostUsd,
    contributionProfitUsd,
    contributionMarginRate,
    minimumContributionMarginRate: threshold,
    maintenanceReserveMonths: months,
    monthlyMaintenanceReserveUsd: monthlyMaintenance,
    includedHostedCapacityUnits: 0,
    subscriptionCapacityStillSeparate: true,
    readyForSale,
    reason: readyForSale ? 'ultimate-software-margin-gate-passed' : 'ultimate-software-margin-gate-failed'
  });
}

export function evaluateRt92PremiumCommercialActivation({
  scenarios = [],
  requiredPlanIds = ['pro', 'ultra'],
  requiredScenarioIds = ['expected', 'heavy', 'abuse-edge']
} = {}) {
  const rows = Array.isArray(scenarios) ? scenarios : [];
  const planReadiness = {};
  const evaluations = [];
  const missingScenarioKeys = [];
  const failedScenarioKeys = [];

  for (const planId of requiredPlanIds) {
    for (const scenarioId of requiredScenarioIds) {
      const row = rows.find((candidate) => String(candidate?.planId || '') === planId && String(candidate?.scenarioId || '') === scenarioId);
      const key = `${planId}:${scenarioId}`;
      if (!row) {
        missingScenarioKeys.push(key);
        continue;
      }
      const evaluation = freeze({ scenarioKey: key, scenarioId, ...evaluateRt92PremiumPlanEconomics(row) });
      evaluations.push(evaluation);
      if (!evaluation.ok || !evaluation.readyForSale) failedScenarioKeys.push(key);
    }
    const missingForPlan = missingScenarioKeys.filter((key) => key.startsWith(`${planId}:`));
    const failedForPlan = failedScenarioKeys.filter((key) => key.startsWith(`${planId}:`));
    planReadiness[planId] = freeze({
      ready: missingForPlan.length === 0 && failedForPlan.length === 0,
      missingScenarioKeys: freeze(missingForPlan),
      failedScenarioKeys: freeze(failedForPlan)
    });
  }

  const readyForCommercialActivation = missingScenarioKeys.length === 0 && failedScenarioKeys.length === 0;
  return freeze({
    schema: RT92_PREMIUM_ECONOMICS_SCHEMA,
    status: RT92_PREMIUM_ECONOMICS_STATUS,
    readyForCommercialActivation,
    requiredPlanIds: freeze([...requiredPlanIds]),
    requiredScenarioIds: freeze([...requiredScenarioIds]),
    planReadiness: freeze(planReadiness),
    missingScenarioKeys: freeze(missingScenarioKeys),
    failedScenarioKeys: freeze(failedScenarioKeys),
    evaluations: freeze(evaluations),
    dodoProductCreationAuthorized: false,
    checkoutActivationAuthorized: false,
    browserEntitlementGrantAuthorized: false
  });
}

export function getRt92PremiumEconomicsTruth() {
  return freeze({
    schema: RT92_PREMIUM_ECONOMICS_SCHEMA,
    status: RT92_PREMIUM_ECONOMICS_STATUS,
    hardCodedProviderPrices: false,
    currentCostEvidenceRequired: true,
    expectedScenarioRequired: true,
    heavyScenarioRequired: true,
    abuseEdgeScenarioRequired: true,
    proAndUltraEvaluatedSeparately: true,
    ultimateSoftwareReserveModelAvailable: true,
    dodoCatalogueRecordsCreated: true,
    checkoutEnabled: false,
    grantsEntitlement: false
  });
}
