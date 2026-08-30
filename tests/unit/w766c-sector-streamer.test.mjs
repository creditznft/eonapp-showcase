import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonExpanseW766CSectorPlan,
  createEonExpanseW766CSectorStreamer,
  validateEonExpanseW766CNeighborContinuity,
  validateEonExpanseW766CSectorPlan
} from '../../assets/js/city/w766/eon-expanse-w766c-sector-streamer.js';

test('W766C sector generation is stable for a seed and coordinate', () => {
  const a = createEonExpanseW766CSectorPlan({ worldSeed: 417, x: -3, z: 8 });
  const b = createEonExpanseW766CSectorPlan({ worldSeed: 417, x: -3, z: 8 });
  assert.deepEqual(a, b);
  assert.equal(validateEonExpanseW766CSectorPlan(a).ok, true);
});

test('W766C neighboring sectors share reciprocal edge contracts', () => {
  const center = createEonExpanseW766CSectorPlan({ worldSeed: 417, x: 0, z: 0 });
  const east = createEonExpanseW766CSectorPlan({ worldSeed: 417, x: 1, z: 0 });
  const south = createEonExpanseW766CSectorPlan({ worldSeed: 417, x: 0, z: 1 });
  assert.equal(validateEonExpanseW766CNeighborContinuity(center, east, 'east').ok, true);
  assert.equal(validateEonExpanseW766CNeighborContinuity(center, south, 'south').ok, true);
});

test('W766C streamer mounts rings inside aggregate budget and disposes sectors left behind', () => {
  const mounted = []; const disposed = [];
  const streamer = createEonExpanseW766CSectorStreamer({ worldSeed: 12, quality: 'lite', mountSector: (plan, ring) => { mounted.push([plan.id, ring]); return plan.id; }, unmountSector: (record) => disposed.push(record.id) });
  const first = streamer.update({ x: 0, z: 0 });
  assert.equal(first.activeCount, 9);
  assert.ok(mounted.some(([, ring]) => ring === 'interactive'));
  assert.ok(first.aggregateBudget.triangles <= streamer.getSummary().budget.maxTriangles);
  const second = streamer.update({ x: 480, z: 480 });
  assert.ok(second.disposed.length > 0);
  assert.ok(disposed.length > 0);
  assert.equal(streamer.getSummary().oneSceneAuthority, true);
});

test('W766C rejects a sector that exceeds active quality budget', () => {
  const valid = createEonExpanseW766CSectorPlan({ worldSeed: 2, x: 0, z: 0 });
  const invalid = { ...valid, estimate: { ...valid.estimate, triangles: 9999999 } };
  const result = validateEonExpanseW766CSectorPlan(invalid, { quality: 'lite' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('triangle-budget-exceeded'));
  assert.equal(result.fallbackRequired, true);
});
