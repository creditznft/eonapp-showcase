import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const player = fs.readFileSync('assets/js/realm3d/engine/PlayerController.js', 'utf8');
const engine = fs.readFileSync('assets/js/realm3d/engine/EngineBoot.js', 'utf8');
const portal = fs.readFileSync('assets/js/realm3d/engine/PortalSystem.js', 'utf8');
const world = fs.readFileSync('assets/js/realm3d/engine/VoxelWorld.js', 'utf8');
const css = fs.readFileSync('assets/css/realm3d.css', 'utf8');

test('Realm3D no longer traps mouse on accidental canvas click', () => {
  assert.match(player, /clickToLock = false/);
  assert.match(player, /if \(this\.clickToLock\) this\.requestPointerLock\(\)/);
  assert.match(engine, /data-realm3d-enter/);
  assert.match(engine, /Enter Game Mode when ready/);
  assert.match(engine, /data-realm3d-exit/);
});

test('Realm3D has explicit pointer lock exit and browser safety releases', () => {
  assert.match(player, /releasePointerLock\(reason = 'manual'\)/);
  assert.match(player, /visibilitychange/);
  assert.match(player, /window\.addEventListener\('blur'/);
  assert.match(engine, /exitGameMode\('escape-key'\)/);
  assert.match(engine, /aria-label="Exit mouse control and pause"/);
});

test('Realm3D movement uses camera-relative forward and right vectors', () => {
  assert.match(player, /new THREE\.Vector3\(0, 0, -1\)\.applyEuler\(yawEuler\)/);
  assert.match(player, /new THREE\.Vector3\(1, 0, 0\)\.applyEuler\(yawEuler\)/);
  assert.match(player, /addScaledVector\(forward, move\.y\)/);
  assert.match(player, /addScaledVector\(right, move\.x\)/);
});

test('Realm3D supports fullscreen and mobile-safe focused screen UI', () => {
  assert.match(engine, /toggleFullscreen/);
  assert.match(engine, /requestFullscreen/);
  assert.match(css, /realm3d-fullscreen/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /realm3d-screen-focus-bar/);
});

test('Realm3D exposes workstation screen interactions before portal/NPC fallback', () => {
  assert.match(portal, /activeScreen/);
  assert.match(portal, /onScreenFocus/);
  assert.match(portal, /focus .*\$\{this\.activeScreen\.label\}/);
  assert.match(world, /addWorkstationScreens/);
  assert.match(world, /workstation-screen/);
});
