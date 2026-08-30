import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMFYUI_IMAGE_DEVICE_PROFILES,
  COMFYUI_IMAGE_WORKFLOWS,
  chooseProofEligibleComfyUiCheckpoint,
  classifyComfyUiCheckpoint,
  getComfyUiImageWorkflowRegistryTruth,
  resolveComfyUiImageRecipe
} from '../../assets/js/local-ai/comfyui-image-workflow-registry.js';

const BUILTIN = new Set(['CheckpointLoaderSimple', 'CLIPTextEncode', 'EmptyLatentImage', 'KSampler', 'VAEDecode', 'SaveImage']);

test('W625B registry exposes one versioned, allowlisted, standard-node text-to-image workflow', () => {
  assert.equal(COMFYUI_IMAGE_WORKFLOWS.length, 1);
  const workflow = COMFYUI_IMAGE_WORKFLOWS[0];
  assert.equal(workflow.status, 'allowlisted');
  assert.equal(workflow.standardNodesOnly, true);
  assert.deepEqual(new Set(workflow.nodeTypes), BUILTIN);
  assert.equal(workflow.batchSize, 1);
});

test('W625B first proof recipe is fixed at low-VRAM 512 square, 12 steps and one item', () => {
  const recipe = resolveComfyUiImageRecipe({ checkpoint: 'v1-5-pruned.safetensors', profileId: 'high-end', aspectId: 'story', qualityId: 'detail', proofMode: true, seed: 42 });
  assert.equal(recipe.profileId, 'high-end');
  assert.equal(recipe.aspectId, 'square');
  assert.equal(recipe.qualityId, 'proof');
  assert.equal(recipe.width, 512);
  assert.equal(recipe.height, 512);
  assert.equal(recipe.steps, 12);
  assert.equal(recipe.batchSize, 1);
  assert.equal(recipe.seed, 42);
  assert.equal(recipe.videoEnabled, false);
});

test('W625B device profiles stay bounded and queue concurrency remains one', () => {
  assert.deepEqual(COMFYUI_IMAGE_DEVICE_PROFILES.map((row) => row.id), ['low-vram', 'medium', 'high-end']);
  for (const profile of COMFYUI_IMAGE_DEVICE_PROFILES) {
    assert.equal(profile.queueConcurrency, 1);
    assert.ok(profile.maximumDimension <= 1024);
    assert.ok(profile.maximumSteps <= 36);
  }
});

test('W625B auto-selects only a recognised SD 1.5 proof checkpoint', () => {
  assert.equal(classifyComfyUiCheckpoint('v1-5-pruned-emaonly.safetensors').family, 'sd15');
  assert.equal(classifyComfyUiCheckpoint('sd_xl_base_1.0.safetensors').proofEligible, false);
  assert.equal(classifyComfyUiCheckpoint('flux1-dev.safetensors').blockedForAutomaticProof, true);
  assert.equal(chooseProofEligibleComfyUiCheckpoint(['flux1-dev.safetensors', 'v1-5-pruned.safetensors']), 'v1-5-pruned.safetensors');
});

test('W625B truth forbids imports, installs, LAN/public runtime and cloud fallback', () => {
  const truth = getComfyUiImageWorkflowRegistryTruth();
  assert.equal(truth.automaticWorkflowImport, false);
  assert.equal(truth.automaticModelInstall, false);
  assert.equal(truth.automaticNodeInstall, false);
  assert.equal(truth.lanOrPublicRuntime, false);
  assert.equal(truth.cloudFallback, false);
  assert.equal(truth.laterTasks.video, 'disabled-in-w625a-w625c');
});
