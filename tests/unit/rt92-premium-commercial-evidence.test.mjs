import test from 'node:test';
import assert from 'node:assert/strict';
import { RT92_CLOUDFLARE_DURABLE_COST_EVIDENCE_2026_08_17 as cloudflareEvidence } from '../../config/evidence/rt92-cloudflare-durable-cost-evidence-2026-08-17.mjs';
import {
  validateRt92HostedAiCostEvidence,
  validateRt92DodoAccountCostEvidence,
  evaluateRt92PremiumCommercialEvidence,
  getRt92PremiumCommercialEvidenceTruth
} from '../../config/rt92-premium-commercial-evidence.mjs';
const nowMs = Date.UTC(2026, 7, 17, 5, 0, 0);
const hostedAiEvidence = {
  observedAtMs: nowMs, sourceAuthority: 'official-provider-pricing', providerId: 'provider-a', modelId: 'model-a',
  workUnitDefinition: 'bounded work unit', usdPerWorkUnit: 0.01, evidenceRef: 'provider-pricing:2026-08-17'
};
const dodoAccountEvidence = {
  observedAtMs: nowMs, sourceAuthority: 'dodo-account-settlement', evidenceRef: 'dodo-settlement:2026-08',
  basePercentRate: 0.04, fixedFeeUsd: 0.40, subscriptionPercentRate: 0.005, crossBorderPercentReserve: 0.015, refundReserveUsdPerSale: 0.05
};

test('hosted AI cost evidence requires a selected provider/model, explicit work unit and fresh official/contract authority', () => {
  const result = validateRt92HostedAiCostEvidence(hostedAiEvidence, { nowMs });
  assert.equal(result.ok, true);
  assert.equal(result.authorizesProviderSpend, false);
  assert.equal(validateRt92HostedAiCostEvidence({ ...hostedAiEvidence, providerId: '' }, { nowMs }).ok, false);
  assert.equal(validateRt92HostedAiCostEvidence({ ...hostedAiEvidence, sourceAuthority: 'guess' }, { nowMs }).ok, false);
});

test('Dodo commercial evidence requires account settlement/contract authority, not public marketing pricing alone', () => {
  const result = validateRt92DodoAccountCostEvidence(dodoAccountEvidence, { nowMs });
  assert.equal(result.ok, true);
  assert.equal(result.createsCheckout, false);
  assert.equal(validateRt92DodoAccountCostEvidence({ ...dodoAccountEvidence, sourceAuthority: 'public-pricing-page' }, { nowMs }).ok, false);
});

test('commercial evidence gate requires Cloudflare + selected hosted AI + actual Dodo account evidence together', () => {
  const result = evaluateRt92PremiumCommercialEvidence({ cloudflareEvidence, hostedAiEvidence, dodoAccountEvidence, nowMs });
  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.createsDodoProduct, false);
  assert.equal(result.authorizesProviderSpend, false);
});

test('commercial evidence gate fails closed when hosted-provider cost evidence is absent', () => {
  const result = evaluateRt92PremiumCommercialEvidence({ cloudflareEvidence, dodoAccountEvidence, nowMs });
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes('current-hosted-ai-provider-cost-evidence'));
});

test('commercial evidence truth explicitly rejects public Dodo marketing price as account authority', () => {
  const truth = getRt92PremiumCommercialEvidenceTruth();
  assert.equal(truth.publicMarketingPriceAloneIsDodoAccountAuthority, false);
  assert.equal(truth.accountSpecificDodoEvidenceRequired, true);
  assert.equal(truth.selectedHostedProviderAndModelEvidenceRequired, true);
  assert.equal(truth.grantsEntitlement, false);
});
