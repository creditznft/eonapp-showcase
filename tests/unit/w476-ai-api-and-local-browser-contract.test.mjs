import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  evaluateAiProviderModelCompatibility
} from '../../config/ai-api-contracts.mjs';
import {
  getLocalAiCspLoopbackSources,
  getLocalAiRuntimeTruth,
  isApprovedLocalAiLoopbackEndpoint,
  normalizeApprovedLocalAiEndpoint
} from '../../config/local-ai-browser-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W476-A5 provider model policy blocks retired and structurally invalid IDs', () => {
  const deepseekChat = evaluateAiProviderModelCompatibility('deepseek', 'deepseek-chat');
  assert.equal(deepseekChat.allowed, false);
  assert.equal(deepseekChat.reason, 'retired-or-deprecated-model-id');
  assert.match(deepseekChat.replacement, /deepseek-v4-flash/i);

  assert.equal(evaluateAiProviderModelCompatibility('deepseek', 'deepseek-v4-flash').allowed, true);
  assert.equal(evaluateAiProviderModelCompatibility('anthropic', 'claude-opus-4-1-20250805').allowed, false);
  assert.equal(evaluateAiProviderModelCompatibility('together', 'gpt-4o').allowed, false);
  assert.equal(evaluateAiProviderModelCompatibility('together', 'meta-llama/Llama-3.3-70B-Instruct-Turbo').allowed, true);
});

test('W476-A5 local loopback contract permits only known runtime ports', () => {
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://127.0.0.1:11434', 'ollama'), true);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://localhost:1234/v1', 'lmstudio'), true);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://127.0.0.1:1337/v1', 'jan'), true);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://127.0.0.1:6767/v1', 'jan'), true);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://127.0.0.1:11434', 'jan'), false);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('http://192.168.1.8:11434', 'ollama'), false);
  assert.equal(isApprovedLocalAiLoopbackEndpoint('https://127.0.0.1:11434', 'ollama'), false);
  assert.equal(normalizeApprovedLocalAiEndpoint('http://192.168.1.8:11434', 'ollama'), 'http://127.0.0.1:11434');
});

test('W476-A5 local media status remains truthful and CSP is generated from the runtime contract', () => {
  const truth = getLocalAiRuntimeTruth();
  assert.equal(truth.textModelDiscovery, 'user-triggered-installed-model-list');
  assert.equal(truth.imageModelSelection, 'user-triggered-installed-checkpoint-list');
  assert.equal(truth.imageGeneration, 'proof-gated-comfyui-loopback');
  assert.equal(truth.videoModelSelection, 'reviewed-native-workflow-session-confirmation');
  assert.equal(truth.videoCapabilityDetection, 'supported-experimental-unsupported-w625d');
  assert.equal(truth.videoOutputProof, 'digest-matched-save-reopen-playback-w625e');
  assert.equal(truth.videoCertification, 'real-reference-device-and-owner-four-gb-fallback-w625h');
  assert.equal(truth.cloudFallbackWithoutNewUserChoice, false);
  const sources = getLocalAiCspLoopbackSources();
  for (const expected of ['http://127.0.0.1:11434', 'http://127.0.0.1:1234', 'http://127.0.0.1:1337', 'http://127.0.0.1:6767', 'http://127.0.0.1:8188']) assert.ok(sources.includes(expected));
  assert.equal(sources.some((source) => source.includes('192.168.')), false);
});

test('W476-A5 source wiring uses the policy builder, surfaces Jan, and avoids a second chat CSP', () => {
  const aiRuntime = read('assets/js/chat/ai-runtime.js');
  assert.match(aiRuntime, /buildOpenAICompatibleChatPayload/);
  assert.match(aiRuntime, /max_completion_tokens/);
  assert.match(aiRuntime, /evaluateAiProviderModelCompatibility/);
  assert.doesNotMatch(aiRuntime, /functions\s*:/);
  assert.doesNotMatch(aiRuntime, /function_call\s*:/);

  const localPage = read('assets/js/local-ai/local-ai-page.js');
  assert.match(localPage, /localRuntimeCardConfig\('jan'/);
  assert.match(localPage, /Local image generation uses the bounded ComfyUI adapter/);
  assert.match(localPage, /Local video has its own capability\/workflow\/output proof/);
  assert.match(localPage, /Advanced Local AI diagnostics/);
  assert.match(localPage, /EON Local Companion/);
  assert.doesNotMatch(read('chat.html'), /meta\s+http-equiv=["']Content-Security-Policy/i);
  for (const file of ['_headers', 'public/_headers']) {
    const headers = read(file);
    assert.match(headers, /W476_LOCAL_AI_CSP_START/);
    assert.match(headers, /http:\/\/127\.0\.0\.1:11434/);
    assert.match(headers, /http:\/\/127\.0\.0\.1:6767/);
    assert.match(headers, /http:\/\/127\.0\.0\.1:8188/);
  }
});
