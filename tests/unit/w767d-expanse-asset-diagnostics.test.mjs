import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildEonExpanseW767DAssetTruthReport,
  serializeEonExpanseW767DAssetTruthReport
} from '../../assets/js/city/w766/eon-expanse-w767d-asset-diagnostics.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const presentedHero = (id, zoneId, variant = 'primary') => ({
  id,
  zoneId,
  assetId: `${id}-asset`,
  variant,
  truth: {
    requestedPath: `/assets/city/w649/${variant}/${id}.123456789abc.glb`,
    visibleMeshCount: 4,
    materialCount: 2,
    worldBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 5, z: 2 } }
  },
  attempts: [{ variant, requestedPath: `/assets/city/w649/${variant}/${id}.123456789abc.glb`, ok: true }]
});

test('W767D produces a release-ready report only after every hero zone is visibly presented', () => {
  const report = buildEonExpanseW767DAssetTruthReport({
    expectedZoneIds: ['gateway-overlook', 'beacon-fields'],
    hero: { assets: [presentedHero('gateway', 'gateway-overlook'), presentedHero('beacon', 'beacon-fields', 'fallback')] },
    npcs: { assetStates: [{ npcId: 'pathfinder-guide', zoneId: 'gateway-overlook', assetAlias: 'player-primary', characterId: 'pathfinder', state: 'loaded', variantPath: '/assets/city/w649/primary/pathfinder.123456789abc.glb', attempts: [] }] },
    activities: { assetStates: [{ id: 'productive:create-expedition', zoneId: 'gateway-overlook', assetId: 'eoncity-forge-workbench', state: 'loaded', path: '/assets/city/w649/primary/workbench.123456789abc.glb', meshCount: 3 }] }
  });
  assert.equal(report.releaseReady, true);
  assert.equal(report.status, 'release-ready');
  assert.equal(report.totals.presented, 4);
  assert.equal(report.totals.authoredFallback, 1);
  assert.equal(report.totals.proceduralFallback, 0);
  assert.deepEqual(report.missingZoneIds, []);
});

test('W767D distinguishes loading proxies from rejected procedural fallbacks', () => {
  const loading = buildEonExpanseW767DAssetTruthReport({
    expectedZoneIds: ['gateway-overlook'],
    hero: { pendingAssets: [{ id: 'gateway', zoneId: 'gateway-overlook', assetId: 'portal' }] },
    npcs: { assetStates: [{ npcId: 'pathfinder-guide', zoneId: 'gateway-overlook', state: 'loading', assetAlias: 'player-primary' }] }
  });
  assert.equal(loading.status, 'loading');
  assert.equal(loading.totals.pending, 2);
  assert.equal(loading.totals.proceduralFallback, 2);
  assert.equal(loading.releaseReady, false);

  const rejected = buildEonExpanseW767DAssetTruthReport({
    expectedZoneIds: ['gateway-overlook'],
    hero: { failures: [{ id: 'gateway', zoneId: 'gateway-overlook', assetId: 'portal', reason: 'visible-meshes-required' }] },
    activities: { assetStates: [{ id: 'lost-worker', zoneId: 'transit-scar', assetId: 'forge-worker', state: 'failed', failureReason: 'asset-load-failed' }] }
  });
  assert.equal(rejected.status, 'repair-required');
  assert.equal(rejected.totals.rejected, 2);
  assert.equal(rejected.totals.proceduralFallback, 2);
  assert.equal(rejected.zoneCoverage[0].fallbackOnly, true);
});

test('W767D export contains bounded asset evidence and strips unrelated private fields', () => {
  const report = buildEonExpanseW767DAssetTruthReport({
    expectedZoneIds: ['gateway-overlook'],
    hero: { assets: [{ ...presentedHero('gateway', 'gateway-overlook'), privatePrompt: 'do not export', apiKey: 'secret' }] },
    npcs: { privatePrompt: 'hidden', assetStates: [] }
  });
  const json = serializeEonExpanseW767DAssetTruthReport(report);
  const parsed = JSON.parse(json);
  assert.equal(parsed.records[0].id, 'gateway');
  assert.equal(parsed.truthBoundary.browserEvidenceStillRequired, true);
  assert.equal(json.includes('do not export'), false);
  assert.equal(json.includes('secret'), false);
});

test('W767D is exposed through the canonical Gateway and runtime without adding a second scene owner', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const gateway = await read('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
  const hero = await read('../../assets/js/city/w766/eon-expanse-w766b-hero-assets.js');
  const npcs = await read('../../assets/js/city/w766/eon-expanse-w766d-npc-transit.js');
  const activities = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  assert.match(gateway, /buildEonExpanseW767DAssetTruthReport/);
  assert.match(gateway, /getAssetTruthReport\(\)/);
  assert.match(runtime, /getExpanseAssetTruthReport\(\)/);
  assert.match(runtime, /exportExpanseAssetTruthReport/);
  assert.match(runtime, /explicit-user-action-required/);
  assert.match(hero, /pendingAssets:/);
  assert.match(npcs, /failureReason: record\.failureReason/);
  assert.match(npcs, /zoneId: record\.npc\.zoneId/);
  assert.match(activities, /assetStates:/);
  assert.match(activities, /zoneId: descriptor\?\.zoneId/);
  for (const source of [gateway, hero, npcs, activities]) {
    assert.doesNotMatch(source, /new Engine\s*\(/);
    assert.doesNotMatch(source, /new Scene\s*\(/);
  }
});
