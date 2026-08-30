import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  getEonCityRt91ContinuityTruth,
  validateEonCityRt91ContinuityTruth,
  EON_CITY_RT91_CRITICAL_RECOVERY_KEYS,
  EON_CITY_RT91_REBUILDABLE_KEYS
} from '../../assets/js/city/rt91/eon-city-rt91-continuity-contract.js';
import {
  buildEonCityRt91AiGuidanceEnvelope,
  validateEonCityRt91AiGuidanceEnvelope
} from '../../assets/js/city/rt91/eon-city-rt91-ai-guidance-contract.js';
import {
  createEonCityRt91ProductiveReceiptAdapter,
  getEonCityRt91ProductiveReceiptGuidance
} from '../../assets/js/city/rt91/eon-city-rt91-productive-receipt-adapter.js';
import {
  EON_WORKLOAD_KINDS,
  createEonWorkloadGovernor
} from '../../assets/js/runtime/eon-workload-governor.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(String(key)) ?? null, setItem: (key, value) => map.set(String(key), String(value)), removeItem: (key) => map.delete(String(key)) };
}

function governor() {
  let tick = 1000;
  return createEonWorkloadGovernor({
    environment: { navigator: { deviceMemory: 8, hardwareConcurrency: 8, connection: { saveData: false, effectiveType: '4g' } }, document: { visibilityState: 'visible', addEventListener() {} }, performance: { now: () => tick } },
    now: () => tick,
    wallNow: () => tick++
  });
}

test('RT91 continuity makes all critical EONCITY progress update-safe and recoverable while excluding rebuildable diagnostics', () => {
  const truth = getEonCityRt91ContinuityTruth();
  const result = validateEonCityRt91ContinuityTruth(truth);
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(EON_CITY_RT91_CRITICAL_RECOVERY_KEYS.length, 16);
  assert.equal(truth.allCriticalUpdateSafe, true);
  assert.equal(truth.allCriticalRecoverable, true);
  assert.equal(truth.allPreferencesUpdateSafe, true);
  assert.equal(truth.serviceWorkerCacheIsProgressAuthority, false);
  assert.equal(truth.assetCacheIsProgressAuthority, false);
  assert.equal(EON_CITY_RT91_REBUILDABLE_KEYS.includes('eon:city:boot-trace:w737:v1'), true);
});

test('RT91 productive objectives explain the exact missing native action instead of asking for a pasted receipt', () => {
  const adapter = createEonCityRt91ProductiveReceiptAdapter({ storage: memoryStorage() });
  const localAi = adapter.resolve('local-ai-ready-verified');
  assert.equal(localAi.ok, false);
  assert.match(localAi.nextAction, /Make Local AI ready/);
  assert.match(localAi.nextAction, /self-test/);
  const capture = adapter.resolve('creator-capture-reviewed');
  assert.match(capture.nextAction, /Creator Capture/);
  assert.equal(getEonCityRt91ProductiveReceiptGuidance('agent-handoff-reviewed').includes('Agent Theatre'), true);
});

test('RT91 optional EONBOT guidance exposes public mission identity only and never physical coordinates/private work', () => {
  const envelope = buildEonCityRt91AiGuidanceEnvelope({
    worldRegionId: 'storm-sector',
    worldLabel: 'Storm Sector',
    missionId: 'storm-act-1-enter',
    objectiveId: 'grounding-node',
    nextAction: 'Reach the grounding node.',
    target: { x: 99, y: 1, z: -44 },
    position: { x: 9, z: 4 },
    prompt: 'private work',
    fileContent: 'private file'
  });
  assert.equal(validateEonCityRt91AiGuidanceEnvelope(envelope).ok, true);
  for (const key of ['target', 'position', 'prompt', 'fileContent', 'credential', 'apiKey', 'output']) assert.equal(Object.hasOwn(envelope, key), false);
  assert.equal(envelope.localAiRequired, false);
  assert.equal(envelope.localAiOptional, true);
  assert.equal(envelope.deterministicGameplayAuthority, true);
});

test('RT91 retains universal workload ownership: heavy local media cannot overlap City silently or overlap another heavy job', () => {
  const g = governor();
  const actions = [];
  g.registerConsumer({ id: 'city', workloads: [EON_WORKLOAD_KINDS.CITY_RENDER], onAction: (action) => actions.push(action) });
  const city = g.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city-render', source: 'eon-city' });
  assert.equal(city.ok, true);

  const unconfirmed = g.acquire(EON_WORKLOAD_KINDS.IMAGE_GENERATION, { id: 'image-1', source: 'creator' });
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.decision.requiredAction, 'city:pause');
  assert.equal(actions.some((entry) => entry.action === 'city:pause'), false);

  const confirmed = g.acquire(EON_WORKLOAD_KINDS.IMAGE_GENERATION, { id: 'image-1', source: 'creator', confirmPreemptCity: true });
  assert.equal(confirmed.ok, true);
  assert.equal(actions.some((entry) => entry.action === 'city:pause' && entry.userConfirmed), true);

  const secondHeavy = g.acquire(EON_WORKLOAD_KINDS.VIDEO_GENERATION, { id: 'video-2', source: 'creator', confirmPreemptCity: true });
  assert.equal(secondHeavy.ok, false);
  assert.equal(secondHeavy.decision.reason, 'heavy-local-media-already-running');
  assert.equal(confirmed.lease.release('finished'), true);
  assert.equal(actions.some((entry) => entry.action === 'city:resume' && entry.workloadReleased), true);
});

test('W731 manual-pause guard prevents workload release from overriding a user-paused City', () => {
  const source = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  assert.match(source, /action\.action === 'city:resume' && root\.dataset\.eonCityWorkloadPause === 'active'/);
  assert.match(source, /const manuallyPaused = root\.dataset\.eonCityManualPause === 'active' \|\| pausePanel\?\.hidden === false/);
  assert.match(source, /if \(!manuallyPaused\)[\s\S]{0,700}resume/);
});
