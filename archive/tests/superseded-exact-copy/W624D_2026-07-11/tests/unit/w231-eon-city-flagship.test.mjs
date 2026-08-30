import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_WORLD_STATE_KEY,
  ensureCityWorldState,
  recordCityDistrictVisit
} from '../../assets/js/city/city-world-state.js';
import {
  CITY_FIRST_CIRCUIT,
  buildCityObjective,
  getCityObjectiveProgress
} from '../../assets/js/city/eon-city-2d-engine.js';
import {
  buildEonbotCommandHubPlan,
  detectEonbotCommandHubAction
} from '../../assets/js/chat/eonbot-command-hub.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W231 makes the First Circuit a local, sequenced City return loop with no value, payout, token, or subscription path', () => {
  const storage = memoryStorage();
  let current = ensureCityWorldState({ storage, now: 100 }).state;
  assert.equal(buildCityObjective(current).id, 'visit-command-centre');
  assert.equal(getCityObjectiveProgress(current).completedSteps, 0);

  current = recordCityDistrictVisit('command', { storage, now: 101 }).state;
  assert.equal(buildCityObjective(current).id, 'visit-workspace');
  assert.equal(getCityObjectiveProgress(current).completedSteps, 1);

  // Visiting out of order can discover a place but cannot skip local progression.
  current = recordCityDistrictVisit('realm', { storage, now: 102 }).state;
  assert.equal(buildCityObjective(current).id, 'visit-workspace');

  current = recordCityDistrictVisit('workspace', { storage, now: 103 }).state;
  assert.equal(buildCityObjective(current).id, 'visit-realm-studio');
  current = recordCityDistrictVisit('realm', { storage, now: 104 }).state;
  assert.equal(buildCityObjective(current).id, 'return-to-command-centre');
  current = recordCityDistrictVisit('command', { storage, now: 105 }).state;

  const summary = JSON.stringify(JSON.parse(storage.getItem(CITY_WORLD_STATE_KEY)));
  assert.equal(buildCityObjective(current).complete, true);
  assert.equal(getCityObjectiveProgress(current).complete, true);
  assert.equal(getCityObjectiveProgress(current).completedSteps, CITY_FIRST_CIRCUIT.length);
  assert.match(getCityObjectiveProgress(current).badgeLabel, /marked locally/i);
  assert.doesNotMatch(summary, /pool point|eon lite|token|cash|payout|subscription|reward/i);
});

test('W231 ships a premium asset-free 2D RPG presentation with a routeable objective HUD and no fake population or economy', () => {
  const page = read('eoncity-lite.html');
  const map = read('assets/js/eon-operator-map.js');
  const css = read('assets/css/eon-operator-map.css');
  const engine = read('assets/js/city/eon-city-2d-engine.js');

  assert.match(page, /EON City Overview is the fast, local-first 2\.5D City workspace/i);
  assert.match(map, /data-city-quest-tracker|eon-city-quest-tracker/);
  assert.match(map, /First Circuit/i);
  assert.match(map, /drawTerrainTiles/);
  assert.match(map, /drawCityBoundary/);
  assert.match(map, /drawDistrictProps/);
  assert.match(map, /drawQuestMarker/);
  assert.match(map, /data-city-focus-objective/);
  assert.match(map, /requestedTargetId/);
  assert.match(css, /W231 — Flagship 2D RPG art and gameplay HUD/);
  assert.match(css, /eon-city-quest-tracker/);
  assert.match(engine, /CITY_FIRST_CIRCUIT/);
  assert.doesNotMatch(map, /auto-reward|payout|token conversion/i);
});

test('W231 lets EONBOT prepare City objective and district routes while retaining a user-tap boundary', () => {
  const cases = [
    ['what is next in eon city', 'guide-city-objective', '/eoncity?focus=objective'],
    ['guide me to command centre', 'guide-city-command-centre', '/eoncity?target=command'],
    ['take me to city workspace', 'guide-city-workspace', '/eoncity?target=workspace'],
    ['guide me to city realm studio', 'guide-city-realm', '/eoncity?target=realm']
  ];
  for (const [input, id, route] of cases) {
    const plan = buildEonbotCommandHubPlan(input);
    assert.equal(plan.commandId, id, input);
    assert.equal(plan.route, route, input);
    assert.equal(plan.actionType, 'city-guidance', input);
    assert.equal(plan.commandReceipt.execution, 'prepared-user-tap', input);
    assert.equal(plan.commandReceipt.completed, false, input);
    assert.equal(plan.commandReceipt.externalEffect, false, input);
  }
  assert.equal(detectEonbotCommandHubAction('open my realm in eon city').id, 'open-realm-studio');
});
