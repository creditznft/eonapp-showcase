import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildComfyUiImageWorkflow,
  discoverComfyUiCapabilities,
  generateComfyUiImage,
  isApprovedComfyUiEndpoint
} from '../../assets/js/local-ai/comfyui-local-media.js';
import { getLocalAiRuntimeTruth, isApprovedLocalAiLoopbackEndpoint } from '../../config/local-ai-browser-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W623A allows only the explicit ComfyUI loopback ports', () => {
  for (const port of [8000, 8188, 8189]) assert.equal(isApprovedComfyUiEndpoint(`http://127.0.0.1:${port}`), true);
  assert.equal(isApprovedComfyUiEndpoint('http://localhost:8188'), true);
  assert.equal(isApprovedComfyUiEndpoint('http://127.0.0.1:8190'), false);
  assert.equal(isApprovedComfyUiEndpoint('http://192.168.1.5:8188'), false);
  assert.equal(isApprovedComfyUiEndpoint('https://127.0.0.1:8188'), false);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://127.0.0.1:8188', 'comfyui'), true);
});

test('W623A discovers only already-installed ComfyUI checkpoints after an explicit scan', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/system_stats')) {
      return new Response(JSON.stringify({ system: { comfyui_version: '0.20.1', python_version: '3.12' }, devices: [{ name: 'NVIDIA RTX', type: 'cuda', vram_total: 4 * 1024 ** 3, vram_free: 3 * 1024 ** 3 }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url).endsWith('/object_info/CheckpointLoaderSimple')) {
      return new Response(JSON.stringify({ CheckpointLoaderSimple: { input: { required: { ckpt_name: [['other-model.safetensors', 'v1-5-pruned-emaonly.safetensors']] } } } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`unexpected URL ${url}`);
  };
  try {
    const result = await discoverComfyUiCapabilities({ endpoint: 'http://127.0.0.1:8188' });
    assert.equal(result.ok, true);
    assert.equal(result.imageReady, true);
    assert.equal(result.videoReady, false);
    assert.equal(result.checkpoints.length, 2);
    assert.equal(result.recommendedCheckpoint, 'v1-5-pruned-emaonly.safetensors');
    assert.equal(result.devices[0].vramTotalBytes, 4 * 1024 ** 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('W623A builds a bounded built-in 512px image workflow without custom nodes', () => {
  const workflow = buildComfyUiImageWorkflow({ checkpoint: 'v1-5.safetensors', prompt: 'A calm graphite city', width: 513, height: 499, steps: 12 });
  assert.equal(workflow['4'].class_type, 'CheckpointLoaderSimple');
  assert.equal(workflow['5'].inputs.width % 64, 0);
  assert.equal(workflow['5'].inputs.height % 64, 0);
  assert.equal(workflow['5'].inputs.batch_size, 1);
  assert.equal(workflow['9'].class_type, 'SaveImage');
  assert.deepEqual(new Set(Object.values(workflow).map((node) => node.class_type)), new Set(['CheckpointLoaderSimple', 'CLIPTextEncode', 'EmptyLatentImage', 'KSampler', 'VAEDecode', 'SaveImage']));
});

test('W623A requires a user action and can submit, poll and receive local image metadata', async () => {
  const blocked = await generateComfyUiImage({ endpoint: 'http://127.0.0.1:8188', checkpoint: 'v1-5.safetensors', prompt: 'test' });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error, 'explicit-user-action-required');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/prompt')) {
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.equal(body.prompt['4'].inputs.ckpt_name, 'v1-5.safetensors');
      return new Response(JSON.stringify({ prompt_id: 'job-123' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url).endsWith('/history/job-123')) {
      return new Response(JSON.stringify({ 'job-123': { status: { completed: true, status_str: 'success' }, outputs: { 9: { images: [{ filename: 'EONAPP_Local_Image_00001_.png', subfolder: '', type: 'output' }] } } } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`unexpected URL ${url}`);
  };
  try {
    const result = await generateComfyUiImage({ endpoint: 'http://127.0.0.1:8188', checkpoint: 'v1-5.safetensors', prompt: 'A calm graphite city', explicitUserAction: true, timeoutMs: 5000 });
    assert.equal(result.ok, true);
    assert.equal(result.outputs.length, 1);
    assert.match(result.outputs[0].url, /^http:\/\/127\.0\.0\.1:8188\/view\?/);
    assert.match(result.outputs[0].url, /filename=EONAPP_Local_Image_00001_.png/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('W623A image adapter stays narrow while W625D-H video remains separately proof-gated', () => {
  const truth = getLocalAiRuntimeTruth();
  assert.deepEqual(truth.localMediaRuntimeIds, ['comfyui', 'acestep']);
  assert.equal(truth.mediaRuntimeAdapter, 'comfyui-image-video-plus-acestep-music-proof');
  assert.equal(truth.imageGeneration, 'proof-gated-comfyui-loopback');
  assert.equal(truth.videoModelSelection, 'reviewed-native-workflow-session-confirmation');
  assert.equal(truth.videoCapabilityDetection, 'supported-experimental-unsupported-w625d');
  assert.equal(truth.videoCertification, 'real-reference-device-and-owner-four-gb-fallback-w625h');
  const page = read('assets/js/local-ai/local-ai-page.js');
  assert.match(page, /renderComfyUiImageLab/);
  assert.match(page, /renderComfyUiVideoLab/);
  const lab = read('assets/js/local-ai/comfyui-image-lab.js');
  assert.match(lab, /data-comfy-compact-guide/);
  assert.match(lab, /Comfy Desktop cannot run inside this phone/);
  assert.match(lab, /connected rail pending proof/);
  assert.match(read('assets/js/local-ai/comfyui-image-lab.js'), /Video is checked separately/);
  assert.match(read('assets/js/local-ai/comfyui-image-lab.js'), /working image setup does not imply local video is ready/i);
  assert.match(read('assets/js/local-ai/comfyui-local-media.js'), /explicitUserAction/);
  assert.doesNotMatch(read('assets/js/local-ai/comfyui-local-media.js'), /192\.168\.|10\.0\.0\./);
});
