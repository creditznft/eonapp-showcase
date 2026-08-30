import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_BEGINNER_MISSIONS,
  CITY_LOCAL_AI_MISSION,
  CITY_PROJECTS_MISSION,
  CITY_WORKSPACE_MISSION,
  CITY_WORK_MISSION_STORAGE_KEY,
  CITY_WORK_MISSION_TTL_MS,
  completeCityBeginnerMission,
  completeCityProjectMission,
  completeCityWorkspaceMission,
  dismissCityBeginnerMission,
  getCityBeginnerMission,
  getCityWorkMissionReceipt,
  offerCityBeginnerMission,
  offerCityWorkspaceMission,
  openCityBeginnerMission,
  readCityBeginnerMissionFromSearch,
  recordCityLocalAiSelfTestOutcome,
  returnCityBeginnerMission
} from '../../assets/js/contracts/city/city-work-mission.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

function preparedAction(mission, suffix = 'abc123') {
  return {
    id: `city-action-${suffix}`,
    landmarkId: mission.sourceLandmarkId,
    destinationId: mission.actionId,
    route: mission.destination
  };
}

function offerOpen(storage, mission, now = 1_000) {
  const offered = offerCityBeginnerMission(preparedAction(mission, mission.id.replace(/[^a-z]/g, '').slice(0, 8) || 'mission'), { storage, now });
  assert.equal(offered.ok, true);
  assert.equal(offered.receipt.missionId, mission.id);
  const opened = openCityBeginnerMission(offered.receipt.id, { storage, now: now + 1 });
  assert.equal(opened.ok, true);
  assert.equal(opened.receipt.state, 'opened');
  return opened.receipt;
}

test('W257 fixes exactly three local-only beginner missions with bounded destinations and outcomes', () => {
  assert.deepEqual(CITY_BEGINNER_MISSIONS.map((mission) => mission.id), [
    'first-project',
    'project-brief',
    'local-ai-self-test'
  ]);
  assert.equal(CITY_PROJECTS_MISSION.destination, '/projects');
  assert.equal(CITY_WORKSPACE_MISSION.destination, '/workspace');
  assert.equal(CITY_LOCAL_AI_MISSION.destination, '/local-ai');
  assert.deepEqual(CITY_PROJECTS_MISSION.outcomes, ['project-created']);
  assert.deepEqual(CITY_WORKSPACE_MISSION.outcomes, ['workspace-brief-created']);
  assert.deepEqual(CITY_LOCAL_AI_MISSION.outcomes, ['local-ai-self-test-passed', 'local-ai-self-test-not-passed']);
  assert.equal(getCityBeginnerMission('missing'), null);
});

test('W257 offers only reviewed matching City actions and receipts contain no project, model, endpoint, or secret content', () => {
  const storage = memoryStorage();
  for (const [index, mission] of CITY_BEGINNER_MISSIONS.entries()) {
    const offered = offerCityBeginnerMission(preparedAction(mission, `valid${index}abc`), { storage, now: 2_000 + index });
    assert.equal(offered.ok, true);
    assert.equal(offered.href, `${mission.destination}?cityMission=${encodeURIComponent(offered.receipt.id)}`);
    assert.equal(offered.receipt.sourceLandmarkId, mission.sourceLandmarkId);
    assert.equal(offered.receipt.destination, mission.destination);
    assert.equal(offered.receipt.outcome, 'pending');
    assert.equal(offered.receipt.requiresUserChoice, true);
    assert.equal(offered.receipt.dataScope, 'opaque-receipt-only-no-user-content');
  }
  const raw = storage.getItem(CITY_WORK_MISSION_STORAGE_KEY) || '';
  assert.doesNotMatch(raw, /launch a secret project|http:\/\/127\.0\.0\.1|model-name|api[_ -]?key|seed phrase|wallet/i);
  const invalid = offerCityBeginnerMission({ ...preparedAction(CITY_PROJECTS_MISSION, 'wrongabc'), landmarkId: 'archive' }, { storage, now: 2_100 });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, 'ineligible-prepared-action');
  assert.equal(offerCityWorkspaceMission(preparedAction(CITY_PROJECTS_MISSION, 'legacyabc'), { storage, now: 2_101 }).ok, false);
});

