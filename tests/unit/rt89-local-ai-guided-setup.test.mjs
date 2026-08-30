import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildLocalAiSetupGuide } from '../../config/local-ai-setup-guide-contract.mjs';
import { buildLocalAiGuidedSetupProgress, getLocalAiGuidedSetupTruth } from '../../assets/js/local-ai/local-ai-guided-setup-progress.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const guide = buildLocalAiSetupGuide({ computeClass: 'cpu-local', platformFamily: 'windows', memoryGB: 16, cpuCores: 8 }, { goalId: 'private-chat' });

test('RT90 advanced guided Local AI setup remains explicit while consumer setup can automate bounded checks', () => {
  const start = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio' });
  assert.equal(start.phase, 'check-runtime');
  assert.equal(start.action, 'check-runtime');

  const unreachable = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', discovery: { ok: false }, bridgeChecked: true, bridgeAvailable: true, bridgePaired: false });
  assert.equal(unreachable.phase, 'pair-bridge');
  assert.equal(unreachable.action, 'focus-bridge');

  const empty = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', discovery: { ok: true, models: [] } });
  assert.equal(empty.phase, 'install-model');

  const found = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', discovery: { ok: true, models: [{ model: 'qwen3' }] } });
  assert.equal(found.phase, 'choose-model');
  assert.equal(found.action, 'choose-model');
  const selected = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', discovery: { ok: true, models: [{ model: 'qwen3' }] }, selectedModel: 'qwen3' });
  assert.equal(selected.phase, 'self-test');
  assert.equal(selected.action, 'self-test');

  const proof = { ok: true, runtimeId: 'lmstudio', model: 'qwen3', endpoint: 'http://127.0.0.1:1234' };
  const verified = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', proof });
  assert.equal(verified.phase, 'select-chat');
  assert.equal(verified.action, 'select-chat');
  const complete = buildLocalAiGuidedSetupProgress({ guide, runtimeId: 'lmstudio', proof, chatSettings: { provider: 'lmstudio', model: 'qwen3', endpoint: 'http://127.0.0.1:1234/v1' } });
  assert.equal(complete.phase, 'complete');
  assert.equal(complete.complete, true);
});

test('RT90 consumer setup automates only bounded checks while installs, downloads, pairing and cloud fallback remain explicit', () => {
  const truth = getLocalAiGuidedSetupTruth();
  assert.equal(truth.explicitConsumerSetupIntentRequired, true);
  assert.equal(truth.boundedApprovedProbeAfterConsumerSetupIntent, true);
  assert.equal(truth.boundedSelfTestAfterConsumerSetupIntent, true);
  assert.equal(truth.automaticProviderSelectionAfterPassingSelfTest, true);
  assert.equal(truth.automaticInstall, false);
  assert.equal(truth.automaticDownload, false);
  assert.equal(truth.automaticBridgePairing, false);
  assert.equal(truth.cloudFallback, false);
  const page = read('assets/js/local-ai/local-ai-page.js');
  const renderer = read('assets/js/local-ai/local-ai-setup-guide.js');
  assert.match(page, /data-local-guide-next/);
  assert.match(page, /data-local-consumer-setup/);
  assert.match(page, /Advanced Local AI diagnostics/);
  assert.match(page, /discoverLocalRuntimeModels\(values\)/);
  assert.match(page, /buildLocalAiSetupGuide\(profile/);
  assert.doesNotMatch(page, /dataset\.localGuideNextRuntime \|\| state\.setupRuntimeId \|\| 'lmstudio'/);
  assert.match(page, /bridge-unreachable/);
  assert.match(page, /runLocalAiConsumerSetup/);
  assert.match(renderer, /Next step/);
  assert.match(renderer, /data-local-guide-next/);
});

test('RT90 mobile guidance prefers genuine browser Local Lite and never recommends desktop installation as the primary action', () => {
  const mobileGuide = buildLocalAiSetupGuide({ computeClass: 'mobile', platformFamily: 'android-mobile', memoryGB: 8 }, { goalId: 'private-chat' });
  const progress = buildLocalAiGuidedSetupProgress({ guide: mobileGuide });
  assert.equal(progress.phase, 'browser-lite');
  assert.equal(progress.runtimeId, 'browserlocal');
  assert.equal(progress.action, 'consumer-setup');
  assert.equal(progress.automaticInstall, false);
});
