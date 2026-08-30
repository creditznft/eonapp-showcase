import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonCityW649PreviewEvidenceBridge } from '../../assets/js/eon-city-play-station.js';

test('W649J preview bridge is absent unless preview evidence mode explicitly enables it', () => {
  assert.equal(createEonCityW649PreviewEvidenceBridge({ enabled: false }), null);
});

test('W649J preview bridge exposes only read/evidence controls and no route execution', async () => {
  const calls = [];
  const runtime = {
    getW649CoreSummary: () => ({ player: { loaded: true, assetId: 'eoncity-pathfinder-prime-11clips' } }),
    getW649DistrictSummary: () => ({ activeDistrictId: 'orientation-hall', residentDistrictCount: 1 }),
    enterW649District: async (districtId, options) => { calls.push(['district', districtId, options.reason]); return { ok: true, districtId, loadedCount: 3 }; },
    requestW649PlayerState: (state) => { calls.push(['player', state]); return { ok: true, state }; },
    requestW649NpcState: (assetId, state) => { calls.push(['npc', assetId, state]); return { ok: true, assetId, state }; },
    getW649DistrictActions: (districtId) => [{ id: `${districtId}-action`, kind: 'route', route: '/projects' }]
  };
  const bridge = createEonCityW649PreviewEvidenceBridge({ enabled: true, getRuntime: () => runtime });
  assert.equal(bridge.districtIds.length, 8);
  assert.equal(bridge.getSnapshot().ready, true);
  assert.equal(bridge.getSnapshot().routeExecutionAllowed, false);
  assert.equal(bridge.getSnapshot().privateDataIncluded, false);
  assert.equal((await bridge.enterDistrict('forge-basilica')).ok, true);
  assert.equal((await bridge.enterDistrict('unknown')).ok, false);
  assert.equal(bridge.requestPlayerState('walk').ok, true);
  assert.equal(bridge.requestNpcState('eon-x1-worker-9clips', 'interact').ok, true);
  assert.equal(bridge.getDistrictActions('orientation-hall')[0].route, '/projects');
  assert.deepEqual(calls, [
    ['district', 'forge-basilica', 'preview-evidence-explicit'],
    ['player', 'walk'],
    ['npc', 'eon-x1-worker-9clips', 'interact']
  ]);
});

test('W649J preview bridge reports a not-ready runtime without fabricating evidence', async () => {
  const bridge = createEonCityW649PreviewEvidenceBridge({ enabled: true, getRuntime: () => null });
  assert.equal(bridge.getSnapshot().ready, false);
  assert.equal((await bridge.enterDistrict('orientation-hall')).reason, 'w649-runtime-not-ready');
  assert.equal(bridge.requestPlayerState('walk').reason, 'w649-runtime-not-ready');
});
