import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST,
  EON_CITY_W659F_FUNCTIONAL_ASSETS,
  EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS,
  getEonCityW659fActionsForDistrict,
  validateEonCityW659fFunctionalAssetManifest
} from '../../assets/js/city/w659f/eon-city-w659f-functional-asset-manifest.js';
import { createEonCityW659fBootGates } from '../../assets/js/city/w659f/eon-city-w659f-boot-recovery.js';
import { createEonCityW659fCollisionRegistry } from '../../assets/js/city/w659f/eon-city-w659f-collision-residency.js';
import { createEonCityW659fEonbotController } from '../../assets/js/city/w659f/eon-city-w659f-eonbot-companion.js';
import { createEonCityW659fTransportRuntime } from '../../assets/js/city/w659f/eon-city-w659f-transport-runtime.js';
import { createEonCityW659fAgentTheatreRegistry } from '../../assets/js/city/w659f/eon-city-w659f-agent-theatre-registry.js';
import { getEonCityW659fNpcRoleCoverage, validateEonCityW659fNpcRoles } from '../../assets/js/city/w659f/eon-city-w659f-npc-role-registry.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W659F manifest is a six-anchor content-hashed authority', () => {
  const check = validateEonCityW659fFunctionalAssetManifest();
  assert.equal(check.ok, true, check.errors.join(','));
  assert.equal(check.count, 6);
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.firstPlayableFrameBlocked, false);
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.liteModeLoadsAllFallbacks, false);
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.liteModeUsesFallbackVariants, true);
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.districtResidencyAllQualities, true);
  assert.deepEqual(EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.residentLimitByQuality, { lite: 4, balanced: 5, cinematic: 6 });
  assert.equal(EON_CITY_W659F_FUNCTIONAL_ASSETS.every((entry) => entry.actions.every((action) => action.reviewRequired && !action.autoExecute && !action.autoNavigate)), true);
  assert.deepEqual([...EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS].sort(), [
    'eoncity-ascension-portal',
    'eoncity-command-chair',
    'eoncity-eonbot-charging-station',
    'eoncity-holo-interface-landmark',
    'eoncity-transit-core'
  ]);
});

