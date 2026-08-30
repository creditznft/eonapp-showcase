import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const entrypoint = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-core.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const contract = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js', import.meta.url), 'utf8');

test('W703 world-safety invariant is owned by the active W731 runtime', () => {
  assert.match(entrypoint, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(runtime, /camera\.lowerBetaLimit = EON_CITY_W743_ARRIVAL_CAMERA\.lowerBetaLimit/);
  assert.match(runtime, /camera\.upperRadiusLimit = EON_CITY_W743_ARRIVAL_CAMERA\.upperRadiusLimit/);
  // W759R1 advances through a shared fixed-step simulation. Command Hub
  // movement remains world-bounded and then passes through the deterministic
  // RT96 footprint-collision authority; W766I Expanse retains its separate
  // finite borderless position authority.
  assert.match(runtime, /const requested = playerAnchor\.position\.add\(directionVector\.scale\(speed \* deltaSeconds\)\)[\s\S]*const next = expanseMovementActive[\s\S]*sanitizeEonExpanseW766APlayerPosition[\s\S]*: clampEonCityW731Position\(requested\)[\s\S]*resolveEonCityW765R6PlayerCollision\(next, playerAnchor\.position, playerCollisionZones\)/);
  assert.match(contract, /safetyRadius: 25\.5/);
  assert.match(contract, /playableRadius: 27/);
});

test('W703 underside-hiding invariant remains non-interactive', () => {
  assert.match(runtime, /w731-command-hub-world-safety-underlay/);
  assert.match(runtime, /hidesWorldUnderside: true/);
  assert.match(runtime, /underside\.isPickable = false/);
  assert.match(runtime, /underside\.position\.y = -4\.18/);
});

test('W703 restore, focus and unstuck paths remain sanitized and explicit', () => {
  assert.match(runtime, /const applyPlayerPose = \(pose = \{\},[\s\S]*sanitizeEonCityW747WorldPoint\(pose\)[\s\S]*clampEonCityW731Position\(sanitized\)/);
  assert.match(runtime, /restoreExplorationPose\(pose = \{\}\) \{ applyPlayerPose\(pose/);
  assert.match(runtime, /focusLandmark\(id = ''\)[\s\S]*guideToStation\(stationId\)/);
  assert.match(runtime, /unstuck\(\) \{[\s\S]{0,220}findEonCityW765R6NearestSafePosition\(playerAnchor\.position, playerCollisionZones/);
  assert.match(runtime, /worldRadius: EON_CITY_W731_WORLD_BOUNDS\.safetyRadius/);
  assert.match(runtime, /explicit-user-action-required/);
});
