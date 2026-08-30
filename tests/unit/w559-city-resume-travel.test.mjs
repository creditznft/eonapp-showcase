import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_RESUME_STATE_KEY,
  EON_CITY_RESUME_TRAVEL_SCHEMA,
  applyEonCityMapTravel,
  applyEonCityResume,
  captureEonCityResumeFromRuntime,
  clearEonCityResumeState,
  getEonCityResumeTruth,
  getEonCityTravelDestinations,
  normalizeEonCityResumeState,
  prepareEonCityMapTravel,
  prepareEonCityResume,
  readEonCityResumeState,
  renderEonCityTravelResume
} from '../../assets/js/contracts/city/eon-city-resume-travel.js';
import { createEonCityWorkroomOverlay } from '../../assets/js/city/eon-city-workroom-overlay.js';
import { collectLocalEncryptedExportRecords, restoreLocalEncryptedExportPayload } from '../../assets/js/local-first/eon-local-encrypted-export.js';
import { collectEonAppOwnedStorage, isEonAppBackupEligibleKey } from '../../assets/js/vault/eon-vault-lifecycle.js';
import { W145_PROTECTED_STORAGE_GROUPS } from '../../assets/js/utils/update-safe-user-data.js';

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return map.size; },
    key(index) { return [...map.keys()][index] || null; },
    getItem(key) { return map.has(String(key)) ? map.get(String(key)) : null; },
    setItem(key, value) { map.set(String(key), String(value)); },
    removeItem(key) { map.delete(String(key)); },
    toObject() { return Object.fromEntries(map.entries()); }
  };
}

function pose(x = 1, z = 2, pointerLookEnabled = false) {
  return {
    player: { x, y: 0, z, heading: 0.4 },
    camera: { alpha: -0.8, beta: 1.1, radius: 10, target: { x, y: 1.18, z } },
    controller: { mode: 'third-person', pointerLookEnabled }
  };
}

function createRuntime(initialPose = pose()) {
  let current = initialPose;
  let paused = false;
  const calls = [];
  return {
    calls,
    getExplorationPose() { calls.push('capture'); return current; },
    focusLandmark(id) {
      calls.push(['focus', id]);
      current = pose(id === 'workshop' ? -8.4 : 0, id === 'workshop' ? -2.1 : -5, false);
      return { id };
    },
    restoreExplorationPose(next) { calls.push(['restore', next]); current = next; return next; },
    resetView() { calls.push('reset'); current = pose(0, 7.8, false); return true; },
    isPaused() { return paused; },
    pause() { calls.push('pause'); paused = true; },
    resume() { calls.push('resume'); paused = false; }
  };
}

test('W559 exposes only static public landmark destinations and requires an explicit travel action', () => {
  const destinations = getEonCityTravelDestinations();
  assert.deepEqual(destinations.map((entry) => entry.id), ['command-centre', 'workshop', 'relay', 'archive', 'observatory']);
  assert.equal(destinations.every((entry) => entry.localOnly && entry.opensRoute === false && entry.executesWork === false), true);
  assert.equal(JSON.stringify(destinations).includes('/projects'), false);
  assert.equal(JSON.stringify(destinations).includes('projectReference'), false);
  assert.equal(prepareEonCityMapTravel('workshop').error, 'explicit-user-action-required');
  assert.equal(prepareEonCityMapTravel('not-a-place', { explicitUserAction: true }).error, 'city-travel-destination-required');
});

test('W559 focuses a local landmark, persists only bounded continuity state, and resumes only after a second visible action', () => {
  const storage = memoryStorage();
  const runtime = createRuntime(pose(1, 2, true));
  const blocked = applyEonCityMapTravel(runtime, 'workshop', { storage, explicitUserAction: false, now: 1719878400000 });
  assert.equal(blocked.error, 'explicit-user-action-required');
  assert.equal(runtime.calls.some((entry) => Array.isArray(entry) && entry[0] === 'focus'), false);

  const travelled = applyEonCityMapTravel(runtime, 'workshop', { storage, explicitUserAction: true, now: 1719878400000 });
  assert.equal(travelled.ok, true);
  assert.equal(travelled.destination.id, 'workshop');
  assert.equal(travelled.opensRoute, false);
  assert.equal(travelled.executesWork, false);
  const saved = readEonCityResumeState({ storage, now: 1719878400001 });
  assert.equal(saved.lastDestinationId, 'workshop');
  assert.equal(saved.pose.player.x, -8.4);
  assert.equal(saved.pose.controller.pointerLookEnabled, false);
  assert.equal(saved.pointerLockRestored, false);

  runtime.focusLandmark('observatory');
  const resumeBlocked = applyEonCityResume(runtime, { storage, explicitUserAction: false, now: 1719878400002 });
  assert.equal(resumeBlocked.error, 'explicit-user-action-required');
  const resumed = applyEonCityResume(runtime, { storage, explicitUserAction: true, now: 1719878400003 });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.pointerLockRestored, false);
  assert.equal(runtime.calls.some((entry) => Array.isArray(entry) && entry[0] === 'restore'), true);
  runtime.resetView();
  captureEonCityResumeFromRuntime(runtime, { storage, now: 1719878400004, reason: 'explicit-arrival-reset', lastDestinationId: null });
  assert.equal(readEonCityResumeState({ storage, now: 1719878400005 }).lastDestinationId, null);
});

