import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  LOCAL_AI_LITE_PACK,
  LOCAL_AI_LITE_TIERS,
  buildLocalAiConsumerPlan,
  getLocalAiConsumerExperienceTruth,
  recommendLocalLiteTier,
  validateLocalAiConsumerExperienceContract
} from '../../config/local-ai-consumer-experience-contract.mjs';
import {
  getEonLocalCompanionDistributionTruth,
  validateEonLocalCompanionDistributionContract
} from '../../config/eon-local-companion-distribution-contract.mjs';
import {
  getVerifiedEonLocalCompanionArtifact,
  validateEonLocalCompanionReleaseContract
} from '../../config/eon-local-companion-release-contract.mjs';
import {
  getBrowserLocalLiteCapability,
  prepareBrowserLocalLite
} from '../../assets/js/local-ai/browser-local-lite.js';
import { EON_LOCAL_LITE_WORKER_PACK } from '../../assets/js/local-ai/browser-local-lite-worker-contract.js';
import { rankInstalledLocalTextModels } from '../../assets/js/local-ai/local-ai-consumer-setup.js';
import { getLocalAiRouteContentSecurityPolicy } from '../../config/local-ai-browser-contract.mjs';
import { getCreatorCompanionRouteContentSecurityPolicy } from '../../config/eon-creator-companion-browser-contract.mjs';
import { LOCAL_PROVIDER_IDS, PROVIDERS } from '../../assets/js/chat/ai-provider-catalog.js';
import {
  startEonLocalCompanionRuntime,
  validateEonLocalCompanionRuntimeManager
} from '../../tools/eon-local-bridge/runtime-manager.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT90 consumer contract validates and stays fail-closed', () => {
  assert.deepEqual(validateLocalAiConsumerExperienceContract(), []);
  const truth = getLocalAiConsumerExperienceTruth();
  assert.equal(truth.onePrimarySetupAction, true);
  assert.equal(truth.browserLocalLite, true);
  assert.equal(truth.desktopCompanion, true);
  assert.equal(truth.automaticDetectionAfterExplicitSetupTap, true);
  assert.equal(truth.automaticSelfTestAfterExplicitSetupTap, true);
  assert.equal(truth.automaticProviderSelectionAfterPassingProof, true);
  assert.equal(truth.silentInstall, false);
  assert.equal(truth.silentDownload, false);
  assert.equal(truth.silentCloudFallback, false);
});

test('RT90 mobile plan prefers genuine Local Lite but never implies heavy Creator readiness', () => {
  const plan = buildLocalAiConsumerPlan(
    { computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 4, hasWebGPU: true },
    { browserLiteSupported: true }
  );
  assert.equal(plan.primaryPath.id, 'browser-lite');
  assert.equal(plan.capabilities.chat.path, 'browser-lite');
  assert.equal(plan.capabilities.image.state, 'not-on-this-device');
  assert.equal(plan.capabilities.video.state, 'not-on-this-device');
  assert.equal(plan.boundaries.silentThirdPartyInstall, false);
  assert.equal(plan.boundaries.silentModelDownload, false);
  assert.equal(plan.boundaries.silentCloudFallback, false);
});

test('RT90 verified desktop runtime wins over downloading Local Lite', () => {
  const plan = buildLocalAiConsumerPlan(
    { computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16 },
    { browserLiteSupported: true, verifiedRuntime: { ok: true, runtimeId: 'lmstudio', runtime: 'LM Studio' } }
  );
  assert.equal(plan.primaryPath.id, 'desktop-runtime');
  assert.equal(plan.capabilities.chat.state, 'ready');
  assert.equal(plan.capabilities.chat.path, 'desktop-runtime');
});

test('RT90 model ranking excludes embeddings and models that conservatively do not fit', () => {
  const gib = 1024 ** 3;
  const ranked = rankInstalledLocalTextModels([
    { model: 'qwen2.5-0.5b-instruct', sizeBytes: 0.55 * gib, localOnly: true },
    { model: 'qwen3:4b-gpu', sizeBytes: 3.8 * gib, localOnly: true },
    { model: 'nomic-embed-text', sizeBytes: 0.3 * gib, localOnly: true }
  ], { computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 4 }, 'ollama');
  assert.ok(ranked.some((row) => row.model === 'qwen2.5-0.5b-instruct'));
  assert.ok(!ranked.some((row) => row.model === 'qwen3:4b-gpu'));
  assert.ok(!ranked.some((row) => /embed/i.test(row.model)));
});

