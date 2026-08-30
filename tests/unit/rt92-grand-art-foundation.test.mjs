import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_CITY_RT92_VISUAL_LAYERS, EON_CITY_RT92_MATERIAL_FAMILIES, EON_CITY_RT92_WORLD_IDENTITIES, buildEonCityRt92GrandArtPlan, validateEonCityRt92GrandArtPlan } from '../../assets/js/city/rt92/eon-city-rt92-grand-art-bible.js';
import { createEonCityRt92SharedArtRuntime } from '../../assets/js/city/rt92/eon-city-rt92-shared-art-runtime.js';
import { RT92_GRAND_MASTER_ART_CONTRACT, validateRt92GrandMasterArtContract } from '../../config/rt92-grand-master-art-contract.mjs';

test('RT92 Grand Art contract locks four worlds, fifteen layers and twelve material families', () => {
  assert.equal(validateRt92GrandMasterArtContract().ok, true);
  assert.equal(RT92_GRAND_MASTER_ART_CONTRACT.worlds.length, 4);
  assert.equal(EON_CITY_RT92_VISUAL_LAYERS.length, 15);
  assert.equal(EON_CITY_RT92_MATERIAL_FAMILIES.length, 12);
  assert.equal(Object.keys(EON_CITY_RT92_WORLD_IDENTITIES).length, 4);
});

test('RT92 Grand Art quality plans preserve sharpness and zero first-frame binary delta', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityRt92GrandArtPlan({ quality });
    const validation = validateEonCityRt92GrandArtPlan(plan);
    assert.equal(validation.ok, true, validation.errors.join(','));
    assert.equal(plan.binaryBudget.firstFrameNewBinaryBytes, 0);
    assert.ok(plan.sharpness.neutralStructureShareMin >= 0.7);
    assert.ok(plan.sharpness.emissiveShareMax <= 0.1);
    assert.equal(plan.streaming.hiddenWorldsSuspended, true);
  }
});

test('RT92 world identities are visually complete rather than neon-only labels', () => {
  for (const [worldId, identity] of Object.entries(EON_CITY_RT92_WORLD_IDENTITIES)) {
    assert.equal(identity.requiredLayers.length, 15, worldId);
    assert.ok(identity.architecture.length >= 4, worldId);
    assert.ok(identity.motion.length >= 4, worldId);
    assert.ok(identity.emissionShareMax <= 0.1, worldId);
    assert.ok(identity.primarySilhouette.length > 8, worldId);
  }
});

test('RT92 shared art runtime changes presentation policy without taking engine or network authority', () => {
  const runtime = createEonCityRt92SharedArtRuntime({ quality: 'balanced' });
  for (const worldId of ['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']) {
    const state = runtime.setActiveWorld(worldId, { reason: 'test' });
    assert.equal(state.ok, true);
    assert.equal(state.snapshot.activeWorldId, worldId);
    assert.equal(runtime.getWorldDirective(worldId).visibleLayerIds.length, 15);
  }
  const snapshot = runtime.getSnapshot();
  assert.equal(snapshot.ownsBabylonEngine, false);
  assert.equal(snapshot.ownsScene, false);
  assert.equal(snapshot.ownsRenderLoop, false);
  assert.equal(snapshot.ownsProgression, false);
  assert.equal(snapshot.networkRequestCreated, false);
});

import fs from 'node:fs';

test('RT92 art policy is wired into the maintained W731 world authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /buildEonCityRt92GrandArtPlan/);
  assert.match(source, /createEonCityRt92SharedArtRuntime/);
  assert.match(source, /setCurrentWorld\('command-hub'/);
  assert.match(source, /setCurrentWorld\('signal-frontier'/);
  assert.match(source, /setCurrentWorld\('storm-sector'/);
  assert.match(source, /setCurrentWorld\('my-frontier'/);
  assert.match(source, /rt92ArtRuntime\.dispose/);
});