test('W559 rejects unknown state fields and constrains malformed poses before storage, export, or restore', () => {
  const normalized = normalizeEonCityResumeState({
    schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
    version: 999,
    updatedAt: '2026-07-03T00:00:00.000Z',
    lastDestinationId: 'workshop',
    reason: 'anything-else',
    pose: {
      player: { x: 99999, y: -99, z: -99999, heading: 999 },
      camera: { alpha: 999, beta: 99, radius: 999, target: { x: 500, y: 100, z: -500 } },
      controller: { mode: 'third-person', pointerLookEnabled: true }
    },
    projectReference: 'private_project_77',
    prompt: 'do something secret',
    apiKey: 'secret'
  }, { now: 1719878400000 });
  assert.equal(normalized.player, undefined);
  assert.equal(normalized.pose.player.x, 13);
  assert.equal(normalized.pose.player.z, -13);
  assert.equal(normalized.pose.camera.radius, 40);
  assert.equal(normalized.lastDestinationId, 'workshop');
  assert.equal(normalized.reason, 'local-page-exit');
  const text = JSON.stringify(normalized);
  assert.equal(text.includes('private_project_77'), false);
  assert.equal(text.includes('do something secret'), false);
  assert.equal(text.includes('secret'), false);
});

test('W559 captures after a same-tab Workroom return and does not claim pointer-lock restoration', () => {
  const storage = memoryStorage();
  const runtime = createRuntime(pose(4, -3, true));
  let restoredCallback = null;
  const overlay = createEonCityWorkroomOverlay({
    runtime,
    onPoseRestored: (event) => {
      restoredCallback = event;
      captureEonCityResumeFromRuntime(runtime, { storage, now: 1719878400000, reason: 'local-workroom-return' });
    }
  });
  assert.equal(overlay.open({ id: 'project-console', explicitUserAction: true }).ok, true);
  const closed = overlay.close({ explicitUserAction: true, reason: 'project-console-close' });
  assert.equal(closed.poseRestored, true);
  assert.equal(restoredCallback.id, 'project-console');
  assert.equal(restoredCallback.pointerLockRestored, false);
  const saved = readEonCityResumeState({ storage, now: 1719878400001 });
  assert.equal(saved.reason, 'local-workroom-return');
  assert.equal(saved.pose.player.x, 4);
  assert.equal(saved.pose.controller.pointerLookEnabled, true);
});

test('W559 encrypted portability and update-safe registration retain only the allowlisted resume record', () => {
  const storage = memoryStorage({
    [EON_CITY_RESUME_STATE_KEY]: JSON.stringify({
      schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
      version: 1,
      updatedAt: '2026-07-03T00:00:00.000Z',
      lastDestinationId: 'archive',
      reason: 'local-page-exit',
      pose: pose(8.2, -3.2, true),
      privateTask: 'do not export',
      token: 'do not export'
    })
  });
  assert.equal(isEonAppBackupEligibleKey(EON_CITY_RESUME_STATE_KEY), true);
  const localRecords = collectLocalEncryptedExportRecords({ storage });
  const portableRecord = localRecords.find((record) => record.key === EON_CITY_RESUME_STATE_KEY);
  assert.ok(portableRecord);
  assert.equal(JSON.stringify(portableRecord.value).includes('do not export'), false);
  const vaultSnapshot = collectEonAppOwnedStorage({ storage });
  assert.equal(vaultSnapshot[EON_CITY_RESUME_STATE_KEY].includes('do not export'), false);

  const target = memoryStorage();
  const restored = restoreLocalEncryptedExportPayload({ records: localRecords }, { storage: target });
  assert.equal(restored.ok, true);
  const state = readEonCityResumeState({ storage: target });
  assert.equal(state.lastDestinationId, 'archive');
  assert.equal(JSON.stringify(state).includes('do not export'), false);
  assert.equal(W145_PROTECTED_STORAGE_GROUPS.find((group) => group.id === 'city-preview-work-loop')?.keys.includes(EON_CITY_RESUME_STATE_KEY), true);
  const truth = getEonCityResumeTruth({ storage: target });
  assert.equal(truth.encryptedExportEligible, true);
  assert.equal(truth.automaticCrossDeviceSync, false);
  assert.equal(truth.remoteNetwork, false);
});

test('W559 renders explicit local controls and only clears a saved pose after a user action', () => {
  const storage = memoryStorage();
  const runtime = createRuntime();
  captureEonCityResumeFromRuntime(runtime, { storage, now: 1719878400000 });
  assert.equal(clearEonCityResumeState({ storage }).error, 'explicit-user-action-required');
  assert.equal(clearEonCityResumeState({ storage, explicitUserAction: true }).ok, true);
  const markup = renderEonCityTravelResume();
  assert.equal(markup.includes('data-eon-play-open-travel-map'), false);
  assert.equal(markup.includes('data-eon-play-travel-destination="workshop"'), true);
  assert.equal(markup.includes('data-eon-play-resume-continue'), true);
  assert.equal(markup.includes('data-eon-play-resume-panel hidden role="dialog" aria-modal="true"'), true);
  assert.equal(/(?:fetch|WebSocket|EventSource|href=)/i.test(markup), false);
  assert.equal(markup.includes('subscription'), false);
});

test('W559 resume source suppresses the first-run panel when a saved City view is present', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../assets/js/contracts/city/eon-city-resume-travel.js', import.meta.url), 'utf8');
  assert.match(source, /const firstRunPanel = root\?\.querySelector\?\.\('\[data-eon-play-first-run-panel\]'\);/);
  assert.match(source, /if \(state && firstRunPanel && !firstRunPanel\.hidden\) firstRunPanel\.hidden = true;/);
});

test('W559 rejects absent/malformed resume data before any runtime restore', () => {
  const runtime = createRuntime();
  assert.equal(prepareEonCityResume(null, { explicitUserAction: true }).error, 'city-resume-state-unavailable');
  assert.equal(applyEonCityResume(runtime, { storage: memoryStorage(), explicitUserAction: true }).error, 'city-resume-state-unavailable');
});
