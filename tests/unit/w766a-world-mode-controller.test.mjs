import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_W766A_MODES,
  createEonCityW766AReturnSnapshot,
  createEonCityW766AWorldModeController,
  validateEonCityW766AReturnSnapshot,
  validateEonCityW766AWorldModeState
} from '../../assets/js/city/w766/eon-city-w766a-world-mode-controller.js';

test('W766A requires review and explicit entry before loading', () => {
  let clock = 100;
  const controller = createEonCityW766AWorldModeController({ now: () => ++clock });
  const snapshot = createEonCityW766AReturnSnapshot({ player: { x: 1, y: 0, z: 2, heading: 0.5 }, camera: { alpha: 1, beta: 1, radius: 10, target: { x: 0, y: 1, z: 0 }, mode: 'command-wall-focus' } });
  assert.equal(validateEonCityW766AReturnSnapshot(snapshot).ok, true);
  assert.equal(snapshot.camera.mode, 'command-wall-focus');
  assert.equal(controller.beginEntry({ snapshot, explicitUserAction: true }).ok, false);
  assert.equal(controller.review({ explicitUserAction: false }).ok, false);
  assert.equal(controller.review({ explicitUserAction: true }).state.mode, EON_CITY_W766A_MODES.EXPANSE_ENTRY_REVIEW);
  assert.equal(controller.beginEntry({ snapshot, explicitUserAction: true }).state.mode, EON_CITY_W766A_MODES.EXPANSE_LOADING);
});

test('W766A permits an explicit My Frontier starter transition without opening the Signal review', () => {
  const controller = createEonCityW766AWorldModeController();
  const snapshot = createEonCityW766AReturnSnapshot({ player: { x: 1, y: 0, z: 2 } });
  assert.equal(controller.beginStarterEntry({ snapshot }).ok, false);
  const started = controller.beginStarterEntry({ snapshot, explicitUserAction: true });
  assert.equal(started.ok, true);
  assert.equal(started.state.mode, EON_CITY_W766A_MODES.EXPANSE_LOADING);
  assert.equal(started.state.reviewed, false);
  assert.equal(started.state.reason, 'my-frontier-starter-entry-confirmed');
});

test('W766A accepts retained decoded Expanse suspension for deterministic Hub restore', () => {
  const controller = createEonCityW766AWorldModeController();
  const snapshot = createEonCityW766AReturnSnapshot({ player: { x: 2, y: 0, z: 4, heading: 0.25 } });
  controller.review({ explicitUserAction: true });
  controller.beginEntry({ snapshot, explicitUserAction: true });
  controller.reportLoading(1);
  controller.activate({ mountedInCanonicalScene: true });
  controller.requestReturn({ explicitUserAction: true });
  const restoring = controller.beginHubRestore({ expanseSuspended: true });
  assert.equal(restoring.ok, true);
  assert.equal(restoring.state.mode, EON_CITY_W766A_MODES.HUB_RESTORING);
  assert.equal(restoring.state.reason, 'hub-restoring-from-suspended-world');
  assert.equal(controller.completeHubRestore({ snapshotRestored: true }).state.mode, EON_CITY_W766A_MODES.COMMAND_HUB);
});

test('W766A safely cancels entry review when the player navigates away', () => {
  const controller = createEonCityW766AWorldModeController();
  controller.review({ explicitUserAction: true });
  const cancelled = controller.cancelReview({ safeNavigationAway: true });
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.state.mode, EON_CITY_W766A_MODES.COMMAND_HUB);
  assert.equal(cancelled.state.reason, 'gateway-review-cancelled-by-navigation');
});

test('W766A supports canonical-scene activation and deterministic safe return', () => {
  const controller = createEonCityW766AWorldModeController();
  const snapshot = createEonCityW766AReturnSnapshot({ player: { position: { x: 4, y: 0, z: -7 }, heading: 1.2 }, inputState: { source: 'test' } });
  controller.review({ explicitUserAction: true });
  controller.beginEntry({ snapshot, explicitUserAction: true });
  assert.equal(controller.activate({ mountedInCanonicalScene: true }).ok, false);
  controller.reportLoading(1);
  assert.equal(controller.activate({ mountedInCanonicalScene: true }).state.mode, EON_CITY_W766A_MODES.EXPANSE_ACTIVE);
  assert.equal(controller.requestReturn({ explicitUserAction: true }).state.mode, EON_CITY_W766A_MODES.RETURNING_TO_HUB);
  assert.equal(controller.beginHubRestore({ expanseDisposed: true }).state.mode, EON_CITY_W766A_MODES.HUB_RESTORING);
  const restored = controller.completeHubRestore({ snapshotRestored: true }).state;
  assert.equal(restored.mode, EON_CITY_W766A_MODES.COMMAND_HUB);
  assert.equal(restored.returnSnapshot, null);
  assert.equal(validateEonCityW766AWorldModeState(restored).ok, true);
});

test('W766A reconciles only an already-mounted World that still retains its safe Hub snapshot', () => {
  const controller = createEonCityW766AWorldModeController();
  const snapshot = createEonCityW766AReturnSnapshot({ player: { x: 4, y: 0, z: -7 } });
  controller.beginStarterEntry({ snapshot, explicitUserAction: true });
  controller.reportLoading(1);
  const reconciled = controller.reconcileActiveWorld({ explicitUserAction: true, canonicalSceneMounted: true });
  assert.equal(reconciled.ok, true);
  assert.equal(reconciled.reconciled, true);
  assert.equal(reconciled.state.mode, EON_CITY_W766A_MODES.EXPANSE_ACTIVE);
  assert.equal(controller.requestReturn({ explicitUserAction: true }).ok, true);

  const missingSnapshot = createEonCityW766AWorldModeController();
  assert.equal(missingSnapshot.reconcileActiveWorld({ explicitUserAction: true, canonicalSceneMounted: true }).ok, false);
  assert.equal(missingSnapshot.reconcileActiveWorld({ explicitUserAction: true, canonicalSceneMounted: false }).reason, 'canonical-world-presentation-required');
});

test('W766A fails safely to Hub without a second runtime', () => {
  const controller = createEonCityW766AWorldModeController();
  const state = controller.failSafeToHub('sector-mount-failed').state;
  assert.equal(state.mode, EON_CITY_W766A_MODES.COMMAND_HUB);
  assert.equal(state.failure, 'sector-mount-failed');
  assert.equal(state.oneEngine, true);
  assert.equal(state.oneScene, true);
  assert.equal(state.oneRenderLoop, true);
});

test('W766A return snapshot stores only privacy-safe mission progress', () => {
  const snapshot = createEonCityW766AReturnSnapshot({
    player: { x: 1, y: 0, z: 2 },
    missionState: {
      activeMissionId: 'beyond-the-gate',
      currentObjective: 'meet-pathfinder',
      completedMissions: ['old-mission'],
      totalXp: 120,
      currentLevel: 2,
      privateProjectText: 'must not survive',
      missions: { 'beyond-the-gate': { currentObjective: 'meet-pathfinder', privatePrompt: 'secret' } }
    }
  });
  assert.deepEqual(snapshot.missionState, {
    activeMissionId: 'beyond-the-gate',
    currentObjective: 'meet-pathfinder',
    completedMissions: ['old-mission'],
    totalXp: 120,
    currentLevel: 2
  });
  assert.equal('privateProjectText' in snapshot.missionState, false);
  assert.equal('missions' in snapshot.missionState, false);
});
