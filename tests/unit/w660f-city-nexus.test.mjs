import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';

import {
  EON_CITY_W660_NEXUS_DISTRICT_IDS,
  EON_CITY_W660_NEXUS_STATIONS,
  validateEonCityW660NexusStations
} from '../../assets/js/city/w660/eon-city-w660-nexus-stations.js';
import { createEonCityW660NexusHologram } from '../../assets/js/city/w660/eon-city-w660-nexus-hologram.js';

function fakeAdapter(initial = {}) {
  let snapshot = {
    eonbot: { state: 'ready' },
    route: { mode: 'guide', privateOnDevice: false },
    approval: { pending: false },
    ...initial
  };
  const listeners = new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    start: () => ({ ok: true }),
    emit(next) { snapshot = next; for (const listener of listeners) listener(snapshot); },
    dispose() {}
  };
}

test('W660F station authority contains nine purpose-bound review-first placements', () => {
  const check = validateEonCityW660NexusStations();
  assert.equal(check.ok, true, check.errors.join(','));
  assert.equal(check.count, 9);
  assert.equal(check.districtCount, 9);
  assert.equal(new Set(EON_CITY_W660_NEXUS_STATIONS.map((entry) => entry.id)).size, 9);
  assert.ok(EON_CITY_W660_NEXUS_STATIONS.every((entry) => entry.actions.length >= 2));
  assert.ok(EON_CITY_W660_NEXUS_STATIONS.every((entry) => entry.actions.every((action) => action.reviewRequired && !action.autoExecute && !action.autoNavigate)));
  assert.deepEqual(
    [...new Set(EON_CITY_W660_NEXUS_STATIONS.map((entry) => entry.districtId))].sort(),
    [...EON_CITY_W660_NEXUS_DISTRICT_IDS].sort()
  );
  assert.ok(EON_CITY_W660_NEXUS_DISTRICT_IDS.every((districtId) => EON_CITY_W660_NEXUS_STATIONS.filter((entry) => entry.districtId === districtId).length === 1));
  assert.ok(['creator-command-nexus', 'eonbot-dock-nexus', 'forge-workflow-nexus', 'project-workstation-nexus'].every((id) => EON_CITY_W660_NEXUS_STATIONS.some((entry) => entry.id === id)));
  assert.equal(new Set(EON_CITY_W660_NEXUS_STATIONS.map((entry) => entry.districtId)).size, 9);
  assert.ok(EON_CITY_W660_NEXUS_STATIONS.every((entry) => EON_CITY_W660_NEXUS_STATIONS.filter((candidate) => candidate.districtId === entry.districtId).length === 1));
});

test('W660F Babylon layer renders nine stations without owning a render loop or second store', () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const adapter = fakeAdapter();
  const layer = createEonCityW660NexusHologram({ scene, quality: 'cinematic', adapter, environment: {} });
  const start = layer.start();
  assert.equal(start.ok, true);
  assert.equal(start.stationCount, 9);
  const summary = layer.getSummary();
  assert.equal(summary.stationCount, 9);
  assert.equal(summary.renderedStationIds.length, 9);
  assert.equal(summary.visibleStationIds.length, 0);
  assert.equal(summary.visibilityRadius, 11.5);
  assert.ok(summary.interactionRadius < summary.visibilityRadius);
  assert.match(summary.visualProfile, /district-landmark-orb/);
  assert.match(summary.visualProfile, /overhead-beacon/);
  assert.equal(summary.overheadBeacon, true);
  assert.equal(summary.ownsRenderLoop, false);
  assert.equal(summary.ownsConversation, false);
  assert.equal(summary.ownsProjectStore, false);
  assert.equal(summary.secondCanvas, false);
  assert.equal(summary.glbDependency, false);
  layer.dispose();
  scene.dispose();
  engine.dispose();
});

test('W660F uses the same privacy-projected EONBOT state and exposes nearest review station', () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const adapter = fakeAdapter();
  const layer = createEonCityW660NexusHologram({ scene, reducedMotion: true, adapter, environment: {} });
  layer.start();
  adapter.emit({ eonbot: { state: 'waiting-approval' }, route: { mode: 'local', privateOnDevice: true }, approval: { pending: true } });
  const nearest = layer.update({ x: -6.65, z: 5.9 }, 0.016);
  assert.equal(nearest.station.id, 'eonbot-dock-nexus');
  assert.equal(nearest.inRange, true);
  const summary = layer.getSummary();
  assert.ok(summary.visibleStationIds.includes('eonbot-dock-nexus'));
  assert.ok(summary.visibleStationIds.length <= 5);
  assert.equal(summary.state, 'waiting-approval');
  assert.equal(summary.privateOnDevice, true);
  assert.equal(summary.approvalPending, true);
  layer.dispose();
  scene.dispose();
  engine.dispose();
});