test('RT90 Local Lite supports WebGPU first and WASM fallback without a desktop runtime', () => {
  const webgpu = getBrowserLocalLiteCapability({ navigator: { gpu: {} }, hasWebGPU: true, hasWebAssembly: true, secureContext: true });
  assert.equal(webgpu.supported, true);
  assert.equal(webgpu.preferredBackend, 'webgpu');
  const wasm = getBrowserLocalLiteCapability({ navigator: {}, hasWebGPU: false, hasWebAssembly: true, secureContext: true });
  assert.equal(wasm.supported, true);
  assert.equal(wasm.preferredBackend, 'wasm');
  assert.equal(LOCAL_AI_LITE_PACK.inferenceLeavesDevice, false);
  assert.equal(LOCAL_AI_LITE_PACK.firstUseDownloadRequired, true);
  assert.match(LOCAL_AI_LITE_PACK.libraryModuleUrl, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@3\.8\.1\/\+esm$/);
  assert.deepEqual(EON_LOCAL_LITE_WORKER_PACK, {
    task: LOCAL_AI_LITE_PACK.task,
    model: LOCAL_AI_LITE_PACK.model,
    libraryModuleUrl: LOCAL_AI_LITE_PACK.libraryModuleUrl,
    preferredWebGpuDtype: LOCAL_AI_LITE_PACK.preferredWebGpuDtype,
    wasmDtype: LOCAL_AI_LITE_PACK.wasmDtype
  });
});

test('RT94 adaptive Local Lite keeps Auto conservative until a larger local tier proved itself', () => {
  const capable = { hasWebGPU: true, deviceMemory: 8, hardwareConcurrency: 8 };
  assert.equal(recommendLocalLiteTier(capable, 'auto').tier, 'lite');
  assert.equal(recommendLocalLiteTier({ ...capable, knownGoodBalanced: true }, 'auto').tier, 'balanced');
  assert.equal(recommendLocalLiteTier(capable, 'balanced').tier, 'balanced');
  assert.equal(recommendLocalLiteTier(capable, 'strong').tier, 'lite');
  assert.equal(LOCAL_AI_LITE_TIERS.balanced.model, 'onnx-community/SmolLM2-360M-ONNX');
  assert.ok(LOCAL_AI_LITE_TIERS.balanced.webgpuMb >= 272);
});

test('RT94 adaptive Local Lite retains explicit consent and local-only worker routing', () => {
  const main = read('assets/js/local-ai/browser-local-lite.js');
  const worker = read('assets/js/local-ai/browser-local-lite-worker.js');
  assert.match(main, /userApprovedDownload = false/);
  assert.match(main, /tier: selectedTier/);
  assert.match(worker, /balanced: Object\.freeze/);
  assert.match(worker, /historyMessages: 2/);
  assert.match(worker, /historyMessages: 4/);
  assert.doesNotMatch(main, /vexrail|openrouter|apiKey|cloud fallback/i);
  assert.doesNotMatch(worker, /fetch\(|XMLHttpRequest|WebSocket|vexrail|openrouter/i);
});

test('RT90 Local Lite refuses first model download without explicit approval', async () => {
  const priorStorage = globalThis.localStorage;
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key)
  };
  try {
    const result = await prepareBrowserLocalLite({ userApprovedDownload: false });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'download-approval-required');
    assert.ok(Number(result.approximateWeightMb) > 0);
  } finally {
    if (typeof priorStorage === 'undefined') delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  }
});

test('RT90 provider catalog exposes browser Local Lite as a local provider', () => {
  assert.equal(LOCAL_PROVIDER_IDS.has('browserlocal'), true);
  assert.equal(PROVIDERS.browserlocal.kind, 'browser-local');
  assert.equal(PROVIDERS.browserlocal.requiresApiKey, false);
  assert.equal(PROVIDERS.browserlocal.supportsEndpoint, false);
});

test('RT90 Companion runtime manager is fixed-allowlist only', async () => {
  assert.deepEqual(validateEonLocalCompanionRuntimeManager(), []);
  const rejected = await startEonLocalCompanionRuntime('powershell --evil');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error, 'runtime-not-allowlisted');
  const source = read('tools/eon-local-bridge/runtime-manager.mjs');
  assert.match(source, /shell:\s*false/);
  assert.match(source, /fixed executable and\s+ \* fixed arguments/);
  assert.doesNotMatch(source, /payload\?\.command|payload\?\.args|payload\?\.cwd|payload\?\.executable/);
});

