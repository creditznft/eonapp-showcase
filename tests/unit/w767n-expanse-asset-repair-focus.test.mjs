import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildEonExpanseW767NAssetRepairFocus } from '../../assets/js/city/w766/eon-expanse-w767n-asset-repair-focus.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const repairReport = () => ({
  status: 'repair-required',
  releaseReady: false,
  totals: { rejected: 2, proceduralFallback: 2, pending: 0 },
  missingZoneIds: ['horizon-vault'],
  records: [
    { id: 'navigator', source: 'npc', zoneId: 'archive-ruins', assetId: 'navigator-archive-vault', state: 'fallback-presented', failureReason: 'visible-mesh-count-zero', proceduralFallbackPresented: true, requestedPath: '/private/should-not-leak.glb' },
    { id: 'transit-core', source: 'hero-landmark', zoneId: 'transit-scar', assetId: 'transit-core', state: 'fallback-presented', failureReason: 'grounding-invalid', proceduralFallbackPresented: true }
  ],
  truthBoundary: { browserEvidenceStillRequired: true },
  privatePrompt: 'must not appear'
});

test('W767N ranks missing hero zones before rejected authored presentations and strips paths', () => {
  const focus = buildEonExpanseW767NAssetRepairFocus(repairReport());
  assert.equal(focus.visible, true);
  assert.equal(focus.affectedZoneCount, 3);
  assert.equal(focus.items[0].category, 'zone-landmark-missing');
  assert.equal(focus.items[0].zoneId, 'horizon-vault');
  assert.equal(focus.items.some((item) => item.assetId === 'transit-core'), true);
  assert.equal(focus.exposesRequestedPaths, false);
  assert.equal(JSON.stringify(focus).includes('should-not-leak'), false);
  assert.equal(JSON.stringify(focus).includes('must not appear'), false);
});

test('W767N stays hidden while assets are loading or after release-ready truth', () => {
  const loading = buildEonExpanseW767NAssetRepairFocus({ status: 'loading', releaseReady: false, totals: { pending: 2 }, records: [{ id: 'a', source: 'activity', zoneId: 'gateway-overlook', state: 'pending' }] });
  const ready = buildEonExpanseW767NAssetRepairFocus({ status: 'release-ready', releaseReady: true, totals: {}, records: [] });
  assert.equal(loading.visible, false);
  assert.equal(loading.pendingCount, 2);
  assert.equal(ready.visible, false);
  assert.equal(ready.items.length, 0);
});

test('W767N bounds the repair list and exposes only safe asset identifiers', () => {
  const records = Array.from({ length: 12 }, (_, index) => ({ id: `asset-${index}`, source: 'activity', zoneId: `zone-${index % 3}`, assetId: `asset-${index}`, state: 'fallback-presented', failureReason: 'asset-load-failed', proceduralFallbackPresented: true }));
  const focus = buildEonExpanseW767NAssetRepairFocus({ status: 'repair-required', releaseReady: false, totals: { rejected: 12, proceduralFallback: 12 }, records }, { maxItems: 5 });
  assert.equal(focus.items.length, 5);
  assert.equal(focus.moreCount, 7);
  assert.equal(focus.storesPrivateContent, false);
});

test('W767N feeds the existing mission board without adding another Babylon authority', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /buildEonExpanseW767NAssetRepairFocus/);
  assert.match(runtime, /assetRepairFocus/);
  assert.match(overlay, /asset-repair-focus/);
  assert.match(overlay, /Authored asset repair/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
