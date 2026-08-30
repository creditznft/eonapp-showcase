import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_LIVING_NEXUS_DESTINATIONS,
  buildEonCityLivingNexusExpanse,
  createEonCityLivingNexusController,
  getEonCityLivingNexusSnapshot,
  validateEonCityLivingNexusSnapshot
} from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import { recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { inspectW660pLivingNexusHybrid } from '../../scripts/w660p-living-nexus-hybrid-gate.mjs';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('W667 expands W660P into a deterministic connected 5×5 streamed Expanse with a 3×3 interaction neighbourhood', () => {
  const first = buildEonCityLivingNexusExpanse({ position: { x: 14.2, z: -6.4 }, seed: 'owner-seed' });
  const second = buildEonCityLivingNexusExpanse({ position: { x: 14.2, z: -6.4 }, seed: 'owner-seed' });
  assert.deepEqual(first, second);
  assert.equal(first.cellCount, 25);
  assert.equal(first.visibleCellCount, 25);
  assert.equal(first.interactiveCellCount, 9);
  assert.equal(first.horizonCellCount, 16);
  assert.equal(first.visibleHardBorder, false);
  assert.equal(first.incrementalResidency, true);
  assert.equal(first.allRoadsConnected, true);
  assert.equal(first.cells.filter((entry) => entry.role === 'current').length, 1);
  for (const cell of first.cells) {
    assert.equal(cell.roadGrammar.connected, true);
    assert.equal(cell.safeNavigationRoute.connectedToAllCardinalNeighbours, true);
    assert.equal(cell.safeNavigationRoute.autoNavigation, false);
    assert.ok(cell.visualIdentity.id);
    assert.ok(cell.buildingComposition.length >= 1);
    assert.ok(cell.activityLayer);
    assert.ok(cell.gameplayPurpose);
    assert.equal(cell.containsUserData, false);
    assert.equal(cell.remoteNetwork, false);
  }
});

test('W660P exposes Core, Expanse and My Realm with Focus and Explore modes but no parallel runtime', () => {
  const snapshot = getEonCityLivingNexusSnapshot({ storage: memoryStorage(), position: { x: 0, z: 0 } });
  assert.deepEqual(EON_CITY_LIVING_NEXUS_DESTINATIONS.map((entry) => entry.id), ['core', 'expanse', 'my-realm']);
  assert.equal(snapshot.mode, 'explore');
  assert.equal(snapshot.destination, 'core');
  assert.equal(snapshot.secondAssistantCreated, false);
  assert.equal(snapshot.secondProjectStoreCreated, false);
  assert.equal(snapshot.secondTaskStoreCreated, false);
  assert.equal(snapshot.secondRenderLoopCreated, false);
  assert.equal(snapshot.secondCanvasCreated, false);
  assert.equal(validateEonCityLivingNexusSnapshot(snapshot).ok, true);
});

test('W660P mode, destination and cell changes require explicit user action', () => {
  const storage = memoryStorage();
  const controller = createEonCityLivingNexusController({ storage, getPosition: () => ({ x: 22, z: 18 }) });
  assert.equal(controller.setMode('focus').ok, false);
  assert.equal(controller.setMode('focus', { explicitUserAction: true }).snapshot.mode, 'focus');
  assert.equal(controller.selectDestination('expanse').ok, false);
  assert.equal(controller.selectDestination('expanse', { explicitUserAction: true }).snapshot.destination, 'expanse');
  const cellId = controller.getSnapshot().expanse.cells[0].id;
  assert.equal(controller.selectCell(cellId).ok, false);
  assert.equal(controller.selectCell(cellId, { explicitUserAction: true }).snapshot.selectedCellId, cellId);
  assert.equal(controller.selectCell('cell-500-500', { explicitUserAction: true }).ok, false);
});

test('W660P transforms the world only from verified bounded productive outcomes', () => {
  const storage = memoryStorage();
  const controller = createEonCityLivingNexusController({ storage });
  const rejected = controller.recordVerifiedOutcome({ kind: 'project-shell', receiptId: 'project:1', verifiedAt: 1700000000000, verified: false }, { explicitUserAction: true });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'verified-bounded-outcome-required');

  const receipt = recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project:verified:1', verified: true, verifiedAt: 1700000000100 }, { storage, now: 1700000000100 });
  assert.equal(receipt.ok, true);
  const synced = controller.syncVerifiedProductiveOutcomes({ explicitUserAction: true });
  assert.equal(synced.ok, true);
  assert.equal(synced.recorded, 1);
  assert.equal(synced.snapshot.atlasEntries.length, 1);
  assert.equal(synced.snapshot.transformations[0].id, 'project-habitat-online');
  assert.equal(synced.snapshot.transformations[0].privateContentStored, false);
  assert.equal(synced.snapshot.rewardIssued, false);
  assert.equal(synced.snapshot.paymentClaimed, false);
  const duplicate = controller.syncVerifiedProductiveOutcomes({ explicitUserAction: true });
  assert.equal(duplicate.recorded, 0);
});

test('W660P source gate locks the roadmap, runtime, UI and release governance repair', () => {
  const report = inspectW660pLivingNexusHybrid();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
