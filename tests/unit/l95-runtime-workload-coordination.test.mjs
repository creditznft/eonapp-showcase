import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  EON_WORKLOAD_KINDS,
  createEonWorkloadGovernor
} from '../../assets/js/runtime/eon-workload-governor.js';

function environment() {
  return {
    navigator: {
      deviceMemory: 8,
      hardwareConcurrency: 8,
      connection: { saveData: false, effectiveType: '4g' }
    },
    document: { visibilityState: 'visible', addEventListener() {} },
    performance: { now: () => 0 }
  };
}

test('L95 renderer FPS observations can update universal pressure without causing a second renderer degradation', () => {
  let wall = 10_000;
  const governor = createEonWorkloadGovernor({
    environment: environment(),
    now: () => wall,
    wallNow: () => (wall += 5_000)
  });
  const actions = [];
  governor.registerConsumer({
    id: 'city-renderer',
    workloads: [EON_WORKLOAD_KINDS.CITY_RENDER],
    onAction: (action) => actions.push(action)
  });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city', source: 'eon-city' });

  governor.recordPerformanceSample({ fps: 35, averageFrameMs: 28.6, hardwareScalingLevel: 1.2, source: 'w731' }, { emit: true, rendererOwnsProtection: true });
  governor.recordPerformanceSample({ fps: 34, averageFrameMs: 29.4, hardwareScalingLevel: 1.2, source: 'w731' }, { emit: true, rendererOwnsProtection: true });

  const snapshot = governor.getSnapshot();
  assert.equal(snapshot.pressure, 'elevated');
  assert.equal(snapshot.pressureReason, 'city-fps-elevated');
  assert.equal(snapshot.observations.performanceSamples, 2);
  assert.equal(actions.some((action) => action.action === 'city:reduce-quality'), false);

  const budget = governor.getAdaptiveBudgetOverrides(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI);
  assert.equal(budget?.source, 'universal-workload-governor');
  assert.equal(budget?.maxOutputTokens <= 420, true);
});

test('L95 renderer-owned protection still emits cross-feature critical-pressure protection', () => {
  let wall = 20_000;
  const governor = createEonWorkloadGovernor({
    environment: environment(),
    now: () => wall,
    wallNow: () => (wall += 5_000)
  });
  const cityActions = [];
  const backgroundActions = [];
  governor.registerConsumer({ id: 'city', workloads: [EON_WORKLOAD_KINDS.CITY_RENDER], onAction: (action) => cityActions.push(action) });
  governor.registerConsumer({ id: 'background', workloads: [EON_WORKLOAD_KINDS.AGENT_ACTION], onAction: (action) => backgroundActions.push(action) });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city-render', source: 'eon-city' });

  governor.recordPerformanceSample({ fps: 24, averageFrameMs: 41.7, hardwareScalingLevel: 1.4, source: 'w731' }, { emit: true, rendererOwnsProtection: true });
  governor.recordPerformanceSample({ fps: 23, averageFrameMs: 43.5, hardwareScalingLevel: 1.4, source: 'w731' }, { emit: true, rendererOwnsProtection: true });

  assert.equal(governor.getSnapshot().pressure, 'critical');
  assert.equal(cityActions.some((action) => action.action === 'city:reduce-quality'), false);
  assert.equal(backgroundActions.some((action) => action.action === 'background:defer'), true);
  const admission = governor.evaluate(EON_WORKLOAD_KINDS.AGENT_ACTION, { userInitiated: false });
  assert.equal(admission.allowed, false);
  assert.equal(admission.reason, 'background-work-deferred-under-critical-pressure');
});

test('L95 live W731 telemetry is submitted observation-only and includes average frame duration', async () => {
  const [station, runtime] = await Promise.all([
    readFile(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8'),
    readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8')
  ]);
  assert.match(station, /recordPerformanceSample\?\.\([^]*source: 'eon-city-runtime-telemetry'[^]*\}, \{ emit: true, rendererOwnsProtection: true \}\)/);
  assert.match(runtime, /averageFrameMs:\s*lastFpsSample\.frames > 0/);
});

test('L95 City + text AI pressure trims chat instead of double-degrading the renderer', () => {
  let wall = 30_000;
  const governor = createEonWorkloadGovernor({
    environment: environment(),
    now: () => wall,
    wallNow: () => (wall += 5_000)
  });
  const cityActions = [];
  const chatActions = [];
  governor.registerConsumer({ id: 'city', workloads: [EON_WORKLOAD_KINDS.CITY_RENDER], onAction: (action) => cityActions.push(action) });
  governor.registerConsumer({ id: 'chat', workloads: [EON_WORKLOAD_KINDS.LOCAL_TEXT_AI, EON_WORKLOAD_KINDS.HOSTED_AI], onAction: (action) => chatActions.push(action) });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city-render', source: 'eon-city' });
  governor.recordPerformanceSample({ fps: 35, averageFrameMs: 28.6, hardwareScalingLevel: 1.2, source: 'w731' }, { emit: true, rendererOwnsProtection: true });
  governor.recordPerformanceSample({ fps: 34, averageFrameMs: 29.4, hardwareScalingLevel: 1.2, source: 'w731' }, { emit: true, rendererOwnsProtection: true });

  const admission = governor.acquire(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI, { id: 'local-chat', source: 'eonbot-chat', userInitiated: true });
  assert.equal(admission.ok, true);
  assert.equal(admission.decision.decision, 'degraded');
  assert.equal(admission.decision.requiredAction, 'chat:trim-budget');
  assert.equal(cityActions.some((action) => action.action === 'city:reduce-quality'), false);
  assert.equal(chatActions.some((action) => action.action === 'chat:trim-budget'), true);
  const budget = governor.getAdaptiveBudgetOverrides(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI);
  assert.equal(budget.maxOutputTokens <= 420, true);
});

test('L95 pressure changes protect an admitted in-flight text reply while deferring new background work', () => {
  let wall = 40_000;
  const governor = createEonWorkloadGovernor({
    environment: environment(),
    now: () => wall,
    wallNow: () => (wall += 5_000)
  });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city-render', source: 'eon-city' });
  const chat = governor.acquire(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI, { id: 'active-chat', source: 'eonbot-chat', userInitiated: true });
  assert.equal(chat.ok, true);

  governor.recordPerformanceSample({ fps: 24, averageFrameMs: 41.7, hardwareScalingLevel: 1.4, source: 'w731' }, { emit: true, rendererOwnsProtection: true });
  governor.recordPerformanceSample({ fps: 23, averageFrameMs: 43.5, hardwareScalingLevel: 1.4, source: 'w731' }, { emit: true, rendererOwnsProtection: true });

  const pressured = governor.getSnapshot();
  assert.equal(pressured.pressure, 'critical');
  assert.equal(pressured.activeKinds.includes(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI), true);
  const background = governor.evaluate(EON_WORKLOAD_KINDS.AGENT_ACTION, { userInitiated: false });
  assert.equal(background.allowed, false);
  assert.equal(background.reason, 'background-work-deferred-under-critical-pressure');

  assert.equal(chat.lease.release('reply-finished'), true);
  assert.equal(governor.getSnapshot().activeKinds.includes(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI), false);
});
