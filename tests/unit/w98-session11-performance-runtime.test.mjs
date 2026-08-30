import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION11_PERFORMANCE_SCHEMA,
  SESSION11_STREAMING_BUDGETS,
  Session11PerformanceRuntime,
  buildSession11FrameMetrics,
  classifySession11Distance,
  resolveSession11StreamingBudget,
  shouldSession11Downgrade,
  shouldSession11Recover,
  stepSession11Quality
} from '../../assets/js/realm3d/engine/EonCitySession11PerformanceRuntime.js';

class FakeTarget extends EventTarget {
  constructor() { super(); this.hidden = false; }
}

function createRenderer() {
  return {
    info: {
      render: { calls: 40, triangles: 90000, points: 0, lines: 0 },
      memory: { geometries: 80, textures: 36 },
      programs: []
    },
    domElement: new FakeTarget()
  };
}

test('Session 11 budgets classify district, prop, and NPC distance conservatively', () => {
  const low = resolveSession11StreamingBudget({ quality: 'low', basicDevice: true, mobile: true });
  assert.equal(low.schema, undefined);
  assert.equal(low.basicDevice, true);
  assert.ok(low.districtFar < SESSION11_STREAMING_BUDGETS.standard.districtFar);
  assert.equal(classifySession11Distance(8, low, 'district'), 'near');
  assert.equal(classifySession11Distance(24, low, 'district'), 'mid');
  assert.equal(classifySession11Distance(36, low, 'district'), 'far');
  assert.equal(classifySession11Distance(90, low, 'district'), 'unloaded');
  assert.equal(classifySession11Distance(25, low, 'npc'), 'unloaded');
});

test('Session 11 frame metrics and quality stepping preserve the requested ceiling', () => {
  const metrics = buildSession11FrameMetrics([16, 17, 18, 44, 52]);
  assert.equal(metrics.sampleCount, 5);
  assert.ok(metrics.p95Ms >= 44);
  assert.equal(shouldSession11Downgrade(metrics, { degradeP95: 34, degradeAverage: 25 }), true);
  assert.equal(shouldSession11Recover(buildSession11FrameMetrics(Array(60).fill(16)), { recoverP95: 21, recoverAverage: 18.5 }), true);
  assert.equal(stepSession11Quality('neon', -1, 'neon'), 'standard');
  assert.equal(stepSession11Quality('standard', 1, 'standard'), 'standard');
});

test('Session 11 adaptive governor downgrades only after sustained slow frames', () => {
  const documentTarget = new FakeTarget();
  const windowTarget = new FakeTarget();
  windowTarget.performance = {};
  const renderer = createRenderer();
  let clock = 0;
  let activeQuality = 'neon';
  const recommendations = [];
  const runtime = new Session11PerformanceRuntime({
    renderer,
    canvas: renderer.domElement,
    documentTarget,
    windowTarget,
    now: () => clock,
    getState: () => ({ quality: activeQuality, requestedQuality: 'neon', mobile: false }),
    onQualityRecommendation: (quality, detail) => { recommendations.push({ quality, detail }); activeQuality = quality; }
  }).mount();
  for (let i = 0; i < 150; i += 1) {
    clock += 40;
    runtime.tick(clock, 0.04);
  }
  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0].quality, 'standard');
  assert.equal(recommendations[0].detail.direction, 'down');
  assert.equal(runtime.getTelemetry().adaptiveDowngrades, 1);
  runtime.destroy();
});

test('Session 11 lifecycle pauses background work and recovers WebGL context', () => {
  const documentTarget = new FakeTarget();
  const windowTarget = new FakeTarget();
  windowTarget.performance = {};
  const renderer = createRenderer();
  const lifecycle = [];
  let restored = 0;
  const runtime = new Session11PerformanceRuntime({
    renderer,
    canvas: renderer.domElement,
    documentTarget,
    windowTarget,
    getState: () => ({ quality: 'standard', requestedQuality: 'standard' }),
    onSuspendChange: (suspended, detail) => lifecycle.push({ suspended, reason: detail.reason }),
    onContextRestore: () => { restored += 1; }
  }).mount();
  documentTarget.hidden = true;
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  assert.equal(runtime.isSuspended(), true);
  documentTarget.hidden = false;
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  assert.equal(runtime.isSuspended(), false);
  const lost = new Event('webglcontextlost', { cancelable: true });
  renderer.domElement.dispatchEvent(lost);
  assert.equal(runtime.getTelemetry().contextLosses, 1);
  assert.equal(runtime.isSuspended(), true);
  renderer.domElement.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(runtime.getTelemetry().contextRestores, 1);
  assert.equal(restored, 1);
  assert.equal(runtime.isSuspended(), false);
  assert.deepEqual(lifecycle.map((entry) => entry.reason), ['visibility-hidden', 'visibility-visible', 'webgl-context-lost', 'webgl-context-restored']);
  runtime.destroy();
});

test('Session 11 memory pressure requests cleanup and falls back to low quality', () => {
  const documentTarget = new FakeTarget();
  const windowTarget = new FakeTarget();
  windowTarget.performance = {};
  const renderer = createRenderer();
  renderer.info.memory.geometries = 999;
  renderer.info.memory.textures = 999;
  let clock = 0;
  let activeQuality = 'neon';
  const cleanup = [];
  const recommendations = [];
  const runtime = new Session11PerformanceRuntime({
    renderer,
    canvas: renderer.domElement,
    documentTarget,
    windowTarget,
    now: () => clock,
    getState: () => ({ quality: activeQuality, requestedQuality: 'neon' }),
    onMemoryPressure: (detail) => cleanup.push(detail),
    onQualityRecommendation: (quality, detail) => { recommendations.push({ quality, detail }); activeQuality = quality; }
  }).mount();
  for (let i = 0; i < 100; i += 1) {
    clock += 34;
    runtime.tick(clock, 0.034);
  }
  assert.ok(cleanup.length >= 1);
  assert.ok(recommendations.some((entry) => entry.quality === 'low' && entry.detail.memoryPressure));
  assert.ok(runtime.getTelemetry().memoryPressureEvents >= 1);
  runtime.destroy();
});

test('Session 11 telemetry schema exposes frame, renderer, and safe lifecycle state', () => {
  const renderer = createRenderer();
  const runtime = new Session11PerformanceRuntime({
    renderer,
    canvas: renderer.domElement,
    documentTarget: new FakeTarget(),
    windowTarget: Object.assign(new FakeTarget(), { performance: {} }),
    getState: () => ({ quality: 'low', requestedQuality: 'standard', basicDevice: true, mobile: true })
  }).mount();
  const snapshot = runtime.tick(1000, 0.016);
  assert.equal(snapshot.schema, SESSION11_PERFORMANCE_SCHEMA);
  assert.equal(snapshot.budget.basicDevice, true);
  assert.equal(snapshot.renderer.calls, 40);
  assert.equal(snapshot.telemetry.totalFrames, 1);
  runtime.destroy();
});
