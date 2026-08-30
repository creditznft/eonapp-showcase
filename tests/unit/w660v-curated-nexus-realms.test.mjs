import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import { buildEonCityLivingNexusWorldSystemsPlan } from '../../assets/js/city/eon-city-living-nexus-world-systems.js';
import {
  EON_CITY_LIVING_NEXUS_REALM_IDS,
  buildEonCityLivingNexusRealmPlan,
  getEonCityLivingNexusRealmCatalog,
  resolveNearestEonCityLivingNexusRealmFeature,
  validateEonCityLivingNexusRealmPlan
} from '../../assets/js/city/eon-city-living-nexus-realms.js';
import { createEonCityLivingNexusRealmBabylonRenderer } from '../../assets/js/city/eon-city-living-nexus-realm-babylon.js';
import { createEonCityLivingNexusBabylonRuntime } from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { inspectW660vCuratedNexusRealms } from '../../scripts/w660v-curated-nexus-realms-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function findPortalSeed() {
  const expanse = buildEonCityLivingNexusExpanse({ position: { x: 48, z: 5 }, seed: 'w660v-search-base' });
  for (let index = 0; index < 500; index += 1) {
    const seed = `w660v-portal-${index}`;
    const candidateExpanse = buildEonCityLivingNexusExpanse({ position: { x: 48, z: 5 }, seed });
    const plan = buildEonCityLivingNexusWorldSystemsPlan({ cells: candidateExpanse.cells, currentCellId: candidateExpanse.currentCellId, seed, quality: 'balanced' });
    if (plan.rarePortal) return { seed, portal: plan.rarePortal, expanse: candidateExpanse };
  }
  assert.fail(`No deterministic rare portal seed found from ${expanse.currentCellId}`);
}

test('W660V catalog exposes six unique authored Realm identities without a new top-level mode', () => {
  const catalog = getEonCityLivingNexusRealmCatalog();
  assert.equal(catalog.length, 6);
  assert.deepEqual(catalog.map((entry) => entry.id), EON_CITY_LIVING_NEXUS_REALM_IDS);
  assert.equal(new Set(catalog.map((entry) => entry.id)).size, 6);
  for (const realm of catalog) {
    assert.equal(realm.authored, true);
    assert.equal(realm.proceduralGeometry, false);
    assert.ok(realm.nativeRoute.startsWith('/'));
    assert.ok(realm.zones.length >= 3);
    assert.ok(realm.towers.length >= 5);
  }
  const archive = catalog[0];
  assert.equal(archive.label, 'Archive Noir');
  assert.equal(archive.chapter, 'The Silent Index');
  assert.ok(archive.zones.some((entry) => entry.label === 'Memory Stacks'));
  assert.ok(archive.zones.some((entry) => entry.label === 'Echo Bridge'));
});

test('W660V Archive Noir plan is deterministic, authored, review-first and reduced-effects aware', () => {
  const first = buildEonCityLivingNexusRealmPlan('archive-noir', { quality: 'cinematic', reducedEffects: false, storage: null, portalId: 'rare-portal-archive-noir-cell-4-0' });
  const second = buildEonCityLivingNexusRealmPlan('archive-noir', { quality: 'cinematic', reducedEffects: false, storage: null, portalId: 'rare-portal-archive-noir-cell-4-0' });
  assert.deepEqual(first, second);
  assert.equal(first.atmosphere.id, 'noir-rain');
  assert.equal(first.atmosphere.motionEnabled, true);
  assert.equal(first.mission.id, 'vault-recovery');
  assert.equal(first.transformation.active, false);
  assert.equal(first.requiresSeparateEntryConfirmation, true);
  assert.equal(first.requiresSeparateNativeRouteConfirmation, true);
  assert.equal(first.immediateSafeReturn, true);
  assert.equal(validateEonCityLivingNexusRealmPlan(first).ok, true);
  const reduced = buildEonCityLivingNexusRealmPlan('archive-noir', { quality: 'lite', reducedEffects: true, storage: null });
  assert.equal(reduced.atmosphere.motionEnabled, false);
  assert.ok(reduced.towers.length < first.towers.length);
  assert.equal(validateEonCityLivingNexusRealmPlan(reduced).ok, true);
});

