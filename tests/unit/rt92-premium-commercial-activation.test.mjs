import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRt92PremiumReleaseReadiness,
  getRt92PremiumCommercialActivationTruth
} from '../../config/rt92-premium-commercial-activation.mjs';
import { RT92_CLOUDFLARE_DURABLE_COST_EVIDENCE_2026_08_17 as cloudflareEvidence } from '../../config/evidence/rt92-cloudflare-durable-cost-evidence-2026-08-17.mjs';

const nowMs = cloudflareEvidence.observedAtMs;
const evidence = {
  evidenceId: 'cost-proof:test:2026-08-17',
  observedAtMs: nowMs,
  nowMs,
  unitCosts: {
    hostedAiPerWorkUnitUsd: 0.001,
    schedulerPerRunUsd: 0.0001,
    storagePerGbMonthUsd: 0.01,
    computePerMinuteUsd: 0.001
  }
};
const scenario = (planId, scenarioId) => ({
  scenarioId,
  planId,
  monthlyRevenueUsd: planId === 'ultra' ? 199 : 99,
  paymentAndTaxReserveRate: 0.05,
  monthlyFixedCostAllocationUsd: 1,
  supportReserveUsd: 1,
  usage: { hostedAiWorkUnits: 100, scheduledRuns: 20, storageGb: 2, computeMinutes: 50 },
  evidence,
  nowMs,
  minimumGrossMarginRate: 0.5
});
const ultimateEconomics = {
  oneTimeRevenueUsd: 1299,
  paymentAndTaxReserveRate: 0.08,
  directFulfilmentCostUsd: 25,
  maintenanceReserveMonths: 60,
  monthlyMaintenanceReserveUsd: 2,
  includedHostedCapacityUnits: 0,
  minimumContributionMarginRate: 0.6
};


const commercialEvidence = {
  nowMs,
  cloudflareEvidence,
  hostedAiEvidence: {
    observedAtMs: nowMs,
    sourceAuthority: 'official-provider-pricing',
    providerId: 'future-provider-test-fixture',
    modelId: 'future-model-test-fixture',
    workUnitDefinition: 'one bounded hosted work unit test fixture',
    usdPerWorkUnit: 0.001,
    evidenceRef: 'official-pricing:test-fixture'
  },
  dodoAccountEvidence: {
    observedAtMs: nowMs,
    sourceAuthority: 'dodo-account-contract',
    evidenceRef: 'account-contract:test-fixture',
    basePercentRate: 0.04,
    fixedFeeUsd: 0.40,
    subscriptionPercentRate: 0.005,
    crossBorderPercentReserve: 0.015,
    refundReserveUsdPerSale: 0.05
  }
};

const allProofs = {
  premiumCapabilityAuditApproved: true,
  durableRuntimeCertified: true,
  serverSoftwareGrantLedgerCertified: true,
  refundDisputeRevocationCertified: true,
  purchaseRestorationCertified: true,
  workloadConcurrencyCertified: true,
  fullBillingRegressionGreen: true,
  previewBrowserProofGreen: true,
  ownerCommercialReleaseApproved: true
};

test('current live catalogue preserves Free plus all seven purchasable products', () => {
  const result = evaluateRt92PremiumReleaseReadiness();
  assert.equal(result.foundationsGreen, true);
  assert.equal(result.liveCatalogPreserved, true);
  assert.deepEqual(result.livePlanIds, ['free', 'plus', 'studio', 'power', 'max', 'pro', 'ultra', 'ultimate']);
  assert.equal(result.futureCatalogueRecordsCreated, true);
  assert.equal(result.premiumCheckoutConfigured, true);
  assert.equal(result.futureCheckoutStillDisabled, false);
  assert.equal(result.commercialBoundaryPreserved, true);
});

test('default readiness fails closed with missing economics and certification proofs', () => {
  const result = evaluateRt92PremiumReleaseReadiness();
  assert.equal(result.readyForCommercialOperation, false);
  assert.equal(result.economicsReady, false);
  assert.ok(result.missingProofs.length > 0);
});

test('even a fully passing design evaluation cannot itself create products, checkout or entitlements', () => {
  const result = evaluateRt92PremiumReleaseReadiness({
    economicsScenarios: [
      scenario('pro', 'expected'), scenario('pro', 'heavy'), scenario('pro', 'abuse-edge'),
      scenario('ultra', 'expected'), scenario('ultra', 'heavy'), scenario('ultra', 'abuse-edge')
    ],
    ultimateEconomics,
    commercialEvidence,
    proofs: allProofs
  });
  assert.equal(result.commercialEvidenceReady, true);
  assert.equal(result.readyForCommercialOperation, true);
  assert.equal(result.dodoProductCreationAuthorizedByThisModule, false);
  assert.equal(result.checkoutActivationAuthorizedByThisModule, false);
  assert.equal(result.entitlementGrantAuthorizedByThisModule, false);
});

test('truth contract records Production checkout but retains no browser/module grant authority', () => {
  const truth = getRt92PremiumCommercialActivationTruth();
  assert.equal(truth.commercialTierStatus, 'production-live');
  assert.equal(truth.checkoutConfiguredInProduction, true);
  assert.equal(truth.canCreateDodoProduct, false);
  assert.equal(truth.canEnableCheckout, false);
  assert.equal(truth.canGrantEntitlement, false);
  assert.equal(truth.requiresOwnerCommercialReleaseApproval, true);
});
