import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { buildEonCityLivingNexusRealmPlan, EON_CITY_LIVING_NEXUS_REALM_IDS, getEonCityLivingNexusRealmCatalog, validateEonCityLivingNexusRealmPlan } from '../../assets/js/city/eon-city-living-nexus-realms.js';
import { createEonCityLivingNexusRealmBabylonRenderer } from '../../assets/js/city/eon-city-living-nexus-realm-babylon.js';
import { recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { inspectW660xPremiumNexusRealms } from '../../scripts/w660x-premium-nexus-realms-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

const outcomeByRealm = Object.freeze({
  'archive-noir': { kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local' },
  'living-bio-city': { kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device' },
  'golden-sovereign': { kind: 'orientation-receipt', route: '/eoncity', source: 'city-local' },
  'forge-depths': { kind: 'project-shell', route: '/projects', source: 'projects-local' },
  'orbital-white-city': { kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide' },
  'nexus-ruins': { kind: 'automation-proposal', route: '/automations', source: 'automations-local' }
});

test('W660X all six Realm contracts meet premium authored depth', () => {
  const catalog = getEonCityLivingNexusRealmCatalog();
  assert.deepEqual(catalog.map((entry) => entry.id), EON_CITY_LIVING_NEXUS_REALM_IDS);
  for (const realm of catalog) {
    const plan = buildEonCityLivingNexusRealmPlan(realm.id, { quality: 'balanced', reducedEffects: false, storage: null });
    assert.equal(validateEonCityLivingNexusRealmPlan(plan).ok, true, realm.id);
    assert.equal(plan.premiumAuthoredDepth, true);
    assert.ok(plan.zones.length >= 4);
    assert.ok(plan.discoveries.length >= 3);
    assert.ok(plan.towers.length >= 8);
    assert.ok(plan.specialist?.functional);
    assert.ok(plan.specialist.schedule.length >= 3);
    assert.ok(plan.movementSystem.path.length >= 4);
    assert.ok(plan.narrativeBeats.length >= 3);
    assert.equal(plan.realmReflection.requiresVerifiedTransformation, true);
    assert.equal(plan.realmReflection.active, false);
  }
});

test('W660X every Realm renders specialist, movement, mission, discovery and return systems in one scene', () => {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true });
  const scene = new Scene(engine);
  const parent = new TransformNode('existing-city-scene', scene);
  const renderer = createEonCityLivingNexusRealmBabylonRenderer({ scene, parent });
  try {
    for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
      const result = renderer.render(buildEonCityLivingNexusRealmPlan(id, { quality: 'balanced', storage: null }));
      assert.equal(result.ok, true, id);
      const summary = renderer.getSummary();
      assert.equal(summary.activeRealmId, id);
      assert.equal(summary.premiumAuthoredDepth, true);
      assert.equal(summary.specialistCount, 1);
      assert.ok(summary.movementNodeCount >= 2);
      assert.ok(summary.featureCount >= 5);
      assert.ok(summary.collisionVolumeCount >= 9);
      renderer.update(63000, { reducedEffects: false, mode: 'explore' });
      assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-realm-functional-specialist' || mesh.parent?.metadata?.kind === 'living-nexus-realm-functional-specialist'));
      assert.ok(scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-realm-movement-system'));
    }
  } finally { renderer.dispose(); scene.dispose(); engine.dispose(); }
});

test('W660X reduced-effects keeps authored systems present but static', () => {
  const plan = buildEonCityLivingNexusRealmPlan('living-bio-city', { quality: 'lite', reducedEffects: true, storage: null });
  assert.equal(plan.atmosphere.motionEnabled, false);
  assert.equal(plan.specialist.motionEnabled, false);
  assert.equal(plan.movementSystem.motionEnabled, false);
  assert.equal(validateEonCityLivingNexusRealmPlan(plan).ok, true);
});

test('W660X each My Realm reflection activates only from its matching verified receipt', () => {
  for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
    const storage = memoryStorage();
    const before = buildEonCityLivingNexusRealmPlan(id, { storage });
    assert.equal(before.realmReflection.active, false, id);
    const outcome = outcomeByRealm[id];
    assert.equal(recordEonCityProductiveRpgOutcome({ ...outcome, receiptId: `${id}-receipt`, verified: true }, { storage, now: 100 }).ok, true);
    const after = buildEonCityLivingNexusRealmPlan(id, { storage });
    assert.equal(after.transformation.active, true, id);
    assert.equal(after.realmReflection.active, true, id);
    assert.equal(after.realmReflection.receiptId, `${id}-receipt`, id);
  }
});

test('W660X specialists remain review-first public-safe local features', () => {
  for (const id of EON_CITY_LIVING_NEXUS_REALM_IDS) {
    const plan = buildEonCityLivingNexusRealmPlan(id, { storage: null });
    assert.equal(plan.specialist.reviewFirst, true);
    assert.equal(plan.specialist.privateContentStored, false);
    assert.equal(plan.automaticExecution, false);
    assert.equal(plan.networkRequestCreated, false);
    assert.doesNotMatch(JSON.stringify(plan), /api[_-]?key\s*[:=]|bearer\s+|payment complete|reward earned/i);
  }
});

test('W660X source gate locks premium depth and one-scene boundaries', () => {
  const report = inspectW660xPremiumNexusRealms();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
