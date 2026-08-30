import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonCityLivingNexusController,
  EON_CITY_LIVING_NEXUS_STORAGE_KEY,
  validateEonCityLivingNexusSnapshot
} from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import { recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { inspectW660tLivingNexusAtlasReturn } from '../../scripts/w660t-living-nexus-atlas-return-gate.mjs';
import { EON_CITY_W667_PRACTICAL_WORLD_BOUND } from '../../assets/js/city/w667/eon-city-w667-expanse-world-grammar.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    dump() { return Object.fromEntries(values); }
  };
}

test('W660T records a resident Expanse cell only after explicit review and stores public-safe private Atlas metadata', () => {
  const storage = createMemoryStorage();
  let position = { x: 48, z: 5 };
  const controller = createEonCityLivingNexusController({ storage, getPosition: () => position, seed: 'w660t-atlas-seed' });
  const current = controller.getSnapshot().expanse.currentCellId;
  assert.equal(controller.recordAtlasCell(current).reason, 'explicit-user-action-required');
  const recorded = controller.recordAtlasCell(current, { explicitUserAction: true, now: 1000 });
  assert.equal(recorded.ok, true);
  assert.equal(recorded.snapshot.atlasDiscoveryCount, 1);
  assert.equal(recorded.snapshot.atlasDiscoveries[0].cellId, current);
  assert.equal(recorded.snapshot.atlasDiscoveries[0].sharePermission, 'private');
  assert.equal(recorded.snapshot.atlasDiscoveries[0].privateContentStored, false);
  assert.equal(recorded.snapshot.atlasSharePermission, 'private');
  assert.equal(validateEonCityLivingNexusSnapshot(recorded.snapshot).ok, true);
  const stored = storage.getItem(EON_CITY_LIVING_NEXUS_STORAGE_KEY);
  assert.equal(/project title|prompt content|file content|api[_-]?key|email address|user name|reward earned|payment complete/i.test(stored), false);
  position = { x: 58, z: 5 };
  assert.equal(controller.getSnapshot().expanse.currentCellId === current, false);
  controller.dispose();
});

test('W660T caps the private Atlas at 48 unique deterministic discoveries', () => {
  const storage = createMemoryStorage();
  let position = { x: 0, z: 0 };
  const controller = createEonCityLivingNexusController({ storage, getPosition: () => position, seed: 'w660t-cap-seed' });
  for (let index = 0; index < 55; index += 1) {
    position = { x: (index - 27) * 10 + 1, z: 1 };
    const snapshot = controller.getSnapshot();
    const result = controller.recordAtlasCell(snapshot.expanse.currentCellId, { explicitUserAction: true, now: 2000 + index });
    assert.equal(result.ok, true);
  }
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.atlasDiscoveryCount, 48);
  assert.equal(new Set(snapshot.atlasDiscoveries.map((entry) => `${entry.seedRef}:${entry.cellId}`)).size, 48);
  assert.equal(validateEonCityLivingNexusSnapshot(snapshot).ok, true);
  controller.dispose();
});

test('W660T keeps one bounded return point and requires a separate explicit Nexus return action', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage, getPosition: () => ({ x: 48, z: 5 }), seed: 'w660t-return-seed' });
  const cellId = controller.getSnapshot().expanse.currentCellId;
  assert.equal(controller.setAtlasReturnPoint(cellId).reason, 'explicit-user-action-required');
  const set = controller.setAtlasReturnPoint(cellId, { explicitUserAction: true, now: 5000 });
  assert.equal(set.ok, true);
  assert.equal(set.snapshot.atlasReturnPoint.cellId, cellId);
  assert.ok(Math.abs(set.snapshot.atlasReturnPoint.x) <= EON_CITY_W667_PRACTICAL_WORLD_BOUND);
  assert.ok(Math.abs(set.snapshot.atlasReturnPoint.z) <= EON_CITY_W667_PRACTICAL_WORLD_BOUND);
  assert.equal(set.snapshot.atlasReturnPoint.automaticNavigation, false);
  assert.equal(controller.prepareAtlasReturn().reason, 'explicit-user-action-required');
  const prepared = controller.prepareAtlasReturn({ explicitUserAction: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.returnPoint.cellId, cellId);
  assert.equal(prepared.snapshot.destination, 'expanse');
  assert.equal(prepared.automaticNavigation, false);
  assert.equal(prepared.opensRoute, false);
  assert.equal(prepared.privateContentStored, false);
  assert.equal(controller.clearAtlasReturnPoint({ explicitUserAction: true }).snapshot.atlasReturnPoint, null);
  assert.equal(controller.prepareAtlasReturn({ explicitUserAction: true }).reason, 'atlas-return-point-unavailable');
  controller.dispose();
});

test('W660T keeps Atlas discoveries separate from verified My Realm transformations and never creates rewards', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage, getPosition: () => ({ x: 48, z: 5 }), seed: 'w660t-transform-seed' });
  const cellId = controller.getSnapshot().expanse.currentCellId;
  controller.recordAtlasCell(cellId, { explicitUserAction: true, now: 6000 });
  const outcome = recordEonCityProductiveRpgOutcome({ kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local', receiptId: 'backup-readiness-receipt:w660t', verified: true }, { storage, now: 6100 });
  assert.equal(outcome.ok, true);
  const synced = controller.syncVerifiedProductiveOutcomes({ explicitUserAction: true });
  assert.equal(synced.ok, true);
  assert.equal(synced.recorded, 1);
  assert.equal(synced.snapshot.atlasDiscoveryCount, 1);
  assert.equal(synced.snapshot.transformations.length, 1);
  assert.equal(synced.snapshot.transformations[0].destination, 'my-realm');
  assert.equal(synced.snapshot.myRealmTransformationCount, 1);
  assert.equal(synced.snapshot.rewardIssued, false);
  assert.equal(synced.snapshot.paymentClaimed, false);
  assert.equal(synced.privateContentStored, false);
  assert.equal(synced.rewardIssued, false);
  controller.dispose();
});

test('W660T source gate locks the private Atlas, explicit return and external-proof boundaries', () => {
  const report = inspectW660tLivingNexusAtlasReturn();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
