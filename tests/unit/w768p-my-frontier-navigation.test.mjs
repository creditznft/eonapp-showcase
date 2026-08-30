import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from '../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js';
import { deriveEonExpanseW768PMyFrontierNavigation, validateEonExpanseW768PNavigationAction } from '../../assets/js/city/w768/eon-expanse-w768p-my-frontier-navigation.js';

const unlocked = Object.freeze({ schema: EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA, unlocked: true });

test('W768P exposes one authored My Frontier route only after verified unlock', () => {
  const locked = deriveEonExpanseW768PMyFrontierNavigation({ playerPosition: { x: 0, z: 0 } });
  const view = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: unlocked, playerPosition: { x: 0, z: 0 } });
  assert.equal(locked.visible, false);
  assert.equal(view.available, true);
  assert.equal(view.action.type, 'guide-my-frontier');
  assert.equal(view.guidance.objective, 'activity:my-frontier-arrival');
});

test('W768P reports arrival and removes the route action near the authored platform', () => {
  const distant = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: unlocked, playerPosition: { x: 0, z: 0 } });
  const target = distant.guidance.target;
  const arrived = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: unlocked, playerPosition: target });
  assert.equal(arrived.arrived, true);
  assert.equal(arrived.available, false);
  assert.equal(arrived.action, null);
});

test('W768P requires explicit action and rejects a changed authored target token', () => {
  const view = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: unlocked, playerPosition: { x: 0, z: 0 } });
  assert.equal(validateEonExpanseW768PNavigationAction(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768PNavigationAction(view, { explicitUserAction: true, expectedPlotId: 'plot-central-command', expectedTargetToken: view.action.targetToken }).ok, true);
  assert.equal(validateEonExpanseW768PNavigationAction(view, { explicitUserAction: true, expectedTargetToken: 'changed' }).reason, 'my-frontier-guidance-target-changed');
});

test('W768P never teleports, moves automatically, awards XP or creates another runtime', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768p-my-frontier-navigation.js', import.meta.url), 'utf8');
  const view = deriveEonExpanseW768PMyFrontierNavigation({ myFrontierState: unlocked, playerPosition: { x: 0, z: 0 } });
  assert.equal(view.action.teleport, false);
  assert.equal(view.action.automaticMovement, false);
  assert.equal(view.grantsXp, false);
  assert.equal(view.mutatesProgression, false);
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|\.position\.set/);
});

test('W768P is wired to the existing EONBOT guidance controller and mission board', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW768PMyFrontierNavigation/);
  assert.match(runtime, /validateEonExpanseW768PNavigationAction/);
  assert.match(runtime, /expanseActivityGuidance = validated\.guidance/);
  assert.match(runtime, /expanseGuideController\.request\(expanseGuidance/);
  assert.match(overlay, /my-frontier-guide/);
  assert.match(overlay, /onGuideMyFrontierAction/);
  assert.match(overlay, /expectedTargetToken/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
