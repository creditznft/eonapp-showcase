import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_VIDEO_GIB,
  buildLocalVideoSafetyPlan,
  estimateLocalVideoWorkload,
  getLocalVideoGovernorTruth,
  normalizeLocalVideoRecipe
} from '../../assets/js/local-ai/local-video-efficiency-governor.js';

test('W625G conservative default is 512×288, 33 frames, 16 FPS and queue one', () => {
  const recipe = normalizeLocalVideoRecipe({});
  assert.deepEqual({ width: recipe.width, height: recipe.height, frames: recipe.frames, fps: recipe.fps, batch: recipe.batch, queue: recipe.queueConcurrency }, { width: 512, height: 288, frames: 33, fps: 16, batch: 1, queue: 1 });
});

test('W625G workload returns directional storage estimates, not promises', () => {
  const result = estimateLocalVideoWorkload({});
  assert.equal(result.estimateOnly, true);
  assert.ok(result.temporaryBytes > 0);
  assert.ok(result.recommendedFreeStorageBytes >= 35 * LOCAL_VIDEO_GIB);
});

test('W625G low storage blocks before submit', () => {
  const plan = buildLocalVideoSafetyPlan({ freeStorageBytes: 1 * LOCAL_VIDEO_GIB, acPower: true, thermalMonitoring: true });
  assert.equal(plan.canSubmit, false);
  assert.ok(plan.blockers.includes('free-storage-below-reviewed-minimum'));
});

test('W625G missing AC and thermal evidence produce warnings', () => {
  const plan = buildLocalVideoSafetyPlan({ freeStorageBytes: 50 * LOCAL_VIDEO_GIB, acPower: false, thermalMonitoring: false, batteryPercent: 20 });
  assert.ok(plan.warnings.includes('ac-power-not-confirmed'));
  assert.ok(plan.warnings.includes('thermal-monitoring-not-confirmed'));
  assert.ok(plan.warnings.includes('battery-low-for-long-video-job'));
});

test('W625G cleanup is proposal-only and protects owner-saved media', () => {
  const plan = buildLocalVideoSafetyPlan({ freeStorageBytes: 50 * LOCAL_VIDEO_GIB, acPower: true, thermalMonitoring: true });
  assert.equal(plan.cleanupProposal.automaticDeletion, false);
  assert.equal(plan.cleanupProposal.requiresExplicitUserApproval, true);
  assert.ok(plan.cleanupProposal.neverDelete.includes('owner-saved-video'));
});

test('W625G truth has no exact latency or memory promise', () => {
  const truth = getLocalVideoGovernorTruth();
  assert.equal(truth.exactMemoryPromise, false);
  assert.equal(truth.exactLatencyPromise, false);
  assert.equal(truth.queueConcurrency, 1);
});
