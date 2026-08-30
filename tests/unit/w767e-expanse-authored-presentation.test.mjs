import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  collectEonExpanseW767EBounds,
  collectEonExpanseW767ERenderEvidence,
  evaluateEonExpanseW767EAuthoredPresentation
} from '../../assets/js/city/w766/eon-expanse-w767e-authored-presentation.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

function mesh({ min = { x: -0.5, y: 0, z: -0.5 }, max = { x: 0.5, y: 2, z: 0.5 }, visible = true, material = {} } = {}) {
  return {
    geometry: {},
    material,
    isVisible: visible,
    visibility: visible ? 1 : 0,
    isDisposed: () => false,
    isEnabled: () => true,
    getTotalVertices: () => 120,
    computeWorldMatrix() {},
    getBoundingInfo: () => ({ boundingBox: { minimumWorld: min, maximumWorld: max } })
  };
}

const placement = Object.freeze({
  id: 'npc:pathfinder-guide',
  zoneId: 'gateway-overlook',
  assetId: 'pathfinder',
  position: Object.freeze({ x: 0, y: 0, z: 0 }),
  targetHeight: 2
});

test('W767E accepts only a visibly rendered, grounded and materially valid authored presentation', () => {
  const authoredMesh = mesh();
  const container = { meshes: [authoredMesh], materials: [authoredMesh.material], animationGroups: [] };
  const sourceBounds = collectEonExpanseW767EBounds(container.meshes);
  const result = evaluateEonExpanseW767EAuthoredPresentation({
    placement,
    assetId: 'pathfinder',
    requestedPath: '/assets/city/w649/primary/characters/pathfinder.123456789abc.glb',
    variant: 'primary',
    container,
    sourceBounds,
    worldBounds: sourceBounds,
    appliedScale: 1,
    finalPosition: placement.position
  });
  assert.equal(result.ok, true);
  assert.equal(result.truth.status, 'presented');
  assert.equal(result.evidence.renderableMeshCount, 1);
  assert.equal(result.evidence.visibleMeshCount, 1);
  assert.equal(result.evidence.materialCount, 1);
});

test('W767E rejects invisible, materialless and off-zone imports instead of hiding the procedural fallback', () => {
  const invisible = mesh({ visible: false, material: null });
  const container = { meshes: [invisible], materials: [], animationGroups: [] };
  const sourceBounds = collectEonExpanseW767EBounds(container.meshes);
  const result = evaluateEonExpanseW767EAuthoredPresentation({
    placement,
    assetId: 'pathfinder',
    requestedPath: '/assets/city/w649/fallback/characters/pathfinder.123456789abc.glb',
    variant: 'fallback',
    container,
    sourceBounds,
    worldBounds: { minX: 90, minY: 0, minZ: 90, maxX: 91, maxY: 2, maxZ: 91 },
    appliedScale: 1,
    finalPosition: { x: 90, y: 0, z: 90 }
  });
  assert.equal(result.ok, false);
  assert.match(result.truth.failureReason, /no-visible-meshes/);
  assert.match(result.truth.failureReason, /materials-missing/);
  assert.match(result.truth.failureReason, /outside-expected-zone/);
});

test('W767E render evidence ignores empty and disposed child nodes', () => {
  const valid = mesh();
  const evidence = collectEonExpanseW767ERenderEvidence({
    meshes: [
      valid,
      { geometry: null, getTotalVertices: () => 0, isDisposed: () => false },
      { geometry: {}, getTotalVertices: () => 42, isDisposed: () => true }
    ],
    materials: [valid.material]
  });
  assert.deepEqual(evidence, {
    meshCount: 3,
    renderableMeshCount: 1,
    visibleMeshCount: 1,
    materialCount: 1,
    drawCallContribution: 1
  });
});

test('W767E gates both NPC and activity fallback suppression on validated presentation truth', async () => {
  const npc = await read('../../assets/js/city/w766/eon-expanse-w766d-npc-transit.js');
  const activities = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  const diagnostics = await read('../../assets/js/city/w766/eon-expanse-w767d-asset-diagnostics.js');

  assert.match(npc, /evaluateEonExpanseW767EAuthoredPresentation/);
  assert.match(npc, /if \(!presentation\.ok\)/);
  assert.ok(npc.indexOf('if (!presentation.ok)') < npc.indexOf('record.fallbackRoot.setEnabled(false)'));
  assert.match(npc, /visibleMeshCount: Number\(record\.presentationTruth\?\.visibleMeshCount/);
  assert.match(npc, /worldBounds: record\.presentationTruth\?\.worldBounds/);

  assert.match(activities, /evaluateEonExpanseW767EAuthoredPresentation/);
  assert.match(activities, /if \(!presentation\.ok\)/);
  assert.match(activities, /if \(result\.ok\) \{ authoredAssets\.set\(key, result\); fallbackMesh\?\.setEnabled\?\.\(false\); \}/);
  assert.match(activities, /truth: entry\.truth \|\| null/);
  assert.match(activities, /attempts: entry\.attempts/);

  assert.match(diagnostics, /entry\.truth\?\.visibleMeshCount/);
  assert.match(diagnostics, /entry\.truth\?\.materialCount/);
  assert.match(diagnostics, /entry\.truth\?\.worldBounds/);
  for (const source of [npc, activities]) {
    assert.doesNotMatch(source, /new Engine\s*\(/);
    assert.doesNotMatch(source, /new Scene\s*\(/);
  }
});
