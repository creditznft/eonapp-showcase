import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA,
  getEonCityW649VisualIntegrationPolicy,
  integrateEonCityW649Container
} from '../../assets/js/city/w649/eon-city-w649-visual-integration.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

function createMesh({ vertices = 240, skinned = false, material = null } = {}) {
  return {
    name: 'premium-test-mesh',
    isPickable: true,
    checkCollisions: true,
    receiveShadows: false,
    skeleton: skinned ? {} : null,
    material,
    metadata: { authored: true },
    getTotalVertices: () => vertices
  };
}

test('W651 preserves authored GLB materials while applying bounded EON Noir scene-fit settings', () => {
  const material = { name: 'authored-pbr', maxSimultaneousLights: 12, metallic: 0.7, roughness: 0.32 };
  const mesh = createMesh({ material, skinned: true });
  const container = { meshes: [mesh], materials: [material] };
  const integration = integrateEonCityW649Container({ scene: { lights: [] }, container, quality: 'balanced', assetId: 'pathfinder', role: 'controllable-player' });
  const summary = integration.getSummary();
  assert.equal(summary.schema, EON_CITY_W649_VISUAL_INTEGRATION_SCHEMA);
  assert.equal(mesh.isPickable, false);
  assert.equal(mesh.checkCollisions, false);
  assert.equal(mesh.receiveShadows, false);
  assert.equal(material.maxSimultaneousLights, 4);
  assert.equal(material.metallic, 0.7);
  assert.equal(material.roughness, 0.32);
  assert.equal(mesh.material, material);
  assert.equal(mesh.metadata.authored, true);
  assert.equal(summary.authoredMaterialsPreserved, true);
  assert.equal(summary.skinnedMeshCount, 1);
});

test('W651 permits exactly the explicit cinematic shadow owner and releases it on disposal', () => {
  const added = [];
  const removed = [];
  const shadowGenerator = {
    addShadowCaster(mesh) { added.push(mesh); },
    removeShadowCaster(mesh) { removed.push(mesh); }
  };
  const material = { maxSimultaneousLights: 2 };
  const player = createMesh({ material });
  const integration = integrateEonCityW649Container({
    scene: { lights: [{ getShadowGenerator: () => shadowGenerator }] },
    container: { meshes: [player], materials: [material] },
    quality: 'cinematic',
    assetId: 'pathfinder-prime',
    role: 'controllable-player',
    allowShadowCaster: true
  });
  assert.equal(player.receiveShadows, true);
  assert.equal(material.maxSimultaneousLights, 6);
  assert.equal(player.metadata.eonCityShadowCasterEligible, true);
  assert.deepEqual(added, [player]);
  assert.equal(integration.getSummary().registeredShadowCasterCount, 1);
  integration.dispose();
  assert.deepEqual(removed, [player]);
  assert.equal(integration.getSummary().disposed, true);
});

test('W651 district visuals receive cinematic shadows without becoming dynamic casters', () => {
  let addCalls = 0;
  const mesh = createMesh({ material: { maxSimultaneousLights: 9 } });
  const integration = integrateEonCityW649Container({
    scene: { lights: [{ getShadowGenerator: () => ({ addShadowCaster() { addCalls += 1; } }) }] },
    container: { meshes: [mesh], materials: [mesh.material] },
    quality: 'cinematic',
    assetId: 'forge-basilica',
    role: 'district-landmark',
    allowShadowCaster: false
  });
  assert.equal(mesh.receiveShadows, true);
  assert.equal(mesh.metadata.eonCityShadowCasterEligible, false);
  assert.equal(addCalls, 0);
  assert.equal(integration.getSummary().shadowCasterAllowed, false);
});

test('W651 classic procedural renderer and premium bridge share one bounded art direction', () => {
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const core = read('assets/js/city/w649/eon-city-w649-babylon-core-runtime.js');
  const districts = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  const policy = getEonCityW649VisualIntegrationPolicy();
  assert.match(renderer, /TONEMAPPING_ACES/);
  assert.match(renderer, /new PBRMetallicRoughnessMaterial/);
  assert.match(renderer, /Scene\.FOGMODE_EXP2/);
  assert.match(renderer, /new GlowLayer/);
  assert.match(renderer, /new ShadowGenerator/);
  assert.match(renderer, /eonCityShadowCasterEligible/);
  assert.match(core, /integrateEonCityW649Container/);
  assert.match(districts, /integrateEonCityW649Container/);
  assert.equal(policy.materialReplacementAllowed, false);
  assert.equal(policy.cinematicDynamicShadowOwners, 1);
  assert.equal(policy.headedVisualApprovalRequired, true);
});
