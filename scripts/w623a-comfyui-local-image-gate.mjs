#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCAL_AI_BROWSER_CONTRACT_SCHEMA, LOCAL_AI_RUNTIME_CONTRACTS, getLocalAiCspLoopbackSources, getLocalAiRuntimeTruth } from '../config/local-ai-browser-contract.mjs';
import { buildComfyUiImageWorkflow, isApprovedComfyUiEndpoint } from '../assets/js/local-ai/comfyui-local-media.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(LOCAL_AI_BROWSER_CONTRACT_SCHEMA === 'eonapp.w623.local-ai-browser-contract.v2', 'W623 local AI contract schema missing.');
check(LOCAL_AI_RUNTIME_CONTRACTS.comfyui?.runtimeKind === 'media', 'ComfyUI must be a media runtime.');
check(LOCAL_AI_RUNTIME_CONTRACTS.comfyui?.imageGeneration === 'discover-self-test-generate', 'ComfyUI image generation contract missing.');
check(LOCAL_AI_RUNTIME_CONTRACTS.comfyui?.videoGeneration === 'capability-and-reviewed-workflow-proof-gated', 'Video must remain capability and reviewed-workflow proof-gated.');
for (const port of [8000, 8188, 8189]) check(isApprovedComfyUiEndpoint(`http://127.0.0.1:${port}`), `ComfyUI loopback port ${port} missing.`);
check(!isApprovedComfyUiEndpoint('http://192.168.1.4:8188'), 'LAN ComfyUI endpoints must stay blocked.');
const workflow = buildComfyUiImageWorkflow({ checkpoint: 'proof.safetensors', prompt: 'EON proof image' });
check(workflow['5']?.inputs?.batch_size === 1, 'Image proof workflow must stay batch 1.');
check(Object.values(workflow).every((node) => ['CheckpointLoaderSimple', 'CLIPTextEncode', 'EmptyLatentImage', 'KSampler', 'VAEDecode', 'SaveImage'].includes(node.class_type)), 'Image workflow must use built-in nodes only.');
const truth = getLocalAiRuntimeTruth();
check(truth.imageGeneration === 'proof-gated-comfyui-loopback', 'Image truth must identify proof-gated ComfyUI execution.');
check(truth.videoModelSelection === 'reviewed-native-workflow-session-confirmation', 'Video workflow selection must require reviewed session confirmation.');
check(truth.videoCertification === 'real-reference-device-and-owner-four-gb-fallback-w625h', 'Video certification must remain real-evidence gated.');
const sources = getLocalAiCspLoopbackSources();
for (const port of [8000, 8188, 8189]) check(sources.includes(`http://127.0.0.1:${port}`), `CSP source for ComfyUI ${port} missing.`);
for (const relative of ['_headers', 'public/_headers']) {
  const headers = read(relative);
  for (const port of [8000, 8188, 8189]) check(headers.includes(`http://127.0.0.1:${port}`), `${relative} missing ComfyUI port ${port}.`);
}
const page = read('assets/js/local-ai/local-ai-page.js');
check(page.includes('renderComfyUiImageLab'), 'Local AI page does not render the image lab.');
check(page.includes('renderComfyUiVideoLab'), 'Local AI page must render the separate proof-gated video lab.');
check(page.includes('Local video has its own capability/workflow/output proof and remains disabled until those checks pass.'), 'Local AI page must keep video certification truth visible.');
const adapter = read('assets/js/local-ai/comfyui-local-media.js');
check(adapter.includes('explicitUserAction !== true'), 'Adapter must require explicit user action.');
check(adapter.includes('/system_stats') && adapter.includes('/object_info/CheckpointLoaderSimple') && adapter.includes('/prompt') && adapter.includes('/history/'), 'Adapter API lifecycle incomplete.');
check(!adapter.includes('fetch("https://') && !adapter.includes("fetch('https://"), 'Adapter must not call cloud endpoints.');

if (failures.length) {
  console.error('[w623a-comfyui-local-image] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, wave: 'W623A-current-aligned-through-W625H', imageAdapter: 'comfyui-loopback', videoSurface: 'separate-proof-gated', videoCertified: false, sourceProofOnly: true, realDeviceProof: 'NOT RUN' }, null, 2));