test('RT90 consumer page hides technical controls under Advanced', () => {
  const page = read('assets/js/local-ai/local-ai-page.js');
  assert.match(page, /Use Local AI without the technical setup/);
  assert.match(page, /data-local-consumer-start/);
  assert.match(page, /Advanced Local AI diagnostics/);
  assert.match(page, /EON Local Companion/);
  assert.match(page, /Images/);
  assert.match(page, /Video/);
});

test('RT90 Creator gives image and video independent novice-safe setup actions', () => {
  const image = read('assets/js/local-ai/comfyui-image-lab.js');
  const video = read('assets/js/local-ai/comfyui-video-lab.js');
  assert.match(image, /Set up local images/);
  assert.match(image, /Advanced image connection/);
  assert.match(image, /startEonLocalCompanionRuntime\('comfyui'\)/);
  assert.match(image, /Download image starter/);
  assert.match(image, /pairEonLocalCompanionWithApproval/);
  assert.match(image, /no port or CORS editing is needed/i);
  assert.match(image, /data-comfy-acquire/);
  assert.match(image, /Install ComfyUI from the official installer, then return here\. EON will check local images automatically\./);
  const imageTransport = read('assets/js/local-ai/comfyui-local-media.js');
  const videoTransport = read('assets/js/local-ai/comfyui-video-runtime.js');
  assert.match(imageTransport, /fetchLocalAiWithBridgeFallback/);
  assert.match(videoTransport, /fetchLocalAiWithBridgeFallback/);
  assert.doesNotMatch(imageTransport, /enable the documented exact-origin setting/i);
  assert.match(video, /Check local video/);
  assert.match(video, /Advanced video connection/);
  assert.match(video, /startEonLocalCompanionRuntime\('comfyui'\)/);
  assert.match(video, /working chat or image setup never unlocks video by implication/i);
});



test('RT90 beginner guide has one primary setup action and keeps manual installers in fallback details', () => {
  const guide = read('assets/js/local-ai/local-ai-setup-guide.js');
  assert.match(guide, /data-local-consumer-start>Make Local AI ready/);
  assert.match(guide, /Manual fallback if EON says an AI app is missing/);
  assert.match(guide, /one local approval instead of asking you for ports, CORS or a pairing code/i);
  const primaryIndex = guide.indexOf('data-local-consumer-start');
  const fallbackIndex = guide.indexOf('Manual fallback if EON says an AI app is missing');
  const installerIndex = guide.indexOf('Open official installer');
  assert.ok(primaryIndex >= 0 && fallbackIndex > primaryIndex && installerIndex >= 0);
  assert.match(guide, /data-local-runtime-acquire/);
  const page = read('assets/js/local-ai/local-ai-page.js');
  assert.match(page, /Install the official local AI app, then return here\. EON will check it automatically\./);
  assert.match(page, /addEventListener\?\.\('focus', resume, \{ once: true \}\)/);
});

test('RT90 Local Lite CSP permits WebAssembly compilation only on Local AI capable routes', () => {
  const local = getLocalAiRouteContentSecurityPolicy();
  const creator = getCreatorCompanionRouteContentSecurityPolicy();
  assert.match(local, /script-src[^;]*'wasm-unsafe-eval'/);
  assert.match(creator, /script-src[^;]*'wasm-unsafe-eval'/);
  assert.doesNotMatch(local, /(?:^|\s)'unsafe-eval'(?:\s|;)/);
  assert.doesNotMatch(creator, /(?:^|\s)'unsafe-eval'(?:\s|;)/);
  const headers = read('_headers');
  assert.match(headers, /\/local-ai[\s\S]*?'wasm-unsafe-eval'/);
  assert.match(headers, /\/create[\s\S]*?'wasm-unsafe-eval'/);
});

