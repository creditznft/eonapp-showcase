import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_LOCAL_FIRST_BOUNDARY, EON_LOCAL_FIRST_NOTICES, isLocalFirstBoundarySatisfied } from '../../assets/js/local-first/local-first-boundary.js';
import { getCapabilityTruth } from '../../assets/js/capabilities/capability-truth-registry.js';
import { getRetiredAccountAttachmentStatus, EON_LEGACY_ACCOUNT_ATTACHMENTS_RETIRED } from '../../assets/js/utils/eon-accounts-manager.js';
import { runW306LocalFirstBoundaryGate } from '../../scripts/w306-local-first-boundary-gate.mjs';

test('W306 locks local-first identity, workspace, execution, provider, and City boundaries', () => {
  assert.equal(isLocalFirstBoundarySatisfied(EON_LOCAL_FIRST_BOUNDARY), true);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.identity.googleLogin, 'planned-optional');
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.identity.oneTap, 'retired');
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.identity.compulsoryAccount, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.identity.googleIdentityIsDataBackup, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.data.userWorkspaceCloudStore, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.data.automaticCrossDeviceSync, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.execution.backgroundAfterClose, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.provider.hiddenRelayAllowed, false);
  assert.equal(EON_LOCAL_FIRST_BOUNDARY.city.executor, false);
  assert.match(EON_LOCAL_FIRST_NOTICES.geminiByok, /does not automatically sign you in to EONAPP/i);
});

test('W306 removes legacy account attachment behavior rather than leaving a live fallback', () => {
  assert.equal(EON_LEGACY_ACCOUNT_ATTACHMENTS_RETIRED, true);
  const status = getRetiredAccountAttachmentStatus();
  assert.equal(status.active, false);
  assert.equal(status.networkRequestCreated, false);
  assert.equal(status.storageWriteCreated, false);
  assert.equal(getCapabilityTruth('legacy-google-one-tap')?.lifecycle, 'retired');
  assert.equal(getCapabilityTruth('google-identity-sign-in')?.lifecycle, 'planned');
  assert.equal(getCapabilityTruth('legacy-browser-account-attachments')?.lifecycle, 'retired');
  assert.equal(getCapabilityTruth('cloud-workspace-control-plane')?.lifecycle, 'blocked');
});

test('W306 source gate allows only planned optional Google identity and blocks cloud-account copy regressions', () => {
  const report = runW306LocalFirstBoundaryGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
