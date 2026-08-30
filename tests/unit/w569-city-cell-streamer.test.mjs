import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_STATIC_CELL_MANIFEST,
  EON_CITY_STATIC_CELL_MANIFEST_SCHEMA,
  createEonCityCellResidencyController,
  getEonCityCellResidencyPlan,
  getEonCityCellStreamerTruth,
  inspectEonCityStaticCellEntry,
  validateEonCityStaticCellManifest
} from '../../assets/js/city/eon-city-cell-streamer.js';
import { inspectW569CityCellStreamer } from '../../scripts/w569-city-cell-streamer-gate.mjs';

test('W569 keeps a deterministic 3×3 local residency window around the City operator', () => {
  const plan = getEonCityCellResidencyPlan({ position: { x: 0, z: 0 }, quality: 'balanced' });
  assert.equal(plan.currentCellId, 'cell-0-0');
  assert.equal(plan.residentCellCount, 9);
  assert.equal(plan.expectedResidentCellCount, 9);
  assert.equal(plan.staticAssetsLoaded, false);
  assert.equal(plan.remoteNetwork, false);
  assert.equal(plan.containsUserData, false);
  assert.deepEqual(plan.cells.filter((cell) => cell.role === 'current').map((cell) => cell.id), ['cell-0-0']);
});

test('W569 releases only explicitly owned local cell resources when the 3×3 window moves', () => {
  const released = [];
  const controller = createEonCityCellResidencyController({ onLeave: (event) => released.push(event) });
  const first = controller.update({ x: 0, z: 0 });
  assert.equal(first.ok, true);
  let disposeCount = 0;
  assert.equal(controller.registerResource('cell--1-0', { kind: 'texture', dispose: () => { disposeCount += 1; } }), true);
  const moved = controller.update({ x: 20, z: 0 });
  assert.equal(moved.ok, true);
  assert.ok(moved.unloaded.includes('cell--1-0'));
  assert.equal(disposeCount, 1);
  assert.ok(released.some((event) => event.cellId === 'cell--1-0' && event.releasedResourceCount === 1));
  assert.equal(controller.registerResource('cell-1-0', { kind: 'observer', dispose: () => { disposeCount += 1; } }), true);
  const summary = controller.getSummary();
  assert.equal(summary.residentCellCount, 9);
  assert.equal(summary.remoteNetwork, false);
  controller.dispose();
  assert.equal(disposeCount, 2);
});

test('W569 keeps the direct static manifest empty and rejects remote/runtime/private entries', () => {
  assert.equal(EON_CITY_STATIC_CELL_MANIFEST.schema, EON_CITY_STATIC_CELL_MANIFEST_SCHEMA);
  assert.equal(validateEonCityStaticCellManifest().ok, true);
  assert.equal(EON_CITY_STATIC_CELL_MANIFEST.entries.length, 0);
  const candidate = inspectEonCityStaticCellEntry({
    cellId: 'cell-0-0',
    assetId: 'command-horizon-kit',
    path: '/assets/city/cells/command-horizon-kit.glb',
    stage: 'planned-static-direct-delivery',
    binaryPresent: false,
    runtimeLoadEnabled: false,
    containsUserData: false,
    remoteNetwork: false
  });
  assert.equal(candidate.ok, true);
  const unsafe = inspectEonCityStaticCellEntry({
    cellId: 'cell-0-0',
    assetId: 'command-horizon-kit',
    path: 'https://example.invalid/private.glb',
    stage: 'released',
    binaryPresent: true,
    runtimeLoadEnabled: true,
    containsUserData: true,
    remoteNetwork: true
  });
  assert.equal(unsafe.ok, false);
  assert.ok(unsafe.errors.includes('entry-path-must-be-direct-same-origin-static'));
  assert.ok(unsafe.errors.includes('entry-cannot-claim-binary-or-runtime-load'));
});

test('W569 truth stays pre-release and the source gate stays fail-closed', () => {
  const truth = getEonCityCellStreamerTruth({ quality: 'lite' });
  assert.equal(truth.manifestValid, true);
  assert.equal(truth.registeredStaticCellEntries, 0);
  assert.equal(truth.staticAssetsLoaded, false);
  assert.equal(truth.pagesFunctionProxy, false);
  assert.equal(truth.browserMemoryProofCaptured, false);
  const report = inspectW569CityCellStreamer();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 14);
});