test('RT90 normal Companion pairing is click-to-approve while numeric codes stay Advanced-only', () => {
  const server = read('tools/eon-local-bridge/server.mjs');
  const client = read('assets/js/local-ai/eon-local-bridge-client.js');
  const page = read('assets/js/local-ai/local-ai-page.js');
  assert.match(server, /\/v1\/pair\/request/);
  assert.match(server, /\/v1\/pair\/status/);
  assert.match(server, /\/pair\/approve/);
  assert.match(server, /localApprovalPostAllowed/);
  assert.match(client, /pairEonLocalCompanionWithApproval/);
  assert.match(page, /Connect Local Companion/);
  assert.match(page, /data-local-consumer-connect-companion/);
  assert.match(page, /Advanced · Local Connection Authority/);
  assert.match(page, /One-time code/);
});

test('RT90 trusted-browser reconnect uses IndexedDB + a non-extractable signing key, never a persistent bearer token', () => {
  const trusted = read('assets/js/local-ai/local-companion-trusted-browser.js');
  const client = read('assets/js/local-ai/eon-local-bridge-client.js');
  const server = read('tools/eon-local-bridge/server.mjs');
  assert.match(trusted, /indexedDB/);
  assert.match(trusted, /importKey\('jwk',[\s\S]*?false, \['sign'\]\)/);
  assert.doesNotMatch(trusted, /localStorage/);
  assert.match(client, /resumeEonLocalCompanionTrustedSession/);
  assert.match(client, /\/v1\/trust\/challenge/);
  assert.match(client, /\/v1\/trust\/verify/);
  assert.match(server, /createEonLocalCompanionTrustedBrowserManager/);
  assert.match(server, /\/v1\/trust\/revoke/);
});

test('RT90 native Companion packaging source is implemented but cannot be mistaken for a signed consumer release', () => {
  assert.deepEqual(validateEonLocalCompanionDistributionContract(), []);
  assert.deepEqual(validateEonLocalCompanionReleaseContract(), []);
  const truth = getEonLocalCompanionDistributionTruth();
  assert.equal(truth.secureTransportCoreImplemented, true);
  assert.equal(truth.fixedRuntimeStartManagerImplemented, true);
  assert.equal(truth.reviewedModelPackManagerImplemented, true);
  assert.equal(truth.codeFreePairingSourceImplemented, true);
  assert.equal(truth.nativeBuildRecipeImplemented, true);
  assert.equal(truth.consumerNativePackageReady, false);
  assert.equal(truth.verifiedReleaseArtifactCount, 0);
  assert.equal(truth.signedNativeInstaller, false);
  assert.equal(truth.nativePairingApprovalWithoutCodeCopy, false);
  assert.equal(truth.developerNodeLauncherIsConsumerReady, false);
  assert.equal(getVerifiedEonLocalCompanionArtifact('windows-x64'), null);
});

test('RT90 Companion standalone build recipe produces a Node22 CommonJS SEA input without pretending signing is complete', () => {
  const buildScript = read('scripts/build-eon-local-companion-bundle.mjs');
  const viteConfig = read('tools/eon-local-companion/vite.config.mjs');
  const release = read('config/eon-local-companion-release-contract.mjs');
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['build:local-companion:bundle'], 'node scripts/build-eon-local-companion-bundle.mjs');
  assert.match(viteConfig, /target:\s*'node22'/);
  assert.match(viteConfig, /formats:\s*\['cjs'\]/);
  assert.match(viteConfig, /inlineDynamicImports:\s*true/);
  assert.match(buildScript, /sea-config\.json/);
  assert.match(buildScript, /commonjs-single-entry/);
  assert.match(buildScript, /signedInstaller:\s*false/);
  assert.match(buildScript, /deviceProof:\s*false/);
  assert.match(release, /signed:\s*false/);
  assert.match(release, /deviceCertified:\s*false/);
  assert.doesNotMatch(buildScript, /signtool\s+sign|codesign\s+--sign/);
});

test('RT90 install page separates the PWA from the Local Companion and fail-closes unavailable native downloads', () => {
  const html = read('install.html');
  const js = read('assets/js/install-page.js');
  assert.match(html, /One small helper for stronger Local AI/);
  assert.match(html, /data-eon-companion-download/);
  assert.match(html, /Companion installer is being certified/);
  assert.match(html, /phones, tablets and basic computers can use Local Lite/i);
  assert.match(js, /getVerifiedEonLocalCompanionArtifact/);
  assert.match(js, /EON will not offer a developer launcher as a substitute/);
  assert.match(js, /platformKey === 'mobile'/);
  assert.doesNotMatch(html, /start-eon-local-bridge\.cmd|Node\.js 22|127\.0\.0\.1:17565/);
});
