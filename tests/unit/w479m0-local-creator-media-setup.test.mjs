import assert from 'node:assert/strict';
import test from 'node:test';
import { W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT, validateW479M0LocalCreatorMediaSetupContract } from '../../config/w479m0-local-creator-media-setup-contract.mjs';
import { buildLocalCreatorMediaSetupOverview, buildLocalCreatorMediaSetupPlan } from '../../assets/js/local-ai/local-creator-media-setup.js';
import { inspectW479M0LocalCreatorMediaSetup } from '../../scripts/w479m0-local-creator-media-setup-gate.mjs';

test('W479-M0 contract keeps setup guidance fail-closed', () => {
  assert.deepEqual(validateW479M0LocalCreatorMediaSetupContract(), []);
  assert.equal(W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.truthBoundary.browserInstallsRuntime, false);
  assert.equal(W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.truthBoundary.browserDownloadsModels, false);
  assert.equal(W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.truthBoundary.adapterConnectionActive, false);
  assert.equal(W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.truthBoundary.generationActive, false);
});

test('W479-M0 refuses mobile local video while guiding RTX image setup', () => {
  const mobile = { label: 'Mobile browser', computeClass: 'mobile', acceleration: 'cpu-only', memoryGB: 4, cpuCores: 8, summary: 'Mobile guide mode.' };
  const rtx = { label: 'RTX creator device', computeClass: 'rtx-creator', acceleration: 'rtx', memoryGB: 16, cpuCores: 12, summary: 'Creator GPU.' };
  const mobileVideo = buildLocalCreatorMediaSetupPlan('video', { profile: mobile });
  const rtxImage = buildLocalCreatorMediaSetupPlan('image', { profile: rtx });
  assert.equal(mobileVideo.state, 'guide-only');
  assert.equal(mobileVideo.truth.generationAvailable, false);
  assert.match(rtxImage.runtimeRecommendation, /ComfyUI/);
  assert.equal(rtxImage.truth.browserInstallsRuntime, false);
});

test('W479-M0 overview keeps local image/video adapters inactive', () => {
  const profile = { label: 'Workstation', computeClass: 'workstation', acceleration: 'multi-gpu', memoryGB: 64, cpuCores: 24, summary: 'Advanced creator device.' };
  const overview = buildLocalCreatorMediaSetupOverview({ profile });
  assert.equal(overview.plans.length, 4);
  assert.equal(overview.releaseTruth.m0IsSetupGuidanceOnly, true);
  assert.equal(overview.releaseTruth.localImageAdapterActive, false);
  assert.equal(overview.releaseTruth.localVideoAdapterActive, false);
  assert.ok(overview.plans.find((plan) => plan.taskId === 'video').proofRequiredBeforeGeneration.includes('real-device-evidence'));
});

test('W479-M0 deterministic gate passes without activating media generation', () => {
  const report = inspectW479M0LocalCreatorMediaSetup();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 11);
  assert.equal(report.samplePlans.rtxImage.truth.generationAvailable, false);
});
