import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W767A_ASSET_TRUTH_SCHEMA,
  evaluateEonExpanseW767AAssetPresentation,
  validateEonExpanseW767AAssetTruthRecord
} from '../../assets/js/city/w766/eon-expanse-w767a-asset-truth.js';

const placement = Object.freeze({
  id: 'gateway-portal',
  zoneId: 'gateway-overlook',
  assetId: 'eoncity-ascension-portal',
  position: Object.freeze({ x: 0, y: 0, z: 10 }),
  targetHeight: 8
});

function validInput(overrides = {}) {
  return {
    placement,
    assetId: placement.assetId,
    requestedPath: '/assets/city/w649/primary/world/portal.123456789abc.glb',
    variant: 'primary',
    loadStatus: 'loaded',
    meshCount: 8,
    renderableMeshCount: 6,
    visibleMeshCount: 6,
    materialCount: 4,
    animationGroupCount: 1,
    sourceBounds: { minX: -1, minY: -2, minZ: -1, maxX: 1, maxY: 2, maxZ: 1 },
    worldBounds: { minX: -2, minY: 0, minZ: 8, maxX: 2, maxY: 8, maxZ: 12 },
    appliedScale: 2,
    finalPosition: { x: 0, y: 2, z: 10 },
    groundOffset: 2,
    drawCallContribution: 6,
    ...overrides
  };
}

test('W767A accepts only a visibly presented grounded hero asset', () => {
  const record = evaluateEonExpanseW767AAssetPresentation(validInput());
  assert.equal(record.schema, EON_EXPANSE_W767A_ASSET_TRUTH_SCHEMA);
  assert.equal(record.ok, true);
  assert.equal(record.status, 'presented');
  assert.equal(record.failureReason, '');
  assert.equal(record.visibility.ratio, 1);
  assert.equal(validateEonExpanseW767AAssetTruthRecord(record), true);
});

test('W767A rejects a promise-resolved asset with no visible renderable meshes', () => {
  const record = evaluateEonExpanseW767AAssetPresentation(validInput({
    renderableMeshCount: 0,
    visibleMeshCount: 0,
    materialCount: 0,
    worldBounds: null
  }));
  assert.equal(record.ok, false);
  assert.match(record.failureReason, /no-renderable-meshes/);
  assert.match(record.failureReason, /no-visible-meshes/);
  assert.match(record.failureReason, /materials-missing/);
  assert.match(record.failureReason, /world-bounds-invalid/);
});

test('W767A rejects incorrectly scaled, floating or misplaced assets', () => {
  const record = evaluateEonExpanseW767AAssetPresentation(validInput({
    worldBounds: { minX: 100, minY: 5, minZ: 100, maxX: 104, maxY: 25, maxZ: 104 },
    appliedScale: 0
  }));
  assert.equal(record.ok, false);
  assert.match(record.failureReason, /scale-invalid/);
  assert.match(record.failureReason, /target-height-mismatch/);
  assert.match(record.failureReason, /grounding-invalid/);
  assert.match(record.failureReason, /outside-expected-zone/);
});
