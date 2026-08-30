import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A15_A14_BASELINE_COMMIT,
  A15_PRIMARY_CORE_ROUTES,
  A15_W802B_SOURCE_COMMIT,
  inspectA14ToW802BDelta,
  inspectCityCoreBoundary,
  inspectCityStorage,
  inspectCoreCityBoundary
} from '../../scripts/lib/a15-source-authority.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = (name) => JSON.parse(readFileSync(path.join(root, 'docs/institutional/a15/evidence', name), 'utf8'));

test('A15 I00 freezes the exact A14 to W802B authority transition', () => {
  const delta = inspectA14ToW802BDelta();
  assert.equal(delta.baseCommit, A15_A14_BASELINE_COMMIT);
  assert.equal(delta.targetCommit, A15_W802B_SOURCE_COMMIT);
  assert.equal(delta.changedFiles, 344);
  assert.equal(delta.insertions, 38193);
  assert.equal(delta.deletions, 516);
});

test('A15 C01 records the current Core to City coupling as a release blocker', () => {
  const boundary = inspectCoreCityBoundary();
  assert.equal(A15_PRIMARY_CORE_ROUTES.length, 13);
  assert.equal(boundary.routeCount, 13);
  assert.equal(boundary.coupledRouteCount, 13);
  assert.equal(boundary.distinctCityModuleCount, 19);
  assert.equal(boundary.routes.every((route) => route.cityModuleCount > 0), true);
});

test('A15 C01 records the exact active City closure and reverse coupling', () => {
  const boundary = inspectCityCoreBoundary();
  assert.equal(boundary.moduleCount, 249);
  assert.equal(boundary.cityModuleCount, 192);
  assert.equal(boundary.nonCityModuleCount, 57);
  assert.equal(boundary.nonCityModules.includes('assets/js/chat/ai-runtime.js'), true);
  assert.equal(boundary.nonCityModules.some((file) => file.includes('automation-os-store')), true);
  assert.equal(boundary.nonCityModules.some((file) => file.includes('creator-library-store')), true);
});

test('A15 C01 inventories City browser-storage references and exact API access', () => {
  const storage = inspectCityStorage();
  assert.equal(storage.planningStaticModuleCount, 40);
  assert.equal(storage.observedReferenceModuleCount, 41);
  assert.equal(storage.directAccessModuleCount, 39);
  assert.equal(storage.nonAccessReferenceModuleCount, 2);
  assert.equal(storage.planningCountDiscrepancy, 1);
  assert.equal(storage.rows.some((row) => row.file.endsWith('w766/eon-expanse-w766a-foundation.js')), true);
  assert.equal(storage.namedKeys.includes('eon:city:expanse:w766a:state:v1'), true);
});

test('A15 baseline receipt cannot mislabel the current boundary as launch-ready', () => {
  const receipt = evidence('A15_I00_C01_BASELINE_RECEIPT.json');
  assert.equal(receipt.planningOnly, true);
  assert.equal(receipt.productBehaviorChanged, false);
  assert.equal(receipt.boundaryTargetSatisfied, false);
  assert.deepEqual(receipt.coreBoundary, { routeCount: 13, coupledRouteCount: 13, distinctCityModuleCount: 19 });
  assert.deepEqual(receipt.cityBoundary, { moduleCount: 249, cityModuleCount: 192, nonCityModuleCount: 57 });
  assert.equal(receipt.blockers.length >= 3, true);
});
