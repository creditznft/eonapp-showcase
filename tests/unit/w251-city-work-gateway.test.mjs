import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CITY_WORK_MISSION_SCHEMA,
  CITY_WORK_MISSION_STORAGE_KEY,
  CITY_WORK_MISSION_TTL_MS,
  CITY_WORKSPACE_MISSION,
  completeCityWorkspaceMission,
  dismissCityWorkspaceMission,
  getCityWorkMissionReceipt,
  offerCityWorkspaceMission,
  openCityWorkspaceMission,
  readCityWorkMissionReceipts,
  readCityWorkspaceMissionFromSearch,
  returnCityWorkspaceMission
} from '../../assets/js/contracts/city/city-work-mission.js';

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
function workspaceAction(id = 'city-action-abc123') {
  return { id, destinationId: 'workspace', route: '/workspace', landmarkId: 'archive' };
}

test('W251 creates an opaque Workspace mission receipt only from the reviewed Archive route', () => {
  const storage = memoryStorage();
  const offered = offerCityWorkspaceMission(workspaceAction(), { storage, now: 1_000 });
  assert.equal(offered.ok, true);
  assert.equal(offered.href, `/workspace?cityMission=${encodeURIComponent(offered.receipt.id)}`);
  assert.equal(offered.receipt.schema, CITY_WORK_MISSION_SCHEMA);
  assert.equal(offered.receipt.missionId, 'project-brief');
  assert.equal(offered.receipt.state, 'offered');
  assert.equal(offered.receipt.dataScope, 'opaque-receipt-only-no-user-content');
  assert.deepEqual(Object.keys(offered.receipt).sort(), [
    'completedAt', 'createdAt', 'dataScope', 'destination', 'dismissedAt', 'expiresAt', 'id', 'missionId', 'missionLabel', 'openedAt', 'outcome', 'outcomeRecordedAt', 'purpose', 'requiresUserChoice', 'returnRoute', 'returnedAt', 'schema', 'source', 'sourceActionId', 'sourceLandmarkId', 'sourceLandmarkLabel', 'state'
  ].sort());
  assert.equal(readCityWorkMissionReceipts({ storage }).length, 1);
  assert.equal(CITY_WORK_MISSION_STORAGE_KEY, 'eon:city:work-missions:v1');
});

test('W251 rejects every non-Workspace or non-Archive prepared route', () => {
  const storage = memoryStorage();
  for (const candidate of [
    { ...workspaceAction(), destinationId: 'eonbot-chat', route: '/chat' },
    { ...workspaceAction(), landmarkId: 'command-centre' },
    { ...workspaceAction(), route: '/workspace?unsafe=true' },
    { ...workspaceAction(), id: 'not-a-city-action' }
  ]) {
    assert.equal(offerCityWorkspaceMission(candidate, { storage, now: 2_000 }).reason, 'ineligible-prepared-action');
  }
  assert.equal(readCityWorkMissionReceipts({ storage }).length, 0);
});

test('W251 preserves explicit user choice: offered → opened → completed, with a separate safe return receipt', () => {
  const storage = memoryStorage();
  const offered = offerCityWorkspaceMission(workspaceAction('city-action-def456'), { storage, now: 3_000 });
  assert.equal(completeCityWorkspaceMission(offered.receipt.id, { storage, now: 3_001 }).reason, 'invalid-state-transition');
  const opened = openCityWorkspaceMission(offered.receipt.id, { storage, now: 3_002 });
  assert.equal(opened.ok, true);
  assert.equal(opened.receipt.state, 'opened');
  const completed = completeCityWorkspaceMission(offered.receipt.id, { storage, now: 3_003 });
  assert.equal(completed.ok, true);
  assert.equal(completed.receipt.state, 'completed');
  const returned = returnCityWorkspaceMission(offered.receipt.id, { storage, now: 3_004 });
  assert.equal(returned.ok, true);
  assert.equal(returned.receipt.state, 'completed');
  assert.equal(returned.receipt.returnedAt, new Date(3_004).toISOString());
  assert.equal(returned.href, `/eoncity?cityMission=${encodeURIComponent(offered.receipt.id)}`);
  assert.equal(readCityWorkspaceMissionFromSearch(`?cityMission=${offered.receipt.id}`, { storage, now: 3_005 }).receipt.state, 'completed');
});

test('W251 expiry, dismissal, and receipt lookup fail closed', () => {
  const storage = memoryStorage();
  const offered = offerCityWorkspaceMission(workspaceAction('city-action-ghi789'), { storage, now: 5_000 });
  assert.equal(openCityWorkspaceMission(offered.receipt.id, { storage, now: 5_000 + CITY_WORK_MISSION_TTL_MS }).reason, 'expired-receipt');
  assert.equal(dismissCityWorkspaceMission(offered.receipt.id, { storage, now: 5_001 }).ok, true);
  assert.equal(getCityWorkMissionReceipt('missing', { storage, now: 5_002 }).reason, 'missing-receipt');
  assert.equal(readCityWorkspaceMissionFromSearch('?cityMission=https%3A%2F%2Fevil.example', { storage, now: 5_003 }).reason, 'missing-receipt');
});

test('W251 City and Workspace source present a visible choice, user-created project, and safe return with no automatic navigation', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const workspace = read('assets/js/eon-workspace-pages.js');
  const mission = read('assets/js/contracts/city/city-work-mission.js');
  const css = read('assets/css/eon-workspace-records.css');
  assert.match(station, /offerCityBeginnerMission/);
  assert.match(station, /Mission offered/);
  assert.match(station, /openCityBeginnerMission/);
  assert.match(workspace, /missionLabel/);
  assert.match(workspace, /renderCityBeginnerMission/);
  assert.match(workspace, /Save local/);
  assert.match(workspace, /Return to City Play/);
  assert.match(workspace, /returnCityBeginnerMission/);
  assert.match(workspace, /createProject\(\{ title, summary, status: 'active' \}\)/);
  assert.match(mission, /opaque-receipt-only-no-user-content/);
  assert.doesNotMatch(mission, /fetch\s*\(|XMLHttpRequest|WebSocket|location\.assign|window\.location/);
  assert.doesNotMatch(station, /location\.assign|window\.location/);
  assert.match(css, /eon-city-work-mission/);
  assert.equal(CITY_WORKSPACE_MISSION.destination, '/workspace');
});
