import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRt92CostEvidence,
  estimateRt92MonthlyVariableCost,
  evaluateRt92PremiumPlanEconomics,
  evaluateRt92PremiumCommercialActivation,
  evaluateRt92UltimateSoftwareEconomics,
  getRt92PremiumEconomicsTruth
} from '../../config/rt92-premium-economics.mjs';

const nowMs = Date.UTC(2026, 7, 17);
const evidence = {
  evidenceId: 'cost-proof:fixture:2026-08-17',
  observedAtMs: nowMs,
  unitCosts: {
    hostedAiPerWorkUnitUsd: 0.01,
    schedulerPerRunUsd: 0.001,
    storagePerGbMonthUsd: 0.02,
    computePerMinuteUsd: 0.002
  }
};

test('cost evidence fails closed when missing or stale', () => {
  assert.equal(validateRt92CostEvidence({}, { nowMs }).ok, false);
  const stale = validateRt92CostEvidence({ ...evidence, observedAtMs: nowMs - 90 * 86_400_000 }, { nowMs, maxAgeDays: 31 });
  assert.equal(stale.ok, false);
  assert.equal(stale.fresh, false);
});

test('cost evidence cannot self-declare evaluation time or be materially future-dated', () => {
  const selfTimed = validateRt92CostEvidence({ ...evidence, nowMs: nowMs - 365 * 86_400_000 }, { nowMs });
  assert.equal(selfTimed.ok, true);
  const future = validateRt92CostEvidence({ ...evidence, observedAtMs: nowMs + 86_400_000 }, { nowMs });
  assert.equal(future.ok, false);
  assert.equal(future.notFuture, false);
});

test('variable cost model is deterministic and evidence-backed', () => {
  const result = estimateRt92MonthlyVariableCost({
    usage: { hostedAiWorkUnits: 100, scheduledRuns: 50, storageGb: 2, computeMinutes: 200 },
    evidence,
    nowMs
  });
  assert.equal(result.ok, true);
  assert.equal(Number(result.monthlyVariableCostUsd.toFixed(2)), 1.49);
});

test('plan economics fail when heavy usage breaks margin threshold', () => {
  const result = evaluateRt92PremiumPlanEconomics({
    planId: 'pro',
    monthlyRevenueUsd: 99,
    paymentAndTaxReserveRate: 0.1,
    monthlyFixedCostAllocationUsd: 3,
    supportReserveUsd: 5,
    usage: { hostedAiWorkUnits: 10_000, scheduledRuns: 1_000, storageGb: 20, computeMinutes: 3_000 },
    evidence,
    nowMs,
    minimumGrossMarginRate: 0.65
  });
  assert.equal(result.ok, true);
  assert.equal(result.readyForSale, false);
  assert.equal(result.reason, 'margin-gate-failed');
});

test('commercial activation requires expected, heavy and abuse-edge scenarios for both Pro and Ultra', () => {
  const scenario = (planId, scenarioId, units) => ({
    scenarioId,
    planId,
    monthlyRevenueUsd: planId === 'ultra' ? 199 : 99,
    paymentAndTaxReserveRate: 0.05,
    monthlyFixedCostAllocationUsd: 1,
    supportReserveUsd: 1,
    usage: { hostedAiWorkUnits: units, scheduledRuns: 10, storageGb: 1, computeMinutes: 10 },
    evidence,
    nowMs,
    minimumGrossMarginRate: 0.5
  });
  const incomplete = evaluateRt92PremiumCommercialActivation({ scenarios: [scenario('pro', 'expected', 20)] });
  assert.equal(incomplete.readyForCommercialActivation, false);
  assert.ok(incomplete.missingScenarioKeys.includes('pro:heavy'));
  assert.ok(incomplete.missingScenarioKeys.includes('ultra:expected'));

  const complete = evaluateRt92PremiumCommercialActivation({ scenarios: [
    scenario('pro', 'expected', 20), scenario('pro', 'heavy', 50), scenario('pro', 'abuse-edge', 100),
    scenario('ultra', 'expected', 40), scenario('ultra', 'heavy', 100), scenario('ultra', 'abuse-edge', 200)
  ] });
  assert.equal(complete.readyForCommercialActivation, true);
  assert.equal(complete.planReadiness.pro.ready, true);
  assert.equal(complete.planReadiness.ultra.ready, true);
  assert.equal(complete.dodoProductCreationAuthorized, false);
});

test('Ultimate economics model forbids bundled hosted capacity and requires a credible maintenance reserve', () => {
  const bundled = evaluateRt92UltimateSoftwareEconomics({ oneTimeRevenueUsd: 999, includedHostedCapacityUnits: 1, maintenanceReserveMonths: 60, monthlyMaintenanceReserveUsd: 2 });
  assert.equal(bundled.readyForSale, false);
  assert.equal(bundled.reason, 'ultimate-must-not-bundle-platform-hosted-capacity');

  const noReserve = evaluateRt92UltimateSoftwareEconomics({ oneTimeRevenueUsd: 999, maintenanceReserveMonths: 12, monthlyMaintenanceReserveUsd: 0 });
  assert.equal(noReserve.readyForSale, false);
  assert.equal(noReserve.reason, 'credible-software-maintenance-reserve-required');

  const healthy = evaluateRt92UltimateSoftwareEconomics({
    oneTimeRevenueUsd: 999,
    paymentAndTaxReserveRate: 0.08,
    directFulfilmentCostUsd: 25,
    maintenanceReserveMonths: 60,
    monthlyMaintenanceReserveUsd: 2,
    includedHostedCapacityUnits: 0,
    minimumContributionMarginRate: 0.6
  });
  assert.equal(healthy.readyForSale, true);
  assert.equal(healthy.includedHostedCapacityUnits, 0);
  assert.equal(healthy.subscriptionCapacityStillSeparate, true);
});

test('economics foundation cannot create products or grant entitlements', () => {
  const truth = getRt92PremiumEconomicsTruth();
  assert.equal(truth.hardCodedProviderPrices, false);
  assert.equal(truth.currentCostEvidenceRequired, true);
  assert.equal(truth.dodoCatalogueRecordsCreated, true);
  assert.equal(truth.checkoutEnabled, false);
  assert.equal(truth.grantsEntitlement, false);
});
