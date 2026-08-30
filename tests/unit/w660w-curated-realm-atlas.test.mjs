import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonCityLivingNexusController,
  EON_CITY_LIVING_NEXUS_STORAGE_KEY,
  validateEonCityLivingNexusSnapshot
} from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import { inspectW660wCuratedRealmAtlas } from '../../scripts/w660w-curated-realm-atlas-gate.mjs';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W660W records a Realm visit only after explicit confirmed entry metadata', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage });
  assert.equal(controller.recordRealmVisit('archive-noir', 'realm-portal-01').reason, 'explicit-user-action-required');
  const result = controller.recordRealmVisit('archive-noir', 'realm-portal-01', { explicitUserAction: true, now: 1000 });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.realmVisitCount, 1);
  assert.deepEqual(result.snapshot.realmVisits[0], {
    realmId: 'archive-noir', portalId: 'realm-portal-01', enteredAt: 1000, privateContentStored: false, sharePermission: 'private'
  });
  assert.equal(validateEonCityLivingNexusSnapshot(result.snapshot).ok, true);
  controller.dispose();
});

test('W660W records only explicit public-safe authored discovery metadata', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage });
  assert.equal(controller.recordRealmDiscovery('archive-noir', { id: 'archive-echo-01', label: 'First Archive Echo' }).reason, 'explicit-user-action-required');
  const result = controller.recordRealmDiscovery('archive-noir', { id: 'archive-echo-01', label: 'First Archive Echo' }, { explicitUserAction: true, now: 1100 });
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.realmDiscoveryCount, 1);
  assert.equal(result.snapshot.realmDiscoveries[0].realmId, 'archive-noir');
  assert.equal(result.snapshot.realmDiscoveries[0].discoveryId, 'archive-echo-01');
  assert.equal(result.snapshot.realmDiscoveries[0].sharePermission, 'private');
  assert.equal(result.snapshot.realmDiscoveries[0].privateContentStored, false);
  const stored = storage.getItem(EON_CITY_LIVING_NEXUS_STORAGE_KEY);
  assert.equal(/project title|prompt content|file content|api[_-]?key|email address|user name|reward earned|payment complete/i.test(stored), false);
  controller.dispose();
});

test('W660W deduplicates Realm memories and updates the latest explicit record', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage });
  controller.recordRealmVisit('archive-noir', 'portal-a', { explicitUserAction: true, now: 1000 });
  controller.recordRealmVisit('archive-noir', 'portal-b', { explicitUserAction: true, now: 2000 });
  controller.recordRealmDiscovery('archive-noir', { id: 'archive-echo-01', label: 'First Archive Echo' }, { explicitUserAction: true, now: 1100 });
  controller.recordRealmDiscovery('archive-noir', { id: 'archive-echo-01', label: 'First Archive Echo' }, { explicitUserAction: true, now: 2200 });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.realmVisitCount, 1);
  assert.equal(snapshot.realmVisits[0].portalId, 'portal-b');
  assert.equal(snapshot.realmVisits[0].enteredAt, 2000);
  assert.equal(snapshot.realmDiscoveryCount, 1);
  assert.equal(snapshot.realmDiscoveries[0].discoveredAt, 2200);
  controller.dispose();
});

test('W660W caps private Realm Atlas memory at 12 visits and 24 discoveries', () => {
  const storage = createMemoryStorage();
  const controller = createEonCityLivingNexusController({ storage });
  for (let index = 0; index < 18; index += 1) controller.recordRealmVisit(`realm-${index}`, `portal-${index}`, { explicitUserAction: true, now: 3000 + index });
  for (let index = 0; index < 31; index += 1) controller.recordRealmDiscovery('archive-noir', { id: `discovery-${index}`, label: `Discovery ${index}` }, { explicitUserAction: true, now: 4000 + index });
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.realmVisitCount, 12);
  assert.equal(snapshot.realmDiscoveryCount, 24);
  assert.equal(validateEonCityLivingNexusSnapshot(snapshot).ok, true);
  controller.dispose();
});

test('W660W source gate locks the one-store private Realm expedition loop', () => {
  const report = inspectW660wCuratedRealmAtlas();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
