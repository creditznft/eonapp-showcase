import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import {
  createEonCityLivingNexusBabylonRuntime,
  EON_CITY_LIVING_NEXUS_ENTRY_POSES,
  resolveEonCityLivingNexusCellGuideTarget,
  validateEonCityLivingNexusBabylonSummary
} from '../../assets/js/city/eon-city-living-nexus-babylon-runtime.js';
import { buildEonCityLivingNexusExpanse } from '../../assets/js/city/eon-city-living-nexus-hybrid.js';
import { inspectW660rLivingNexusExpanseRenderer } from '../../scripts/w660r-living-nexus-expanse-renderer-gate.mjs';

function createFixture(options = {}) {
  const engine = new NullEngine({ renderWidth: 800, renderHeight: 600, textureSize: 256, deterministicLockstep: true, lockstepMaxSteps: 4 });
  const scene = new Scene(engine);
  const player = new TransformNode('w660r-test-player', scene);
  const runtime = createEonCityLivingNexusBabylonRuntime({ scene, playerAnchor: player, quality: options.quality || 'balanced', reducedMotion: options.reducedMotion === true, seed: 'w660r-test-seed' });
  return { engine, scene, player, runtime, dispose() { runtime.dispose(); scene.dispose(); engine.dispose(); } };
}

test('W660R/W667 renders one deterministic 5×5 streamed Expanse inside the existing scene', () => {
  const fixture = createFixture();
  try {
    const entered = fixture.runtime.setDestination('expanse', { explicitUserAction: true });
    assert.equal(entered.ok, true);
    const summary = fixture.runtime.getSummary();
    assert.equal(summary.residentCellCount, 25);
    assert.equal(summary.renderedCellCount, 25);
    assert.equal(summary.interactiveCellCount, 9);
    assert.equal(summary.horizonCellCount, 16);
    assert.equal(summary.expanseVisible, true);
    assert.equal(summary.oneCanonicalScene, true);
    assert.equal(summary.secondCanvasCreated, false);
    assert.equal(summary.secondRenderLoopCreated, false);
    assert.ok(summary.sceneMeshCount >= 54);
    assert.equal(validateEonCityLivingNexusBabylonSummary(summary).ok, true);
    const cellRoots = fixture.scene.transformNodes.filter((node) => String(node.name).startsWith('w667-expanse-cell-'));
    assert.equal(cellRoots.length, 25);
    assert.ok(fixture.scene.meshes.some((mesh) => String(mesh.name).startsWith('w667-street-x-') && mesh.metadata?.kind === 'living-nexus-expanse-street'));
    assert.ok(fixture.scene.meshes.some((mesh) => String(mesh.name).startsWith('w667-street-z-') && mesh.metadata?.kind === 'living-nexus-expanse-street'));
    assert.ok(fixture.scene.meshes.some((mesh) => mesh.metadata?.kind === 'living-nexus-functional-npc-signal'));
  } finally { fixture.dispose(); }
});

test('W660R/W667 incrementally recycles the bounded visible window when the player crosses a cell', () => {
  const fixture = createFixture({ quality: 'lite', reducedMotion: true });
  try {
    fixture.runtime.setDestination('expanse', { explicitUserAction: true });
    const entry = EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse;
    fixture.player.position.set(entry.x, 0, entry.z);
    fixture.runtime.update({ position: fixture.player.position, now: 1000 });
    const first = fixture.runtime.getSummary();
    fixture.player.position.set(entry.x + 11, 0, entry.z);
    fixture.runtime.update({ position: fixture.player.position, now: 1100 });
    const second = fixture.runtime.getSummary();
    assert.notEqual(second.currentCellId, first.currentCellId);
    assert.equal(second.renderedCellCount, 25);
    assert.equal(second.residentCellCount, 25);
    assert.equal(second.interactiveCellCount, 9);
    assert.equal(second.horizonCellCount, 16);
    assert.ok(second.streamedCellReusedCount > first.streamedCellReusedCount);
    assert.ok(second.streamedCellDisposedCount > first.streamedCellDisposedCount);
    assert.equal(second.routeMarkerCount, 0);
    assert.equal(second.reducedEffects, true);
  } finally { fixture.dispose(); }
});

test('W660R keeps cell guidance explicit and local', () => {
  const expanse = buildEonCityLivingNexusExpanse({ position: EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, seed: 'w660r-test-seed' });
  const target = resolveEonCityLivingNexusCellGuideTarget(expanse.cells[0].id, expanse.cells);
  assert.equal(target.cellId, expanse.cells[0].id);
  assert.equal(target.automaticNavigation, false);
  assert.equal(target.opensRoute, false);
  assert.equal(resolveEonCityLivingNexusCellGuideTarget('cell-999-999', expanse.cells), null);
});

test('W660R My Realm renders only bounded verified transformation ids', () => {
  const fixture = createFixture({ quality: 'cinematic' });
  try {
    const result = fixture.runtime.setTransformations([
      { id: 'project-habitat-online', destination: 'core', location: 'project-district', label: 'Project habitat came online', privateText: 'must not render' },
      { id: 'archive-vault-sealed', destination: 'my-realm', location: 'archive-sanctum', label: 'Archive sanctum sealed' },
      { id: 'archive-vault-sealed', destination: 'my-realm', location: 'duplicate', label: 'Duplicate must collapse' },
      { id: 'invalid id with spaces', destination: 'my-realm', location: 'invalid', label: 'Invalid must drop' }
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.recorded, 2);
    const entered = fixture.runtime.setDestination('my-realm', { explicitUserAction: true });
    assert.equal(entered.ok, true);
    const summary = fixture.runtime.getSummary();
    assert.equal(summary.myRealmVisible, true);
    assert.equal(summary.renderedTransformationCount, 2);
    const pylons = fixture.scene.meshes.filter((mesh) => mesh.metadata?.kind === 'living-nexus-verified-transformation');
    assert.equal(pylons.length, 2);
    assert.ok(pylons.every((mesh) => mesh.metadata.privateContentStored === false && mesh.metadata.rewardIssued === false && mesh.metadata.paymentClaimed === false));
    assert.equal(JSON.stringify(pylons.map((mesh) => mesh.metadata)).includes('must not render'), false);
  } finally { fixture.dispose(); }
});

test('W660R source gate locks one-scene integration and browser-proof boundaries', () => {
  const report = inspectW660rLivingNexusExpanseRenderer();
  assert.equal(report.ok, true, report.checks.filter((entry) => !entry.pass).map((entry) => `${entry.id}: ${entry.detail}`).join('\n'));
});
