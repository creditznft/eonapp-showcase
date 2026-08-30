#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AI_MODEL_COMPATIBILITY_POLICIES,
  AI_MODEL_COMPATIBILITY_POLICY_SCHEMA,
  evaluateAiProviderModelCompatibility
} from '../config/ai-api-contracts.mjs';
import {
  LOCAL_AI_BROWSER_CONTRACT_SCHEMA,
  LOCAL_AI_RUNTIME_CONTRACTS,
  LOCAL_AI_RUNTIME_ROUTE_PATHS,
  getLocalAiCspLoopbackSources,
  getLocalAiRouteContentSecurityPolicy,
  getLocalAiRuntimeTruth
} from '../config/local-ai-browser-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(AI_MODEL_COMPATIBILITY_POLICY_SCHEMA === 'eonapp.w476.ai-model-compatibility-policy.v1', 'Unexpected AI compatibility policy schema.');
check(LOCAL_AI_BROWSER_CONTRACT_SCHEMA === 'eonapp.w623.local-ai-browser-contract.v2', 'Unexpected Local AI browser contract schema.');
check(evaluateAiProviderModelCompatibility('deepseek', 'deepseek-chat').allowed === false, 'DeepSeek legacy chat alias must be blocked.');
check(evaluateAiProviderModelCompatibility('deepseek', 'deepseek-reasoner').allowed === false, 'DeepSeek legacy reasoner alias must be blocked.');
check(evaluateAiProviderModelCompatibility('anthropic', 'claude-opus-4-1-20250805').allowed === false, 'Retired Claude ID must be blocked.');
check(evaluateAiProviderModelCompatibility('together', 'gpt-4o').allowed === false, 'Together must reject unqualified model IDs.');
check(evaluateAiProviderModelCompatibility('together', 'meta-llama/Llama-3.3-70B-Instruct-Turbo').allowed === true, 'Together must accept namespaced model IDs.');
check(AI_MODEL_COMPATIBILITY_POLICIES.groq?.requestFieldPolicy?.maxOutputField === 'max_completion_tokens', 'Groq max output field contract missing.');

for (const id of ['ollama', 'lmstudio', 'jan']) {
  const runtime = LOCAL_AI_RUNTIME_CONTRACTS[id];
  check(Boolean(runtime), `Missing local runtime contract: ${id}`);
  check(runtime?.textChat === 'discover-self-test-select', `${id} must use dynamic discover/self-test/select text flow.`);
  check(runtime?.imageGeneration === 'not-connected' && runtime?.videoGeneration === 'not-connected', `${id} must not claim local image/video execution.`);
}


const comfy = LOCAL_AI_RUNTIME_CONTRACTS.comfyui;
check(comfy?.runtimeKind === 'media', 'ComfyUI media runtime contract missing.');
check(comfy?.textChat === 'not-connected', 'ComfyUI must not be treated as a text chat runtime.');
check(comfy?.imageGeneration === 'discover-self-test-generate', 'ComfyUI image adapter contract missing.');
check(comfy?.videoGeneration === 'capability-and-reviewed-workflow-proof-gated', 'ComfyUI video must remain capability and reviewed-workflow proof-gated.');

const sources = getLocalAiCspLoopbackSources();
check(sources.includes('http://127.0.0.1:11434'), 'Missing Ollama CSP source.');
check(sources.includes('http://127.0.0.1:1234'), 'Missing LM Studio CSP source.');
check(sources.includes('http://127.0.0.1:1337'), 'Missing Jan Desktop CSP source.');
check(sources.includes('http://127.0.0.1:6767'), 'Missing Jan CLI CSP source.');
check(sources.includes('http://127.0.0.1:8188'), 'Missing ComfyUI CSP source.');
check(!sources.some((source) => /192\.168|10\.|172\.(1[6-9]|2\d|3[0-1])/.test(source)), 'CSP must not permit RFC1918/LAN sources.');
const csp = getLocalAiRouteContentSecurityPolicy();
check(!csp.includes('upgrade-insecure-requests'), 'Local AI route CSP must not upgrade approved HTTP loopback requests.');

for (const relative of ['_headers', 'public/_headers']) {
  const headers = read(relative);
  check(headers.includes('# W476_LOCAL_AI_CSP_START') && headers.includes('# W476_LOCAL_AI_CSP_END'), `${relative} missing generated Local AI CSP block.`);
  for (const route of LOCAL_AI_RUNTIME_ROUTE_PATHS) check(headers.includes(`\n${route}\n  ! Content-Security-Policy`), `${relative} missing CSP override for ${route}.`);
  for (const source of sources) check(headers.includes(source), `${relative} missing CSP source ${source}.`);
}

const chatHtml = read('chat.html');
check(!/meta\s+http-equiv=["']Content-Security-Policy/i.test(chatHtml), 'chat.html must not add a second restrictive meta CSP.');
const runtime = read('assets/js/chat/ai-runtime.js');
check(runtime.includes('buildOpenAICompatibleChatPayload'), 'AI runtime missing OpenAI-compatible request builder.');
check(runtime.includes('max_completion_tokens'), 'AI runtime missing Groq request-field compatibility.');
check(runtime.includes('evaluateAiProviderModelCompatibility'), 'AI runtime missing model-ID compatibility gate.');
check(!/functions\s*:|function_call\s*:/.test(runtime), 'AI runtime must not emit legacy function/function_call request fields.');
const localPage = read('assets/js/local-ai/local-ai-page.js');
check(localPage.includes("localRuntimeCardConfig('jan'"), 'Local AI page must surface Jan runtime.');
check(localPage.includes('Local image generation has one narrow ComfyUI adapter'), 'Local AI page must disclose proof-gated image adapter status.');
const truth = getLocalAiRuntimeTruth();
check(truth.imageGeneration === 'proof-gated-comfyui-loopback' && truth.videoModelSelection === 'reviewed-native-workflow-session-confirmation', 'Local media selection truth drifted.');
check(truth.videoCertification === 'real-reference-device-and-owner-four-gb-fallback-w625h', 'Local video certification truth drifted.');

if (failures.length) {
  console.error('[w476-local-ai-provider-compatibility] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  providerCompatibility: ['deepseek', 'anthropic', 'together', 'groq'],
  localRuntimeIds: Object.keys(LOCAL_AI_RUNTIME_CONTRACTS),
  cspSources: sources,
  routeCount: LOCAL_AI_RUNTIME_ROUTE_PATHS.length,
  sourceProofOnly: true,
  browserProductionProof: 'NOT RUN'
}, null, 2));