test('W257 records explicit local Project and Workspace outcomes only after an opened receipt', () => {
  const storage = memoryStorage();
  const project = offerOpen(storage, CITY_PROJECTS_MISSION, 3_000);
  const before = completeCityProjectMission(project.id, { storage, now: 3_002 });
  assert.equal(before.ok, true);
  assert.equal(before.receipt.state, 'completed');
  assert.equal(before.receipt.outcome, 'project-created');

  const workspace = offerOpen(storage, CITY_WORKSPACE_MISSION, 4_000);
  const completed = completeCityWorkspaceMission(workspace.id, { storage, now: 4_002 });
  assert.equal(completed.ok, true);
  assert.equal(completed.receipt.outcome, 'workspace-brief-created');
  assert.equal(completed.receipt.outcomeRecordedAt, completed.receipt.completedAt);

  const invalidOutcome = completeCityBeginnerMission(workspace.id, 'project-created', { storage, now: 4_003 });
  assert.equal(invalidOutcome.ok, false);
  assert.equal(invalidOutcome.reason, 'invalid-mission-outcome');
});

test('W257 records a Local AI self-test result truthfully without treating a detected runtime as a success', () => {
  const storage = memoryStorage();
  const notPassed = offerOpen(storage, CITY_LOCAL_AI_MISSION, 5_000);
  const result = recordCityLocalAiSelfTestOutcome(notPassed.id, false, { storage, now: 5_002 });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.outcome, 'local-ai-self-test-not-passed');
  assert.equal(result.receipt.state, 'completed');
  assert.equal(result.receipt.destination, '/local-ai');
  assert.equal(result.receipt.requiresUserChoice, true);

  const passed = offerOpen(storage, CITY_LOCAL_AI_MISSION, 6_000);
  const pass = recordCityLocalAiSelfTestOutcome(passed.id, true, { storage, now: 6_002 });
  assert.equal(pass.ok, true);
  assert.equal(pass.receipt.outcome, 'local-ai-self-test-passed');
  assert.equal(pass.receipt.outcomeRecordedAt, pass.receipt.completedAt);
});

test('W257 supports explicit safe return, dismissal and expiry without automatic navigation', () => {
  const storage = memoryStorage();
  const project = offerOpen(storage, CITY_PROJECTS_MISSION, 7_000);
  const completed = completeCityProjectMission(project.id, { storage, now: 7_002 });
  const returned = returnCityBeginnerMission(completed.receipt.id, { storage, now: 7_003 });
  assert.equal(returned.ok, true);
  assert.equal(returned.href, `/eoncity?cityMission=${encodeURIComponent(project.id)}`);
  assert.equal(returned.receipt.returnedAt !== null, true);
  assert.equal(readCityBeginnerMissionFromSearch(`?cityMission=${encodeURIComponent(project.id)}`, { storage, now: 7_004 }).ok, true);

  const dismissible = offerOpen(storage, CITY_WORKSPACE_MISSION, 8_000);
  assert.equal(dismissCityBeginnerMission(dismissible.id, { storage, now: 8_002 }).ok, true);
  assert.equal(returnCityBeginnerMission(dismissible.id, { storage, now: 8_003 }).reason, 'invalid-state-transition');

  const expiredOffer = offerCityBeginnerMission(preparedAction(CITY_PROJECTS_MISSION, 'expiredabc'), { storage, now: 9_000 });
  assert.equal(openCityBeginnerMission(expiredOffer.receipt.id, { storage, now: 9_000 + CITY_WORK_MISSION_TTL_MS + 1 }).reason, 'expired-receipt');
  assert.equal(getCityWorkMissionReceipt(expiredOffer.receipt.id, { storage, now: 9_000 + CITY_WORK_MISSION_TTL_MS + 1 }).reason, 'expired-receipt');
});

test('W257 wires each City mode to prepared local missions and each destination to a truthful local outcome', () => {
  const mission = read('assets/js/contracts/city/city-work-mission.js');
  const play = read('assets/js/eon-city-play-station.js');
  const lite = read('assets/js/eon-operator-map.js');
  const visualTour = read('assets/js/eon-city-3d-station.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const localAi = read('assets/js/local-ai/local-ai-page.js');
  assert.match(mission, /CITY_PROJECTS_MISSION/);
  assert.match(mission, /CITY_WORKSPACE_MISSION/);
  assert.match(mission, /CITY_LOCAL_AI_MISSION/);
  assert.doesNotMatch(mission, /fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/);
  for (const surface of [play, lite, visualTour]) {
    assert.match(surface, /offerCityBeginnerMission/);
    assert.match(surface, /openCityBeginnerMission/);
    assert.match(surface, /dismissCityBeginnerMission/);
  }
  assert.match(workspace, /completeCityBeginnerMission/);
  assert.match(workspace, /project-created/);
  assert.match(workspace, /workspace-brief-created/);
  assert.match(workspace, /Return to City Play/);
  assert.match(localAi, /recordCityLocalAiSelfTestOutcome/);
  assert.match(localAi, /Boolean\(result\.ok\)/);
  assert.match(localAi, /City mission recorded a passed self-test locally/);
  assert.match(localAi, /City mission recorded a not-passed self-test locally/);
  assert.match(localAi, /Return to City Play/);
});
