import test from 'node:test';
import assert from 'node:assert/strict';
import { RT92_CLOUDFLARE_DURABLE_COST_EVIDENCE_2026_08_17 as evidence } from '../../config/evidence/rt92-cloudflare-durable-cost-evidence-2026-08-17.mjs';
import {
  validateRt92CloudflareDurableCostEvidence,
  estimateRt92CloudflareDurableMonthlyOverage,
  estimateRt92WorkflowMarginalRunBeyondIncluded,
  getRt92CloudflareDurableEconomicsTruth
} from '../../config/rt92-cloudflare-durable-runtime-economics.mjs';

const now = Date.UTC(2026, 7, 17, 5, 0, 0);

test('dated Cloudflare Workflows + D1 evidence is official, current and explicitly excludes hosted AI', () => {
  const result = validateRt92CloudflareDurableCostEvidence(evidence, { nowMs: now });
  assert.equal(result.ok, true);
  assert.equal(result.officialSource, true);
  assert.equal(result.hostedAiIncluded, false);
  assert.equal(result.workflowBillingEffectiveFrom, '2026-08-10');
});

test('Cloudflare evidence fails closed when stale or sourced from a non-official host', () => {
  const stale = validateRt92CloudflareDurableCostEvidence(evidence, { nowMs: Date.UTC(2026, 10, 1) });
  assert.equal(stale.ok, false);
  const wrongSource = validateRt92CloudflareDurableCostEvidence({ ...evidence, sourceHost: 'example.com' }, { nowMs: now });
  assert.equal(wrongSource.ok, false);
  assert.equal(wrongSource.officialSource, false);
});

test('included Workers Paid Workflows and D1 allowances produce zero overage in the account model', () => {
  const result = estimateRt92CloudflareDurableMonthlyOverage({
    nowMs: now, evidence,
    usage: {
      workflowRequests: 100_000,
      workflowCpuMs: 1_000_000,
      workflowStorageGbMonth: 0.1,
      workflowSteps: 100_000,
      d1RowsRead: 1_000_000,
      d1RowsWritten: 100_000,
      d1StorageGbMonth: 0.5
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.totalOverageUsd, 0);
  assert.equal(result.hostedAiCostUsd, null);
  assert.equal(result.premiumProductActivationAuthorized, false);
});

test('account-level model applies documented marginal overage dimensions only after included allowances', () => {
  const result = estimateRt92CloudflareDurableMonthlyOverage({
    nowMs: now, evidence,
    usage: {
      workflowRequests: 11_000_000,
      workflowCpuMs: 31_000_000,
      workflowStorageGbMonth: 2,
      workflowSteps: 600_000,
      d1RowsRead: 26_000_000_000,
      d1RowsWritten: 51_000_000,
      d1StorageGbMonth: 6
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.components.workflowRequestsUsd, 0.30);
  assert.equal(result.components.workflowCpuUsd, 0.02);
  assert.equal(result.components.workflowStorageUsd, 0.20);
  assert.equal(result.components.workflowStepsUsd, 0.80);
  assert.equal(result.components.d1ReadsUsd, 1.00);
  assert.equal(result.components.d1WritesUsd, 1.00);
  assert.equal(result.components.d1StorageUsd, 0.75);
  assert.equal(Number(result.totalOverageUsd.toFixed(2)), 4.07);
});

test('marginal workflow-run estimator is a worst-case overage helper, not an AI cost or commercial approval', () => {
  const result = estimateRt92WorkflowMarginalRunBeyondIncluded({ nowMs: now, evidence, steps: 4, cpuMs: 100 });
  assert.equal(result.ok, true);
  assert.equal(result.marginalUsd > 0, true);
  assert.equal(result.assumptions.assumesIncludedAllowancesAlreadyExhausted, true);
  assert.equal(result.hostedAiCostUsd, null);
  assert.equal(result.premiumProductActivationAuthorized, false);
});

test('truth contract cannot create resources, edit Wrangler, create Dodo products or grant entitlement', () => {
  const truth = getRt92CloudflareDurableEconomicsTruth();
  assert.equal(truth.createsCloudflareResource, false);
  assert.equal(truth.editsWrangler, false);
  assert.equal(truth.createsDodoProduct, false);
  assert.equal(truth.grantsEntitlement, false);
  assert.equal(truth.hostedAiExcluded, true);
});
