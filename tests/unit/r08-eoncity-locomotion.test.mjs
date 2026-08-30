import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_R08_SPEEDS,
  deriveEonCityR08Locomotion,
  isEonCityR08SprintKeyboardCode
} from '../../assets/js/city/r08/eon-city-r08-locomotion.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('R08 locomotion uses explicit sprint intent rather than diagonal magnitude', () => {
  const travel = deriveEonCityR08Locomotion({ moving: true, sprintRequested: false, expanseActive: true });
  const sprint = deriveEonCityR08Locomotion({ moving: true, sprintRequested: true, expanseActive: true });
  assert.equal(travel.speed, EON_CITY_R08_SPEEDS.openWorld.travel);
  assert.equal(travel.sprinting, false);
  assert.equal(travel.diagonalSpeedBoost, false);
  assert.equal(sprint.speed, EON_CITY_R08_SPEEDS.openWorld.sprint);
  assert.equal(sprint.sprinting, true);
  assert.ok(sprint.speed > travel.speed);
});

test('R08 Hub travel stays controlled while Open World sprint is meaningfully faster', () => {
  const hub = deriveEonCityR08Locomotion({ moving: true, sprintRequested: true, expanseActive: false });
  const world = deriveEonCityR08Locomotion({ moving: true, sprintRequested: true, expanseActive: true });
  assert.equal(hub.speed, EON_CITY_R08_SPEEDS.commandHub.sprint);
  assert.equal(world.speed, EON_CITY_R08_SPEEDS.openWorld.sprint);
  assert.ok(world.speed > hub.speed);
  assert.equal(world.staminaRequired, false);
});

test('R08 recognizes both Shift keys as desktop sprint intent', () => {
  assert.equal(isEonCityR08SprintKeyboardCode('ShiftLeft'), true);
  assert.equal(isEonCityR08SprintKeyboardCode('ShiftRight'), true);
  assert.equal(isEonCityR08SprintKeyboardCode('KeyW'), false);
});

test('R08 runtime no longer derives run state from diagonal input magnitude', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.doesNotMatch(runtime, /Math\.abs\(input\.forward\) \+ Math\.abs\(input\.right\) > 1\.15/);
  assert.match(runtime, /deriveEonCityR08Locomotion/);
  assert.match(runtime, /isEonCityR08SprintKeyboardCode/);
  assert.match(runtime, /setSprint/);
});

test('R08 touch sprint is a separate toggle and cannot disturb the four-cell D-pad', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(access, /data-eon-city-sprint-toggle/);
  assert.match(access, /runtime\?\.setSprint\?\.\(requested/);
  assert.match(access, /touch-toggle-dispose/);
  assert.match(css, /\.eon-city-sprint-toggle/);
  assert.match(css, /@media \(pointer:coarse\),\(max-width:760px\)/);
});
