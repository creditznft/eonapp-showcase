import assert from 'node:assert/strict';
import test from 'node:test';
import { W528_MACHINE_EVIDENCE_CONTRACT, validateW528MachineEvidenceContract } from '../../config/w528-machine-evidence-contract.mjs';
import { buildW528MachineEvidenceReceipt } from '../../scripts/w528-machine-evidence.mjs';
import { inspectW528MachineEvidence } from '../../scripts/w528-machine-evidence-gate.mjs';

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W528 prepares source and emulated-browser coverage without starting a browser or claiming a device result', () => {
  assert.deepEqual(validateW528MachineEvidenceContract(), []);
  const receipt = buildW528MachineEvidenceReceipt();
  assert.equal(receipt.ok, true, receipt.issues.join('\n'));
  assert.equal(receipt.evidenceLabels.source, 'source-pass');
  assert.equal(receipt.evidenceLabels.emulatedBrowser, 'emulated-browser-pending');
  assert.equal(receipt.actualBrowserStarted, false);
  assert.equal(receipt.physicalDeviceObserved, false);
  assert.equal(receipt.pwaInstalled, false);
  assert.equal(receipt.serviceWorkerUpdateApplied, false);
  assert.equal(receipt.capsuleDataRead, false);
});

test('W528 keeps the complete browser, viewport and recovery/update scenario matrix visible', () => {
  const receipt = buildW528MachineEvidenceReceipt();
  assert.deepEqual(receipt.plannedCoverage.browserFamilies, W528_MACHINE_EVIDENCE_CONTRACT.requiredBrowserFamilies);
  assert.deepEqual(receipt.plannedCoverage.viewportFamilies, W528_MACHINE_EVIDENCE_CONTRACT.requiredViewportFamilies);
  assert.ok(receipt.plannedCoverage.scenarios.includes('two-build-service-worker-update-rehearsal'));
  assert.ok(receipt.plannedCoverage.scenarios.includes('fixture-capsule-export-import'));
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W528 source gate remains local-only and rejects runtime evidence inflation', () => {
  const report = inspectW528MachineEvidence();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.sourceOnly, true);
  assert.equal(report.receipt.physicalDeviceObserved, false);
});
