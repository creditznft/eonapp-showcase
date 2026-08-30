import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  detectLocalAiPlatformFamily,
  getLocalAiPlatformSupportTruth,
  projectLocalAiPlatformSupport
} from '../../config/local-ai-platform-support-contract.mjs';
import {
  EON_WORKLOAD_KINDS,
  createEonWorkloadGovernor
} from '../../assets/js/runtime/eon-workload-governor.js';
import {
  BROWSER_LOCAL_LITE_WORKER_PATH,
  getBrowserLocalLiteWorkerContentSecurityPolicy
} from '../../config/local-ai-browser-contract.mjs';
import {
  acquireLocalMediaWorkload,
  releaseLocalMediaWorkload
} from '../../assets/js/local-ai/local-media-workload-admission.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function createGovernor() {
  let tick = 1000;
  return createEonWorkloadGovernor({
    environment: {
      navigator: { deviceMemory: 16, hardwareConcurrency: 12, connection: { saveData: false, effectiveType: '4g' } },
      document: { visibilityState: 'visible', addEventListener() {} },
      performance: { now: () => tick }
    },
    now: () => tick,
    wallNow: () => tick++
  });
}

test('RT90 platform truth keeps iPhone, iPadOS and Android on Local Lite while distinguishing Windows and Mac', () => {
  assert.equal(detectLocalAiPlatformFamily({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone' }), 'ios');
  assert.equal(detectLocalAiPlatformFamily({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
  assert.equal(detectLocalAiPlatformFamily({ userAgent: 'Mozilla/5.0 (Linux; Android 15)', platform: 'Linux armv8l', mobile: true }), 'android');
  assert.equal(detectLocalAiPlatformFamily({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32' }), 'windows');
  assert.equal(detectLocalAiPlatformFamily({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)', platform: 'MacIntel', maxTouchPoints: 0 }), 'macos');

  for (const family of ['ios', 'android']) {
    const plan = projectLocalAiPlatformSupport({ family, browserLiteSupported: true });
    assert.equal(plan.mobile, true);
    assert.equal(plan.primaryAction, 'use-browser-lite');
    assert.equal(plan.desktopRuntime.offered, false);
    assert.equal(plan.companion.status, 'not-offered');
    assert.equal(plan.creator.mobileHeavyMediaOffered, false);
    assert.equal(plan.boundaries.silentCloudFallback, false);
  }

  const mac = projectLocalAiPlatformSupport({ family: 'macos', browserLiteSupported: true, companionArtifactVerified: false });
  assert.equal(mac.desktopRuntime.offered, true);
  assert.equal(mac.companion.status, 'not-certified');
  assert.equal(mac.primaryAction, 'use-browser-lite');
  const truth = getLocalAiPlatformSupportTruth();
  assert.equal(truth.macos.certificationIndependentFromWindows, true);
});

test('RT90 Local Lite page controller delegates model inference to a dedicated worker', () => {
  const main = read('assets/js/local-ai/browser-local-lite.js');
  const worker = read('assets/js/local-ai/browser-local-lite-worker.js');
  const contract = read('assets/js/local-ai/browser-local-lite-worker-contract.js');
  assert.match(main, /new globalThis\.Worker\(new URL\('\.\/browser-local-lite-worker\.js', import\.meta\.url\), \{ type: 'module'/);
  assert.match(main, /mainThreadInference:\s*false/);
  assert.match(main, /cancelBrowserLocalLite/);
  assert.match(main, /terminateWorker/);
  assert.match(main, /browser-local-lite-worker-contract\.js/);
  assert.doesNotMatch(main, /browser-local-lite-worker\.js';/);
  assert.doesNotMatch(main, /\.pipeline\(/);
  assert.doesNotMatch(main, /libraryModuleUrl\)/);
  assert.match(worker, /module\.pipeline/);
  assert.doesNotMatch(worker, /^import\s/m, 'the emitted worker must be self-contained');
  assert.match(worker, /libraryModuleUrl:\s*'https:\/\/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@3\.8\.1\/\+esm'/);
  assert.match(worker, /progress_callback/);
  assert.match(worker, /max_new_tokens/);
  assert.match(contract, /totalInputChars:\s*15000/);
  assert.match(contract, /outputTokens:\s*192/);
});

test('RT90 heavy local media requires explicit City preemption and resumes only after its lease releases', async () => {
  const governor = createGovernor();
  const actions = [];
  governor.registerConsumer({ id: 'city-test', workloads: [EON_WORKLOAD_KINDS.CITY_RENDER], onAction: (event) => actions.push(event) });
  const city = governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city', source: 'test-city' });
  assert.equal(city.ok, true);

  let confirmationCalls = 0;
  const cancelled = await acquireLocalMediaWorkload('image', {
    governor,
    confirmPauseCity: async () => { confirmationCalls += 1; return false; }
  });
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.cancelled, true);
  assert.equal(confirmationCalls, 1);
  assert.equal(governor.getSnapshot().activeKinds.includes(EON_WORKLOAD_KINDS.IMAGE_GENERATION), false);
  assert.equal(actions.some((event) => event.action === 'city:pause'), false);

  const admitted = await acquireLocalMediaWorkload('video', {
    governor,
    source: 'test-video',
    confirmPauseCity: async () => true
  });
  assert.equal(admitted.ok, true);
  assert.equal(admitted.cityPauseApproved, true);
  assert.equal(actions.some((event) => event.action === 'city:pause' && event.userConfirmed === true), true);
  const overlapping = await acquireLocalMediaWorkload('image', {
    governor,
    source: 'test-overlap',
    confirmPauseCity: async () => true
  });
  assert.equal(overlapping.ok, false);
  assert.equal(overlapping.error, 'heavy-local-media-already-running');
  assert.equal(releaseLocalMediaWorkload(admitted, 'test-complete'), true);
  assert.equal(actions.some((event) => event.action === 'city:resume' && event.workloadReleased === true), true);
  city.lease.release('test-end');
});

test('RT90 Image, Video and City source all honor universal workload ownership', () => {
  const image = read('assets/js/local-ai/comfyui-image-lab.js');
  const video = read('assets/js/local-ai/comfyui-video-lab.js');
  const city = read('assets/js/eon-city-play-station.js');
  const governor = read('assets/js/runtime/eon-workload-governor.js');
  assert.match(image, /acquireLocalMediaWorkload\('image'/);
  assert.match(video, /acquireLocalMediaWorkload\('video'/);
  assert.match(image, /finally\s*\{[\s\S]*?releaseLocalMediaWorkload\(admission/);
  assert.match(video, /finally\s*\{[\s\S]*?releaseLocalMediaWorkload\(admission/);
  assert.match(governor, /preemptedCity:\s*decision\.preemptCityConfirmed === true/);
  assert.match(governor, /sendAction\('city:resume'/);
  assert.match(city, /eonCityManualPause/);
  assert.match(city, /action\.action === 'city:resume'/);
  assert.match(city, /eonCityWorkloadPause === 'active'/);
});

test('RT90 EON City EONBOT readiness uses canonical proof authority rather than saved provider configuration', () => {
  const city = read('assets/js/city/eon-city-eonbot-quick-work.js');
  assert.match(city, /resolveEonbotCapabilityMode/);
  assert.match(city, /capabilityMode\.activeId !== 'guide'/);
  assert.match(city, /Make Local AI ready/);
  assert.match(city, /verified/);
  assert.doesNotMatch(city, /String\(settings\?\.provider \|\| 'guide'\) !== 'guide'/);
  assert.doesNotMatch(city, /Real AI ready/);
});

test('RT90 Help, Guide, knowledge and capability copy describe one novice Local AI path without silent cloud fallback', () => {
  const help = read('help.html');
  const guide = read('assets/js/chat/guide-mode-playbooks.js');
  const knowledge = read('config/eonapp-ai-knowledge-base.mjs');
  const capability = read('assets/js/utils/local-ai-capability-matrix.js');
  const install = read('assets/js/install-page.js');
  const release = read('config/eon-local-companion-release-contract.mjs');

  assert.match(help, /Make Local AI ready/);
  assert.match(help, /Local Lite/);
  assert.match(guide, /Make Local AI ready/);
  assert.match(guide, /iPhone, iPad and Android/);
  assert.match(guide, /Windows or macOS/);
  assert.match(knowledge, /EON Local Lite/);
  assert.match(knowledge, /never silently falls back to a hosted provider/);
  assert.doesNotMatch(knowledge, /Local text requires a user-installed Ollama, LM Studio or Jan runtime/);
  assert.doesNotMatch(capability, /cloud fallback|cloud-assisted/i);
  assert.match(install, /maxTouchPoints/);
  assert.match(install, /macos-x64/);
  assert.match(release, /'macos-x64': EMPTY_ARTIFACT/);
});

test('RT90 active product surfaces converge on Make Local AI ready and platform-safe truth', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const contextRegistry = read('assets/js/chat/eonbot-context-registry.js');
  const support = read('assets/js/utils/support-tools-footer-proof.js');
  const productivity = read('assets/js/work-surface/adapters/eon-productivity-panel.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const device = read('assets/js/device/eon-device-check.js');
  const commandRoom = read('assets/js/city/eon-city-command-room.js');
  const commandHub = read('assets/js/chat/eonbot-command-hub.js');
  const chat = read('assets/js/chat-page.js');
  const installHtml = read('install.html');
  const profile = read('profile.html');
  const profilePage = read('assets/js/profile-page.js');
  const cityFirstRun = read('assets/js/city/eon-city-first-run.js');
  const createCatalog = read('assets/js/create/eon-create-catalog.js');
  const chatbot = read('assets/js/chat/chatbot.js');
  const intents = read('assets/js/chat/intents.js');
  const truthContract = read('assets/js/chat/eonbot-truth-contract.js');
  const blog = read('blog/how-to-set-up-local-ai-ollama.html');

  for (const source of [shell, contextRegistry, support, productivity, workspace, device, commandRoom, commandHub, chat, profile, cityFirstRun, createCatalog, chatbot, intents, truthContract, blog]) {
    assert.match(source, /Make Local AI ready/);
  }
  assert.match(shell, /Local Lite/);
  assert.match(contextRegistry, /Local Lite/);
  assert.match(support, /proof-based Local Lite or desktop-runtime readiness/);
  assert.match(productivity, /Local Lite on a compatible browser/);
  assert.match(workspace, /Local Lite or a verified desktop runtime/);
  assert.match(device, /iPhone Safari/);
  assert.match(device, /Mac Safari \/ Apple Silicon/);
  assert.match(device, /desktop runtimes and Companion installers are not offered on phones or tablets/);
  assert.match(commandRoom, /proof-based Guide\/Local\/Connected authority/);
  assert.match(commandHub, /Local Lite/);
  assert.match(chat, /EON did not switch routes automatically/);
  assert.match(chat, /Connected provider remains a separate explicit Vault choice/);
  assert.match(installHtml, /Phones, tablets and basic computers can use Local Lite/);
  assert.match(installHtml, /Windows or macOS/);
  assert.match(profile, /Make Local AI ready/);
  assert.match(profilePage, /make Local AI ready/i);
  assert.match(profilePage, /never switch to a hosted provider automatically/);
  assert.match(cityFirstRun, /\/local-ai#eonbot-local-ai-setup/);
  assert.match(createCatalog, /Make Local AI ready/);
  assert.match(chatbot, /Make Local AI ready/);
  assert.match(intents, /Make Local AI ready/);
  assert.match(truthContract, /Make Local AI ready/);
  assert.match(blog, /iPhone, iPad or Android/);
  assert.match(blog, /Windows and macOS/);
  assert.doesNotMatch(blog, /Discover Local Models|Get Free AI Power|WorkBench auto-checks/);
});

test('RT90 Install determines Local Lite support from the real browser capability rather than hardcoding it', () => {
  const install = read('assets/js/install-page.js');
  assert.match(install, /getBrowserLocalLiteCapability/);
  assert.match(install, /browserLiteSupported:\s*liteCapability\.supported === true/);
  assert.doesNotMatch(install, /browserLiteSupported:\s*true/);
  assert.match(install, /maxTouchPoints/);
});

test('RT90 Local Lite worker receives its own least-privilege WASM CSP and canonical headers stay synchronized', () => {
  const policy = getBrowserLocalLiteWorkerContentSecurityPolicy();
  const headers = read('_headers');
  const publicHeaders = read('public/_headers');
  assert.equal(BROWSER_LOCAL_LITE_WORKER_PATH, '/assets/js/local-ai/browser-local-lite-worker.js');
  assert.match(policy, /default-src 'none'/);
  assert.match(policy, /script-src[^;]*'wasm-unsafe-eval'[^;]*https:\/\/cdn\.jsdelivr\.net/);
  assert.match(policy, /connect-src 'self' https:/);
  assert.doesNotMatch(policy, /127\.0\.0\.1|localhost|(?:^|[\s;])'unsafe-eval'(?:[\s;]|$)/);
  assert.equal(headers, publicHeaders);
  assert.match(headers, /\/assets\/js\/local-ai\/browser-local-lite-worker\.js[\s\S]*?default-src 'none'[\s\S]*?'wasm-unsafe-eval'/);
});
