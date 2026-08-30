import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createEonCityW659fBootGates } from '../../assets/js/city/w659f/eon-city-w659f-boot-recovery.js';
import { createEonCityW659fOverlayManager } from '../../assets/js/city/w659f/eon-city-w659f-overlay-manager.js';
import { EON_CITY_W659F_FUNCTIONAL_ASSETS } from '../../assets/js/city/w659f/eon-city-w659f-functional-asset-manifest.js';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');

test('W659H keeps independent first-frame, core-art and Orientation settlement deadlines', () => {
  let now = 1_000;
  const gates = createEonCityW659fBootGates({ now: () => now, coreAssetDeadlineMs: 5_200, orientationDeadlineMs: 7_600 });
  assert.equal(gates.rendererFirstFrame().playable, true);
  now += 5_300;
  const core = gates.reachCoreDeadline();
  assert.equal(core.coreSettled, true);
  assert.equal(core.coreDegraded, true);
  now += 2_400;
  const orientation = gates.reachOrientationDeadline();
  assert.equal(orientation.orientationSettled, true);
  assert.equal(orientation.orientationDegraded, true);
  assert.equal(orientation.playable, true);
});

test('W659H overlay coordinator is bound by W659N and covers all Productive City panels', async () => {
  const [product, coordinator] = await Promise.all([
    readSource('assets/js/city/w659n/eon-city-w659n-product-layer.js'),
    readSource('assets/js/city/w659h/eon-city-w659h-overlay-coordinator.js')
  ]);
  assert.match(product, /bindEonCityW659hOverlayCoordinator/);
  assert.match(coordinator, /data-w659g-panel/);
  assert.match(coordinator, /data-capture-panel/);
  assert.match(coordinator, /data-membership-panel/);
  assert.match(coordinator, /data-eon-w659n-panel/);
  assert.match(coordinator, /event\.key !== 'Escape'/);
});

test('overlay manager keeps deterministic top order and Escape semantics', () => {
  const manager = createEonCityW659fOverlayManager();
  manager.open('missions');
  manager.open('voice');
  assert.equal(manager.getSnapshot().top, 'voice');
  manager.escape();
  assert.equal(manager.getSnapshot().top, 'missions');
  manager.close('missions');
  assert.equal(manager.getSnapshot().top, null);
});

test('all six optimized functional anchors remain present with review-first actions', () => {
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSETS.length, 6);
  assert.deepEqual(EON_CITY_W659F_FUNCTIONAL_ASSETS.map((entry) => entry.id).sort(), [
    'agent-theatre-relay-console', 'command-signal-totem', 'creator-work-pod',
    'district-arrival-gate', 'eonbot-companion-dock', 'transit-hub-beacon-terminal'
  ]);
  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
    assert.ok(entry.actions.length > 0, entry.id);
    assert.ok(entry.actions.every((action) => action.reviewRequired && !action.autoExecute && !action.autoNavigate), entry.id);
    assert.ok(entry.variants.primary.bytes > 0, entry.id);
    assert.ok(entry.variants.fallback.bytes > 0, entry.id);
  }
});

test('current architecture preserves one Babylon owner and progressive optional local assets', async () => {
  const [access, core, runtime, assets] = await Promise.all([
    readSource('assets/js/city/eon-city-access-station.js'),
    readSource('assets/js/city/eon-city-play-core.js'),
    readSource('assets/js/city/w731/eon-city-w731-command-hub-runtime.js'),
    readSource('assets/js/city/w731/eon-city-w731-local-assets.js')
  ]);
  assert.equal((access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length, 1);
  assert.doesNotMatch(access, /eon-city-runtime-owner\.js/);
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
  assert.match(runtime, /startProgressiveAssets/);
  assert.match(runtime, /eon-city-w731-local-assets\.js/);
  assert.doesNotMatch(assets, /runRenderLoop/);
});
