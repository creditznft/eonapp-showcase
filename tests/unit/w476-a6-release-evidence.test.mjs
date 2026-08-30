import assert from 'node:assert/strict';
import test from 'node:test';
import { W476_A6_RELEASE_EVIDENCE_CONTRACT, validateW476A6ReleaseEvidenceContract } from '../../config/w476-a6-release-evidence-contract.mjs';
import { buildW476A6ExternalOriginInventory, buildW476A6Sbom, inspectW476A6ReleaseEvidence } from '../../scripts/w476-a6-release-evidence-gate.mjs';

test('W476-A6 release evidence contract stays source-only and payment/Dodo fail-closed', () => {
  assert.deepEqual(validateW476A6ReleaseEvidenceContract(), []);
  assert.equal(W476_A6_RELEASE_EVIDENCE_CONTRACT.boundaries.productionReleaseApproved, false);
  assert.equal(W476_A6_RELEASE_EVIDENCE_CONTRACT.boundaries.paymentActivationApproved, false);
  assert.equal(W476_A6_RELEASE_EVIDENCE_CONTRACT.boundaries.dodoActivationApproved, false);
  assert.equal(W476_A6_RELEASE_EVIDENCE_CONTRACT.boundaries.localImageVideoAdapterClaimed, false);
});

test('W476-A6 deterministic SBOM separates locked production components from development tooling', () => {
  const sbom = buildW476A6Sbom();
  assert.match(sbom.packageLockSha256, /^[a-f0-9]{64}$/);
  assert.ok(sbom.componentCount >= sbom.productionComponentCount);
  assert.ok(sbom.productionComponentCount > 0);
  assert.ok(sbom.components.some((component) => component.name === 'wrangler'));
  assert.ok(sbom.components.some((component) => component.developmentOnly));
});

test('W476-A6 origin inventory exposes broad CSP and unreconciled legacy literals without self-approving release', () => {
  const inventory = buildW476A6ExternalOriginInventory();
  assert.ok(inventory.originCount > 0);
  assert.ok(inventory.broadCspSchemes.includes('connect-src'));
  assert.ok(inventory.origins.some((entry) => entry.classification === 'approved-local-loopback'));
  assert.ok(inventory.origins.some((entry) => entry.classification === 'legacy-local-literal'));
  assert.ok(inventory.unreviewedOriginCount > 0);
});

test('W476-A6 source evidence gate passes while release remains explicitly externally blocked', () => {
  const result = inspectW476A6ReleaseEvidence({ writeArtifacts: false });
  assert.equal(result.ok, true, result.issues.join('\n'));
  assert.equal(result.productionReleaseApproved, false);
  assert.equal(result.paymentActivationApproved, false);
  assert.equal(result.dodoActivationApproved, false);
  assert.ok(result.releaseBlockedBy.includes('productionCspSyntheticViolationAndRedactionProof'));
  assert.ok(result.releaseBlockedBy.includes('unreviewed-external-origin-review'));
  assert.ok(result.releaseBlockedBy.includes('legacy-local-origin-cleanup'));
});