test('W660V Realm transformation activates only after a matching verified native receipt', () => {
  const storage = memoryStorage();
  const before = buildEonCityLivingNexusRealmPlan('archive-noir', { storage });
  assert.equal(before.transformation.active, false);
  const rejected = recordEonCityProductiveRpgOutcome({
    kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-receipt', verified: true
  }, { storage, now: 100 });
  assert.equal(rejected.ok, true);
  const stillPending = buildEonCityLivingNexusRealmPlan('archive-noir', { storage });
  assert.equal(stillPending.transformation.active, false);
  const accepted = recordEonCityProductiveRpgOutcome({
    kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local', receiptId: 'archive-receipt', verified: true
  }, { storage, now: 200 });
  assert.equal(accepted.ok, true);
  const after = buildEonCityLivingNexusRealmPlan('archive-noir', { storage });
  assert.equal(after.transformation.active, true);
  assert.equal(after.transformation.receiptId, 'archive-receipt');
  assert.equal(after.transformation.outcomeKind, 'backup-readiness-receipt');
  assert.doesNotMatch(storage.getItem(EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY), /passphrase|project title|prompt|api[_-]?key/i);
});

test('W660V authored Realm renderer uses one existing Babylon scene and emits safe route, skyline, mission and return geometry', () => {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  const parent = new TransformNode('existing-living-nexus-root', scene);
  const renderer = createEonCityLivingNexusRealmBabylonRenderer({ scene, parent });
  try {
    const plan = buildEonCityLivingNexusRealmPlan('archive-noir', { quality: 'balanced', reducedEffects: false, storage: null });
    const result = renderer.render(plan);
    assert.equal(result.ok, true);
    const summary = renderer.getSummary();
    assert.equal(summary.activeRealmId, 'archive-noir');
    assert.equal(summary.authored, true);
    assert.equal(summary.proceduralGeometry, false);
    assert.equal(summary.zoneCount, 4);
    assert.ok(summary.towerCount >= 6);
    assert.ok(summary.collisionVolumeCount >= 6);
    assert.equal(summary.oneCanonicalScene, true);
    assert.equal(summary.secondCanvasCreated, false);
    assert.equal(summary.secondRenderLoopCreated, false);
    assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-authored-realm-floor'));
    assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-authored-realm-tower'));
    assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-realm-mission-terminal'));
    assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-realm-return-portal'));
    const feature = resolveNearestEonCityLivingNexusRealmFeature({ x: 0, z: -67 }, plan);
    assert.equal(feature.kind, 'mission-terminal');
    renderer.update(62000, { reducedEffects: false, mode: 'explore' });
  } finally {
    renderer.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('W660V rare portal enters an authored Realm and exits to the exact Expanse context', () => {
  const { seed } = findPortalSeed();
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  const player = new TransformNode('w660v-player', scene);
  player.position.set(48, 0, 5);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: 'balanced', seed });
  try {
    assert.equal(runtime.setDestination('expanse', { explicitUserAction: true }).ok, true);
    runtime.update({ position: player.position, now: 0 });
    const portal = runtime.getWorldSystemsPlan().rarePortal;
    assert.ok(portal);
    player.position.set(portal.position.x, 0, portal.position.z);
    const nearest = runtime.getNearestRarePortal(player.position);
    assert.equal(nearest.id, portal.id);
    assert.equal(runtime.prepareRealm(portal.realmId, portal.id, { explicitUserAction: false }).reason, 'explicit-user-action-required');
    const prepared = runtime.prepareRealm(portal.realmId, portal.id, { explicitUserAction: true });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.opensRealm, false);
    const entered = runtime.enterRealm(portal.realmId, portal.id, { explicitUserAction: true, returnPoint: { x: portal.position.x, z: portal.position.z, cellId: portal.cellId } });
    assert.equal(entered.ok, true);
    assert.equal(entered.destination, 'realm');
    assert.equal(runtime.getSummary().nexusRealmVisible, true);
    assert.equal(runtime.getSummary().activeRealmId, portal.realmId);
    assert.equal(runtime.getCollisionVolumes().length > 0, true);
    const exited = runtime.exitRealm({ explicitUserAction: true });
    assert.equal(exited.ok, true);
    assert.equal(exited.destination, 'expanse');
    assert.equal(exited.returnPoint.portalId, portal.id);
    assert.equal(exited.entryPose.x, portal.position.x);
    assert.equal(exited.entryPose.z, portal.position.z);
    assert.equal(runtime.getSummary().nexusRealmVisible, false);
  } finally {
    runtime.dispose();
    scene.dispose();
    engine.dispose();
  }
});

test('W660V source gate locks authored Realm, review-first, one-scene and browser-proof boundaries', () => {
  const report = inspectW660vCuratedNexusRealms();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
