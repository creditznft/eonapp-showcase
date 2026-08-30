import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES,
  EON_CITY_COMMAND_DISTRICT_DESTINATIONS,
  EON_CITY_COMMAND_DISTRICT_JOURNEY,
  EON_CITY_COMMAND_DISTRICT_PATHS,
  EON_CITY_COMMAND_DISTRICT_SPAWN,
  EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS,
  findEonCityCommandDistrictUnstuckPoint,
  getEonCityCommandDistrictDestination,
  getEonCityCommandDistrictVerticalSlicePlan,
  validateEonCityCommandDistrictVerticalSlice
} from '../../assets/js/city/eon-city-command-district-vertical-slice.js';
import { confirmPreparedCityAction, prepareCityPlayAction } from '../../assets/js/city/city-prepared-action.js';
import { validateW624cCommandDistrictContract } from '../../config/w624c-command-district-vertical-slice-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test('W624C freezes a finite Productive Nocturne slice and preserves W624B ownership', () => {
  const plan = getEonCityCommandDistrictVerticalSlicePlan();
  assert.equal(validateEonCityCommandDistrictVerticalSlice(plan).ok, true);
  assert.equal(validateW624cCommandDistrictContract().ok, true);
  assert.equal(plan.artDirection, 'Productive Nocturne');
  assert.equal(plan.canonicalHeavyRoute, '/eoncity');
  assert.equal(plan.runtimeOwner, 'assets/js/city/eon-city-runtime-owner.js');
  assert.equal(plan.finalQualityExpansionAllowed, false);
  assert.equal(plan.requiredIndependentScore, 90);
});

test('W624C provides six honest destinations with canonical internal routes', () => {
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map((entry) => entry.id), ['agent-theatre', 'creator-portal', 'forge-basilica', 'project-dock', 'archive-canopy', 'signal-sail']);
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map((entry) => entry.action.route), ['/automations', '/create', '/forge', '/projects', '/library', '/workspace']);
  for (const entry of EON_CITY_COMMAND_DISTRICT_DESTINATIONS) {
    assert.equal(entry.action.route.startsWith('/'), true);
    assert.doesNotMatch(JSON.stringify(entry), /https?:\/\/|apiKey|credential|private prompt|fake job|fake economy/i);
    assert.ok(getEonCityCommandDistrictDestination(entry.id));
  }
  assert.match(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.find((entry) => entry.id === 'agent-theatre').description, /receipt-backed/i);
  assert.match(EON_CITY_COMMAND_DISTRICT_DESTINATIONS.find((entry) => entry.id === 'agent-theatre').operationalClaim, /dormant/);
});

test('W624C actions remain prepare-review-confirm and never navigate from City code', () => {
  const storage = memoryStorage();
  for (const [index, entry] of EON_CITY_COMMAND_DISTRICT_DESTINATIONS.entries()) {
    const prepared = prepareCityPlayAction(entry.id, { storage, now: 10_000 + index });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.action.route, entry.action.route);
    assert.equal(prepared.action.requiresUserConfirmation, true);
    const confirmed = confirmPreparedCityAction(prepared.action.id, { storage, now: 11_000 + index });
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.href, entry.action.route);
  }
  const station = read('assets/js/eon-city-play-station.js');
  assert.doesNotMatch(station, /location\.assign|window\.location|location\.href\s*=/);
});

test('W624C defines first-ten and first-sixty journeys with safe authored traversal', () => {
  assert.equal(EON_CITY_COMMAND_DISTRICT_JOURNEY.firstTenSeconds.length, 4);
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_JOURNEY.firstTenSeconds.map((entry) => entry.second), [0, 3, 6, 10]);
  assert.equal(EON_CITY_COMMAND_DISTRICT_JOURNEY.firstSixtySeconds.length, 5);
  assert.deepEqual(EON_CITY_COMMAND_DISTRICT_JOURNEY.firstSixtySeconds.map((entry) => entry.second), [0, 10, 22, 38, 60]);
  assert.ok(EON_CITY_COMMAND_DISTRICT_PATHS.length >= 7);
  assert.ok(EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES.length >= 7);
  assert.ok(EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS.length >= 6);
  assert.equal(EON_CITY_COMMAND_DISTRICT_SPAWN.z, 9.35);
  assert.equal(Math.hypot(EON_CITY_COMMAND_DISTRICT_SPAWN.x, EON_CITY_COMMAND_DISTRICT_SPAWN.z - 11.82) > EON_CITY_COMMAND_DISTRICT_SPAWN.safeRadius, true);
  const safe = findEonCityCommandDistrictUnstuckPoint({ x: 4.7, z: 1.9 });
  assert.equal(safe.id, 'agent-approach');
});

test('W624C renderer contains authored landmark silhouettes, paths, spawn and unstuck wiring', () => {
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const architecture = read('assets/js/city/eon-city-noir-architecture.js');
  const controller = read('assets/js/city/eon-city-third-person-controller.js');
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(renderer, /W624C_COMMAND_DISTRICT_SLICE/);
  assert.match(renderer, /addCommandDistrictVerticalSlice/);
  assert.match(renderer, /type: 'agent-theatre'/);
  assert.match(renderer, /type: 'support-dock'/);
  assert.match(renderer, /EON_CITY_COMMAND_DISTRICT_SPAWN/);
  assert.match(renderer, /findEonCityCommandDistrictUnstuckPoint/);
  assert.match(renderer, /unstuck\(\)/);
  assert.match(architecture, /agent-theatre-open-crown/);
  assert.match(architecture, /representsLiveAgent: false/);
  assert.match(controller, /x: -8\.4, z: -4\.1/);
  assert.match(controller, /x: 8\.2, z: -3\.2/);
  assert.match(station, /data-eon-play-unstuck/);
  assert.match(station, /explicit-authored-unstuck/);
});

test('W624C keeps source proof separate from runtime visual and physical-device approval', () => {
  const plan = getEonCityCommandDistrictVerticalSlicePlan();
  assert.equal(plan.remoteArtRequired, false);
  assert.equal(plan.performanceBudget.audioStartsAutomatically, false);
  assert.equal(plan.performanceBudget.detailFailureBlocksCore, false);
  assert.equal(plan.fakeOperationalActivity, false);
  assert.equal(plan.finalQualityExpansionAllowed, false);
});
