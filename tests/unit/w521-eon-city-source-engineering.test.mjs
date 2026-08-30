import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_RUNTIME_LIFECYCLE_SCHEMA,
  createEonCityRuntimeLifecycle
} from '../../assets/js/city/eon-city-runtime-lifecycle.js';
import { W521_TRUTH, validateW521EonCitySourceEngineeringContract } from '../../config/w521-eon-city-source-engineering-contract.mjs';
import { inspectW521EonCitySourceEngineering } from '../../scripts/w521-eon-city-source-engineering-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_ROOT = path.join(ROOT, 'tmp', 'w521-unit-fixture');

function resetFixture() {
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  fs.mkdirSync(FIXTURE_ROOT, { recursive: true });
}

test('W521 lifecycle rejects a stale boot and disposes owned runtime resources exactly once', () => {
  let now = 0;
  const lifecycle = createEonCityRuntimeLifecycle({ now: () => now });
  const first = lifecycle.beginBoot({ reason: 'first-entry' });
  assert.equal(first.ok, true);
  let soundscapeDisposals = 0;
  lifecycle.own('adaptive-soundscape', () => { soundscapeDisposals += 1; });
  now = 5;
  const second = lifecycle.beginBoot({ reason: 'retry' });
  assert.equal(second.ok, true);
  assert.equal(lifecycle.isCurrent(first.token), false);
  assert.equal(soundscapeDisposals, 1);
  let staleRuntimeDestroyed = 0;
  assert.equal(lifecycle.attachRuntime(first.token, { destroy: () => { staleRuntimeDestroyed += 1; } }), false);
  assert.equal(staleRuntimeDestroyed, 1);
  let runtimeDestroyed = 0;
  assert.equal(lifecycle.attachRuntime(second.token, { destroy: () => { runtimeDestroyed += 1; } }), true);
  assert.equal(lifecycle.getSnapshot().state, 'running');
  lifecycle.dispose('pagehide');
  lifecycle.dispose('repeat-pagehide');
  const snapshot = lifecycle.getSnapshot();
  assert.equal(snapshot.schema, EON_CITY_RUNTIME_LIFECYCLE_SCHEMA);
  assert.equal(snapshot.state, 'disposed');
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.remoteTelemetry, false);
  assert.equal(runtimeDestroyed, 1);
});

test('W521 context loss invalidates the current boot and fails closed before later work can attach', () => {
  const lifecycle = createEonCityRuntimeLifecycle();
  const boot = lifecycle.beginBoot();
  let runtimeDestroyed = 0;
  assert.equal(lifecycle.attachRuntime(boot.token, { destroy: () => { runtimeDestroyed += 1; } }), true);
  assert.equal(lifecycle.markContextLoss(boot.token), true);
  const snapshot = lifecycle.getSnapshot();
  assert.equal(snapshot.state, 'context-lost');
  assert.equal(snapshot.contextLost, true);
  assert.equal(lifecycle.isCurrent(boot.token), false);
  assert.equal(runtimeDestroyed, 1);
  assert.equal(lifecycle.attachRuntime(boot.token, { destroy: () => { runtimeDestroyed += 1; } }), false);
  assert.equal(runtimeDestroyed, 2);
});

test('W521 source gate binds lifecycle cleanup, local performance observation and the retired-renderer fence', () => {
  assert.deepEqual(validateW521EonCitySourceEngineeringContract(), []);
  const result = inspectW521EonCitySourceEngineering({ root: ROOT });
  assert.equal(result.ok, true, result.issues.join('\n'));
  assert.equal(result.truth, W521_TRUTH);
  assert.equal(result.codeOnlyRescore.scoreAssigned, false);
});

test('W521 rejects a deliberate active import of the retired renderer and a built-output marker', () => {
  resetFixture();
  const fixture = path.join(FIXTURE_ROOT, 'active-import.mjs');
  fs.writeFileSync(fixture, ['im', 'port ', "'../../assets/js/city/eon-city-3d-renderer.js';\n"].join(''));
  const activeResult = inspectW521EonCitySourceEngineering({ root: ROOT, extraActiveEntrypoints: [path.relative(ROOT, fixture)] });
  assert.equal(activeResult.ok, false);
  assert.ok(activeResult.issues.some((issue) => issue.startsWith('active-import-reaches-retired-renderer:')), activeResult.issues.join('\n'));
  const dist = path.join(FIXTURE_ROOT, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'chunk.js'), '/* eon-city-3d-renderer */');
  const outputResult = inspectW521EonCitySourceEngineering({ root: ROOT, requireDist: true, distDirectory: dist });
  assert.equal(outputResult.ok, false);
  assert.ok(outputResult.issues.some((issue) => issue.startsWith('built-output-reaches-retired-renderer:')), outputResult.issues.join('\n'));
  fs.rmSync(FIXTURE_ROOT, { recursive: true, force: true });
});