test('every shipped W659F GLB matches declared bytes and SHA-256', async () => {
  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
    for (const variantName of ['primary', 'fallback']) {
      const variant = entry.variants[variantName];
      const filePath = path.join(repoRoot, variant.path.replace(/^\//, ''));
      const info = await stat(filePath);
      assert.equal(info.size, variant.bytes, `${entry.id}:${variantName}:bytes`);
      const digest = createHash('sha256').update(await readFile(filePath)).digest('hex');
      assert.equal(digest, variant.sha256, `${entry.id}:${variantName}:sha256`);
    }
  }
});

test('current compact Command Hub owns its strict W731 launch manifest directly', async () => {
  const [core, runtime, manifest] = await Promise.all([
    readFile(path.join(repoRoot, 'assets/js/city/eon-city-play-core.js'), 'utf8'),
    readFile(path.join(repoRoot, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'), 'utf8'),
    readFile(path.join(repoRoot, 'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js'), 'utf8')
  ]);
  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(runtime, /EON_CITY_W731_LAUNCH_ASSET_MANIFEST/);
  assert.match(runtime, /eon-city-w731-local-assets\.js/);
  assert.match(manifest, /firstFrame:[\s\S]*requiredGlbCount: 0/);
  assert.match(manifest, /loadAllAtBoot: false/);
  assert.doesNotMatch(core, /w659n\/eon-city-w659n-product-layer/);
});

test('first rendered frame becomes playable without waiting for optional authored assets', () => {
  let clock = 1000;
  const gates = createEonCityW659fBootGates({ now: () => clock, coreAssetDeadlineMs: 5200 });
  const first = gates.rendererFirstFrame();
  assert.equal(first.playable, true);
  assert.equal(first.playableReported, true);
  assert.equal(first.coreSettled, false);
  clock += 5300;
  const deadline = gates.reachCoreDeadline();
  assert.equal(deadline.playable, true);
  assert.equal(deadline.coreSettled, true);
  assert.equal(deadline.coreDegraded, true);
});

test('collision registry keeps fixed volumes while resident assets come and go', () => {
  const registry = createEonCityW659fCollisionRegistry({ fixedVolumes: [{ id: 'fixed', type: 'circle', x: 0, z: 0, radius: 1 }] });
  registry.registerResident('pod', [{ id: 'shell', type: 'box', x: 2, z: 2, halfWidth: 1, halfDepth: 0.5 }]);
  assert.equal(registry.getVolumes().length, 2);
  assert.equal(registry.getSummary().fixedCount, 1);
  assert.equal(registry.unregisterResident('pod'), 1);
  assert.deepEqual(registry.getVolumes().map((entry) => entry.id), ['fixed']);
});

test('EONBOT dock and explore states require an explicit user action', () => {
  let clock = 2000;
  const controller = createEonCityW659fEonbotController({ now: () => clock });
  assert.equal(controller.setState('dock').ok, false);
  const dock = controller.setState('dock', { explicitUserAction: true, source: 'visible-dock-control' });
  assert.equal(dock.ok, true);
  assert.equal(controller.getSnapshot().state, 'dock');
  assert.equal(controller.getSnapshot().autonomousAgent, false);
  const speak = controller.setState('speak', { explicitUserAction: true, durationMs: 500 });
  assert.equal(speak.ok, true);
  clock += 600;
  assert.equal(controller.getSnapshot().state, 'return');
  clock += 1000;
  assert.equal(controller.getSnapshot().state, 'follow');
});

test('district travel has separate review and confirmation gates plus a truthful receipt', () => {
  let clock = 5000;
  const runtime = createEonCityW659fTransportRuntime({ now: () => clock });
  assert.equal(runtime.request('creator-atrium').ok, false);
  const review = runtime.request('creator-atrium', { explicitUserAction: true });
  assert.equal(review.ok, true);
  assert.equal(review.reviewRequired, true);
  assert.equal(review.autoTravel, false);
  assert.equal(runtime.confirm(review.token).ok, false);
  clock += 10;
  const travel = runtime.confirm(review.token, { explicitUserAction: true });
  assert.equal(travel.ok, true);
  assert.equal(travel.receipt.destinationId, 'creator-atrium');
  assert.equal(travel.receipt.routeOpened, false);
  assert.equal(travel.receipt.workExecuted, false);
});

test('Agent Theatre normalizes unknown or invented states instead of fabricating progress', () => {
  const registry = createEonCityW659fAgentTheatreRegistry();
  const snapshot = registry.replace([
    { id: 'real-job', state: 'running', progress: 0.35, source: 'job-receipt' },
    { id: 'marketing-claim', state: 'thinking-magically', progress: 0.99 }
  ]);
  assert.equal(snapshot.signals[0].status, 'running');
  assert.equal(snapshot.signals[0].progress, 0.35);
  assert.equal(snapshot.signals[1].status, 'idle');
  assert.equal(snapshot.signals[1].progress, null);
  assert.equal(snapshot.fabricatedProgress, false);
});

test('functional district actions connect the new models to real panels and routes', () => {
  const transit = getEonCityW659fActionsForDistrict('transit-network');
  assert.equal(transit.some((entry) => entry.panel === 'travel-map'), true);
  const creator = getEonCityW659fActionsForDistrict('creator-atrium');
  assert.deepEqual(creator.filter((entry) => entry.route).map((entry) => entry.route).sort(), ['/projects', '/workspace']);
  const theatre = getEonCityW659fActionsForDistrict('agent-theatre');
  assert.equal(theatre.some((entry) => entry.panel === 'command-room'), true);
});

test('all fourteen effective character assets have canonical local review-first roles', () => {
  const check = validateEonCityW659fNpcRoles();
  const coverage = getEonCityW659fNpcRoleCoverage();
  assert.equal(check.ok, true, check.errors.join(','));
  assert.equal(check.roleCount, 13);
  assert.equal(coverage.effectiveCharacterCount, 14);
  assert.equal(coverage.coveredCharacterCount, 14);
  assert.deepEqual(coverage.missingAssetIds, []);
});

test('active source wires the W731 Command Hub after authorization without reviving legacy world owners', async () => {
  const [core, runtime, access] = await Promise.all([
    readFile(path.join(repoRoot, 'assets/js/city/eon-city-play-core.js'), 'utf8'),
    readFile(path.join(repoRoot, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'), 'utf8'),
    readFile(path.join(repoRoot, 'assets/js/city/eon-city-access-station.js'), 'utf8')
  ]);
  assert.match(core, /mountBabylonCityProof/);
  assert.match(runtime, /CITY_FIRST_PLAYABLE_FRAME/);
  assert.match(runtime, /startProgressiveAssets/);
  assert.match(runtime, /openSurfaceForStation/);
  assert.match(runtime, /oneEngine: true/);
  assert.match(runtime, /oldDistrictBeltsActive: false/);
  assert.match(runtime, /expanseActive: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'/);
  assert.doesNotMatch(access, /eon-city-runtime-owner\.js/);
  assert.doesNotMatch(core, /w649-district-runtime|w659n-product-layer|living-nexus-babylon-runtime/);
});
