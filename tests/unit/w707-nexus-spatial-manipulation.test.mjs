import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getEonNexusW706LayoutMetrics, projectEonNexusW706FieldPosition } from '../../assets/js/nexus/w706/eon-nexus-w706-spatial-scene-plan.js';
import {
  beginEonNexusW707SpatialDrag,
  projectEonNexusW707SpatialDrag,
  getEonNexusW707SpatialManipulationTruth
} from '../../assets/js/nexus/w707/eon-nexus-w707-spatial-manipulation.js';

const object = Object.freeze({ id: 'project:p1', draggable: true, sourceObject: { x: 50, y: 50, z: 0, elevation: 0 } });
const start = () => beginEonNexusW707SpatialDrag({ object, pointer: { clientX: 100, clientY: 100, pointerId: 7 }, viewport: { width: 400, height: 200 }, layoutMode: 'full' });

test('W707 exposes bounded W706 layout metrics and field projection', () => {
  const metrics = getEonNexusW706LayoutMetrics('full');
  assert.equal(metrics.mode, 'full');
  assert.equal(metrics.fieldBounds.minimum, 7);
  assert.deepEqual(projectEonNexusW706FieldPosition({ x: 50, y: 50, z: 0 }, 'full'), { x: 0, y: 0, z: 0 });
});

test('W707 starts only draggable identified work objects', () => {
  assert.equal(start().ok, true);
  assert.equal(beginEonNexusW707SpatialDrag({ object: { id: '', draggable: true } }).ok, false);
  assert.equal(beginEonNexusW707SpatialDrag({ object: { id: 'x', draggable: false } }).ok, false);
});

test('W707 normal pointer drag previews bounded field X and Y', () => {
  const projected = projectEonNexusW707SpatialDrag(start(), { clientX: 300, clientY: 200 });
  assert.equal(projected.ok, true);
  assert.equal(projected.fieldPosition.x, 93);
  assert.equal(projected.fieldPosition.y, 93);
  assert.equal(projected.fieldPosition.z, 0);
  assert.equal(projected.previewOnly, true);
  assert.equal(projected.commitRequired, true);
  assert.ok(Number.isFinite(projected.worldPosition.x));
});

test('W707 modified drag changes depth while keeping field Y stable', () => {
  const projected = projectEonNexusW707SpatialDrag(start(), { clientX: 100, clientY: 220 }, { depthMode: true });
  assert.equal(projected.fieldPosition.x, 50);
  assert.equal(projected.fieldPosition.y, 50);
  assert.equal(projected.fieldPosition.z, 6);
  assert.equal(projected.depthMode, true);
});

test('W707 Babylon integration uses one W684 transaction and camera-safe drag', () => {
  const source = fs.readFileSync(new URL('../../assets/js/nexus/eon-nexus-living-core.js', import.meta.url), 'utf8');
  assert.match(source, /PointerEventTypes\.POINTERDOWN/);
  assert.match(source, /controller\?\.beginMove/);
  assert.match(source, /interactionController\?\.moveTo/);
  assert.match(source, /\{ commit: false \}/);
  assert.match(source, /interactionController\?\.endMove/);
  assert.match(source, /camera\?\.detachControl/);
  assert.match(source, /camera\?\.attachControl/);
  assert.match(source, /pointercancel/);
});

test('W707 truth keeps manipulation local, reviewed and non-productive', () => {
  const truth = getEonNexusW707SpatialManipulationTruth();
  assert.equal(truth.usesExistingW684Controller, true);
  assert.equal(truth.pointerUpCommitsOneUndoableMove, true);
  assert.equal(truth.mutatesProjectState, false);
  assert.equal(truth.mutatesTaskState, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.startsAiWork, false);
});
