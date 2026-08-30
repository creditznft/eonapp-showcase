import assert from 'node:assert/strict';
import test from 'node:test';
import { W487_INSTITUTIONAL_CODE_CLOSURE, W487_PRIMARY_HIERARCHY, validateW487InstitutionalCodeClosureContract } from '../../config/w487-institutional-code-closure-contract.mjs';
import { inspectW487InstitutionalCodeClosure } from '../../scripts/w487-institutional-code-closure-gate.mjs';

test('W487 defines a single visible product hierarchy without activating blocked capabilities', () => {
  assert.deepEqual(validateW487InstitutionalCodeClosureContract(), []);
  assert.deepEqual(W487_PRIMARY_HIERARCHY.map((entry) => entry.label), ['EONBOT', 'Projects', 'Library', 'Forge', 'EON City', 'Vault']);
  assert.equal(W487_INSTITUTIONAL_CODE_CLOSURE.sourceImplementationScore, 96);
  assert.equal(W487_INSTITUTIONAL_CODE_CLOSURE.requiredSourceControls.automaticPostingAllowedNow, false);
  assert.equal(W487_INSTITUTIONAL_CODE_CLOSURE.requiredSourceControls.paymentAllowedNow, false);
  assert.equal(W487_INSTITUTIONAL_CODE_CLOSURE.requiredSourceControls.iotRemoteControlAllowedNow, false);
});

test('W487 source gate protects the current institutional code-closure boundary', () => {
  const report = inspectW487InstitutionalCodeClosure({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.cityCommandDeck.firstFrameShield, true);
  assert.equal(report.cityCommandDeck.overflowContainment, true);
  assert.ok(report.cityCommandDeck.maxDetailLength <= 58);
  assert.equal(report.releaseEvidenceStillRequired.length, 5);
});
