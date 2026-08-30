import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_ALLOWED_MOUNT_REASONS,
  createEonCityRuntimeIdentitySnapshot,
  ensureEonCityAccessMountIdentity,
  getEonCityObjectIdentity,
  normalizeEonCityMountRequest,
  recordEonCityRuntimeReadinessEvent
} from '../../assets/js/city/eon-city-runtime-identity.js';
import { mountEonCityAccessStation } from '../../assets/js/city/eon-city-access-station.js';

function fakeRoot() {
  return {
    dataset: {},
    innerHTML: '',
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, right: 1280, top: 0, bottom: 720, width: 1280, height: 720 }; }
  };
}

test('W766IR2-0 accepts only the four reviewed mount reasons with required evidence', () => {
  assert.deepEqual(EON_CITY_ALLOWED_MOUNT_REASONS, [
    'initial-entry',
    'explicit-restart-3d',
    'explicit-approved-release-reload',
    'verified-context-loss-recovery'
  ]);
  assert.equal(normalizeEonCityMountRequest({ reason: 'initial-entry' }).ok, true);
  assert.equal(normalizeEonCityMountRequest({ reason: 'menu-open' }).rejectionReason, 'mount-reason-not-allowed');
  assert.equal(normalizeEonCityMountRequest({ reason: 'explicit-restart-3d' }).rejectionReason, 'explicit-user-action-required');
  assert.equal(normalizeEonCityMountRequest({ reason: 'explicit-restart-3d', explicitUserAction: true }).ok, true);
  assert.equal(normalizeEonCityMountRequest({ reason: 'verified-context-loss-recovery', verifiedContextLoss: true }).ok, true);
  assert.equal(normalizeEonCityMountRequest({ reason: 'verified-context-loss-recovery' }).rejectionReason, 'verified-context-loss-required');
});

test('W766IR2-0 identities are stable for the same browser objects and readiness events are bounded/private-safe', () => {
  const root = fakeRoot();
  const runtime = { getRuntimeIdentitySnapshot: () => ({ canvasId: 'canvas:a', engineId: 'engine:a', sceneId: 'scene:a', playerRootId: 'player:a', cameraId: 'camera:a', renderLoopId: 'loop:a' }) };
  root.__eonCityRuntime = runtime;
  root.dataset.eonCityRuntimeLifecycle = 'running';
  const firstMountId = ensureEonCityAccessMountIdentity(root);
  assert.equal(ensureEonCityAccessMountIdentity(root), firstMountId);
  const object = {};
  assert.equal(getEonCityObjectIdentity(object, 'engine'), getEonCityObjectIdentity(object, 'engine'));
  const snapshot = createEonCityRuntimeIdentitySnapshot({ root, documentRef: null, navigatorRef: null, runtime });
  assert.equal(snapshot.engineId, 'engine:a');
  assert.equal(snapshot.sceneId, 'scene:a');
  for (let index = 0; index < 110; index += 1) recordEonCityRuntimeReadinessEvent(root, 'cycle', { generation: index, result: 'pass' });
  assert.equal(root.__eonCityRuntimeReadinessEvents.length, 96);
  assert.equal(JSON.stringify(root.__eonCityRuntimeReadinessEvents).includes('account'), false);
});

test('W766IR2-0 rejects a second access-station mount while a healthy runtime is active', async () => {
  const root = fakeRoot();
  const runtime = { destroy() { throw new Error('must-not-destroy'); } };
  root.__eonCityRuntime = runtime;
  root.dataset.eonCityRuntimeLifecycle = 'running';
  let fetchCalls = 0;
  let importCalls = 0;
  const result = await mountEonCityAccessStation(root, {
    fetchImpl: async () => { fetchCalls += 1; throw new Error('must-not-fetch'); },
    importImpl: async () => { importCalls += 1; throw new Error('must-not-import'); }
  });
  assert.equal(result.state, 'city-mount-rejected');
  assert.equal(result.reason, 'healthy-runtime-already-running');
  assert.equal(result.runtime, runtime);
  assert.equal(fetchCalls, 0);
  assert.equal(importCalls, 0);
});

test('W766IR2-0 source stages replacements and records runtime identity instead of destroying first', () => {
  const access = fs.readFileSync(new URL('../../assets/js/city/eon-city-access-station.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(access, /replacement-staging/);
  assert.match(access, /explicit-restart-failed-old-runtime-preserved/);
  assert.match(access, /mount-reason-not-allowed|normalizeEonCityMountRequest/);
  assert.match(access, /preparation-screen-shown/);
  assert.match(access, /runtime-mounted/);
  assert.match(runtime, /getRuntimeIdentitySnapshot/);
  for (const token of ['canvasId', 'engineId', 'sceneId', 'playerRootId', 'cameraId', 'renderLoopId']) assert.match(runtime, new RegExp(token));
});
