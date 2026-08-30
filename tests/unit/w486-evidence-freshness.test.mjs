import test from 'node:test';
import assert from 'node:assert/strict';
import { W486_EVIDENCE_FRESHNESS_CONTRACT, validateW486EvidenceFreshnessContract } from '../../config/w486-evidence-freshness-contract.mjs';
import { inspectW486EvidenceFreshness } from '../../scripts/w486-evidence-freshness-gate.mjs';

test('W486 makes current executable evidence authoritative without deleting historical audit context', () => {
  assert.deepEqual(validateW486EvidenceFreshnessContract(), []);
  assert.equal(W486_EVIDENCE_FRESHNESS_CONTRACT.authorityOrder[0], 'current-executable-test-and-gate-output');
  assert.equal(W486_EVIDENCE_FRESHNESS_CONTRACT.truth.staleArtifactCanApproveRelease, false);
  assert.equal(W486_EVIDENCE_FRESHNESS_CONTRACT.truth.staleArtifactCanBlockCurrentSourceWithoutReproduction, false);
  assert.equal(W486_EVIDENCE_FRESHNESS_CONTRACT.truth.sourceGateCanApproveProduction, false);
});

test('W486 source gate preserves FIX REQUIRED City and unproven physical-device status', () => {
  const result = inspectW486EvidenceFreshness();
  assert.equal(result.status, 'pass');
  assert.equal(result.externalStatus.liveCityCertification, 'FIX REQUIRED');
  assert.equal(result.externalStatus.physicalDeviceProof, 'NOT PROVEN');
  assert.equal(result.staleArtifacts.length, 2);
});
