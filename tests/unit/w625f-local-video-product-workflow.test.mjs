import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMFYUI_VIDEO_WORKFLOW_ID,
  getComfyUiVideoWorkflowRegistryTruth,
  prepareComfyUiVideoApiWorkflow,
  reviewComfyUiVideoApiWorkflow
} from '../../assets/js/local-ai/comfyui-video-workflow-registry.js';
import { normalizeLocalVideoRecipe } from '../../assets/js/local-ai/local-video-efficiency-governor.js';

const base = () => ({
  a: { class_type: 'LoadImage', inputs: { image: 'x.png' } },
  b: { class_type: 'CLIPTextEncode', inputs: { text: 'x' } },
  c: { class_type: 'WanImageToVideo', inputs: { width: 512, height: 288, frames: 33, fps: 16 } },
  d: { class_type: 'RandomNoise', inputs: { noise_seed: 1 } },
  e: { class_type: 'SamplerCustomAdvanced', inputs: {} },
  f: { class_type: 'VAEDecode', inputs: {} },
  g: { class_type: 'SaveWEBM', inputs: {} }
});

test('W625F registry is source-owned, image-to-video first and no custom nodes', () => {
  const truth = getComfyUiVideoWorkflowRegistryTruth();
  assert.equal(truth.workflowId, COMFYUI_VIDEO_WORKFLOW_ID);
  assert.equal(truth.firstProofMode, 'image-to-video');
  assert.equal(truth.customNodesAllowed, false);
  assert.equal(truth.arbitraryWorkflowExecutionAllowed, false);
});

test('W625F missing output role blocks the workflow', async () => {
  const candidate = base();
  delete candidate.g;
  const review = await reviewComfyUiVideoApiWorkflow(candidate);
  assert.equal(review.ok, false);
  assert.ok(review.missingRoles.includes('output'));
});

test('W625F unknown node class blocks the workflow', async () => {
  const candidate = base();
  candidate.z = { class_type: 'RandomCommunityNode', inputs: {} };
  const review = await reviewComfyUiVideoApiWorkflow(candidate);
  assert.equal(review.ok, false);
  assert.ok(review.unapprovedClassTypes.includes('RandomCommunityNode'));
});

test('W625F recipe clamps resolution, frame count, fps, steps and batch', () => {
  const recipe = normalizeLocalVideoRecipe({ width: 4000, height: 4000, frames: 500, fps: 100, steps: 100 });
  assert.equal(recipe.width, 768);
  assert.equal(recipe.height, 432);
  assert.equal(recipe.frames, 49);
  assert.equal(recipe.fps, 24);
  assert.equal(recipe.steps, 24);
  assert.equal(recipe.batch, 1);
  assert.equal(recipe.queueConcurrency, 1);
});

test('W625F first proof rejects text-to-video mode', async () => {
  const review = await reviewComfyUiVideoApiWorkflow(base());
  assert.throws(() => prepareComfyUiVideoApiWorkflow(review, {
    confirmedWorkflowSha256: review.sha256,
    mode: 'text-to-video',
    uploadedImageName: 'frame.png',
    prompt: 'motion',
    seed: 1
  }), /image-to-video-required/);
});

test('W625F proof recipe has no audio, interpolation or upscaler', () => {
  const recipe = normalizeLocalVideoRecipe({});
  assert.equal(recipe.audio, false);
  assert.equal(recipe.interpolation, false);
  assert.equal(recipe.upscaler, false);
  assert.equal(recipe.customNodes, false);
});
