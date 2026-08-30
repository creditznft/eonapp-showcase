import assert from 'node:assert/strict';
import test from 'node:test';
import { W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT, validateW400W402CreatorAdapterFoundationContract } from '../../config/w400-w402-creator-adapter-foundation-contract.mjs';
import { buildCreatorEngineOverview, buildCreatorTaskPlan, CREATOR_EXECUTION_MODES, CREATOR_TASKS } from '../../assets/js/creator/creator-engine-registry.js';
import { buildCreatorMediaCatalog } from '../../assets/js/local-ai/creator-media-catalog.js';
import { getCreatorEngineWorkspaceTruth } from '../../assets/js/creator/creator-engine-workspace.js';
import { inspectW400W402CreatorAdapterFoundation } from '../../scripts/w400-w402-creator-adapter-foundation-gate.mjs';

test('W400/W402 keeps Workspace planning draft-first while current media tasks hand off to separate execution surfaces', () => {
  assert.deepEqual(validateW400W402CreatorAdapterFoundationContract(), []);
  assert.deepEqual(CREATOR_EXECUTION_MODES.map((entry) => entry.id), W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT.executionModes);
  assert.deepEqual(CREATOR_TASKS.map((entry) => entry.id), W400_W402_CREATOR_ADAPTER_FOUNDATION_CONTRACT.requiredTasks);
  const truth = getCreatorEngineWorkspaceTruth();
  assert.equal(truth.credentialsCollectedHere, false);
  assert.equal(truth.vaultOnlyCredentialBoundary, true);
  assert.equal(truth.mediaProviderCalls, false);
  assert.equal(truth.canonicalExecutionSurface, '/create');
  assert.equal(truth.workspaceRole, 'planning-and-handoff');
});

test('W400/W402 refuses a mobile local full-video promise but offers a local image route on an RTX creator device', () => {
  const mobile = { label: 'Mobile browser', computeClass: 'mobile', acceleration: 'cpu-only', summary: 'Cloud or draft first.' };
  const mobileVideo = buildCreatorTaskPlan('video', { profile: mobile });
  assert.equal(mobileVideo.modes.find((mode) => mode.id === 'local-runtime').available, false);
  const rtx = { label: 'RTX creator device', computeClass: 'rtx-creator', acceleration: 'rtx', summary: 'Creator-capable device.' };
  const localImage = buildCreatorTaskPlan('image', { profile: rtx });
  assert.equal(localImage.modes.find((mode) => mode.id === 'local-runtime').available, true);
  const rtxVideo = buildCreatorTaskPlan('video', { profile: rtx });
  assert.equal(rtxVideo.modes.find((mode) => mode.id === 'local-runtime').available, false);
});

test('W400/W402 catalog remains guidance only and static gate passes', () => {
  const profile = { label: 'GPU device', computeClass: 'gpu-standard', acceleration: 'discrete-gpu', summary: 'Selective local image work.' };
  const catalog = buildCreatorMediaCatalog(profile);
  assert.equal(catalog.entries.length, CREATOR_TASKS.filter((task) => task.id !== 'content-package').length);
  assert.ok(catalog.rules.some((rule) => /auto-install/i.test(rule)));
  const overview = buildCreatorEngineOverview({ profile });
  assert.equal(overview.truth.providerCalls, false);
  assert.equal(overview.truth.upload, false);
  const report = inspectW400W402CreatorAdapterFoundation();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 9);
});
