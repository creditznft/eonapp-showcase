import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W476_B_PRODUCTION_PROOF_CONTRACT,
  validateW476BProductionProofContract
} from '../../config/w476-b-production-proof-contract.mjs';
import {
  buildW476BDryRunPlan,
  normalizeW476BBaseUrl,
  runW476BProductionProof,
  summarizeW476BCspPolicy
} from '../../scripts/w476-b-production-proof.mjs';
import { inspectW476BProductionProofSource } from '../../scripts/w476-b-production-proof-gate.mjs';

test('W476-B contract is redaction-first and cannot approve release, Dodo or local media', () => {
  assert.deepEqual(validateW476BProductionProofContract(), []);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.networkOptInOnly, true);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.boundaries.productionReleaseApproved, false);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.boundaries.dodoActivationApproved, false);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.boundaries.localImageVideoAdapterClaimed, false);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.manualEvidence.length, 9);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.redaction.persistResponseBodies, false);
  assert.equal(W476_B_PRODUCTION_PROOF_CONTRACT.redaction.persistConsoleMessages, false);
});

test('W476-B no-network plan stays explicit about its current Function routes and manual evidence', async () => {
  const plan = buildW476BDryRunPlan();
  assert.equal(plan.status, 'dry-run-no-network');
  assert.equal(plan.functionRouteCount, 12);
  assert.equal(plan.productionReleaseApproved, false);
  assert.equal(plan.paymentActivationApproved, false);
  assert.equal(plan.dodoActivationApproved, false);
  assert.equal(plan.localImageVideoAdapterClaimed, false);
  assert.ok(plan.manualEvidence.some((entry) => entry.id === 'local-ai-ollama'));
  const result = await runW476BProductionProof();
  assert.equal(result.status, 'dry-run-no-network');
  assert.equal(result.networkOptIn, undefined);
});

test('W476-B base URL and CSP summaries do not retain paths, query values or policy values', () => {
  assert.throws(() => normalizeW476BBaseUrl('https://eonapp.ch/path?secret=no'), /query strings/);
  assert.throws(() => normalizeW476BBaseUrl('http://eonapp.ch'), /HTTPS/);
  assert.equal(normalizeW476BBaseUrl('http://localhost:5173', { allowInsecureLocal: true }), 'http://localhost:5173');
  const summary = summarizeW476BCspPolicy("default-src 'self'; report-to csp-endpoint; report-uri /csp-report; upgrade-insecure-requests");
  assert.deepEqual(summary, {
    headerPresent: true,
    reportToDirective: true,
    reportUriDirective: true,
    hasUpgradeInsecureRequests: true
  });
  assert.equal('policy' in summary, false);
});

test('W476-B source gate is green while production remains honestly blocked', () => {
  const result = inspectW476BProductionProofSource({ writeArtifact: false });
  assert.equal(result.ok, true, result.issues.join('\n'));
  assert.equal(result.productionReleaseApproved, false);
  assert.equal(result.paymentActivationApproved, false);
  assert.equal(result.dodoActivationApproved, false);
  assert.equal(result.localImageVideoAdapterClaimed, false);
  assert.ok(result.releaseBlockedBy.includes('local-text-runtime-cors-pna-proof'));
});
