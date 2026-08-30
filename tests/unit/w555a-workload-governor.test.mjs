import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_WORKLOAD_GOVERNOR_SCHEMA,
  EON_WORKLOAD_KINDS,
  createEonWorkloadGovernor,
  getEonAiWorkloadKind,
  getEonWorkloadGovernorTruth
} from '../../assets/js/runtime/eon-workload-governor.js';

function createEnvironment({ memory = 4, cores = 4, saveData = false, visibility = 'visible' } = {}) {
  return {
    navigator: {
      deviceMemory: memory,
      hardwareConcurrency: cores,
      connection: { saveData, effectiveType: '4g' }
    },
    document: {
      visibilityState: visibility,
      addEventListener() {}
    },
    performance: { now: () => 0 }
  };
}

function createGovernor(options = {}) {
  let tick = 1000;
  return createEonWorkloadGovernor({
    environment: createEnvironment(options),
    now: () => tick,
    wallNow: () => tick++
  });
}

test('W555A makes a small local text request coexist with City by trimming chat before double-degrading the renderer', () => {
  const governor = createGovernor({ memory: 4, cores: 4 });
  const cityActions = [];
  const chatActions = [];
  governor.registerConsumer({
    id: 'city',
    workloads: [EON_WORKLOAD_KINDS.CITY_RENDER],
    onAction: (event) => cityActions.push(event)
  });
  governor.registerConsumer({
    id: 'chat',
    workloads: [EON_WORKLOAD_KINDS.LOCAL_TEXT_AI, EON_WORKLOAD_KINDS.HOSTED_AI],
    onAction: (event) => chatActions.push(event)
  });

  const city = governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city', source: 'eon-city', label: 'Command Horizon' });
  const localText = governor.acquire(EON_WORKLOAD_KINDS.LOCAL_TEXT_AI, { id: 'local-text', source: 'eonbot', label: 'Local EONBOT reply' });

  assert.equal(city.ok, true);
  assert.equal(localText.ok, true);
  assert.equal(localText.decision.decision, 'degraded');
  assert.equal(localText.decision.requiredAction, 'chat:trim-budget');
  assert.equal(cityActions.some((event) => event.action === 'city:reduce-quality'), false);
  assert.equal(chatActions.some((event) => event.action === 'chat:trim-budget'), true);
  assert.equal(governor.getSnapshot().activeLeases.length, 2);

  assert.equal(localText.lease.release('reply-complete'), true);
  assert.equal(city.lease.release('city-exit'), true);
  assert.equal(governor.getSnapshot().activeLeases.length, 0);
});

test('W555A refuses to silently begin a heavy local media task over City', () => {
  const governor = createGovernor({ memory: 8, cores: 8 });
  const actions = [];
  governor.registerConsumer({
    id: 'city',
    workloads: [EON_WORKLOAD_KINDS.CITY_RENDER],
    onAction: (event) => actions.push(event)
  });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city' });

  const needsChoice = governor.acquire(EON_WORKLOAD_KINDS.VIDEO_GENERATION, { id: 'video', source: 'creator-runtime' });
  assert.equal(needsChoice.ok, false);
  assert.equal(needsChoice.decision.decision, 'needs-user-choice');
  assert.equal(needsChoice.decision.requiredAction, 'city:pause');
  assert.equal(governor.getSnapshot().activeKinds.includes(EON_WORKLOAD_KINDS.VIDEO_GENERATION), false);

  const confirmed = governor.acquire(EON_WORKLOAD_KINDS.VIDEO_GENERATION, {
    id: 'video',
    source: 'creator-runtime',
    confirmPreemptCity: true
  });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.decision.preemptCityConfirmed, true);
  assert.equal(actions.some((event) => event.action === 'city:pause' && event.userConfirmed === true), true);
});

test('W555A keeps background agents deferred under observed critical pressure instead of hiding the condition', () => {
  const governor = createGovernor({ memory: 4, cores: 4 });
  for (let index = 0; index < 24; index += 1) governor.recordFrame(92);
  const snapshot = governor.getSnapshot();
  assert.equal(snapshot.pressure, 'critical');
  assert.equal(snapshot.pressureReason, 'sustained-main-thread-stall');

  const agent = governor.acquire(EON_WORKLOAD_KINDS.AGENT_ACTION, { id: 'agent:background', userInitiated: false, source: 'agent-executor' });
  assert.equal(agent.ok, false);
  assert.equal(agent.decision.decision, 'deferred');
  assert.equal(agent.decision.requiredAction, 'background:defer');
});

test('W555A provider classification is declarative and the governor truth boundary is explicit', () => {
  assert.equal(getEonAiWorkloadKind({ id: 'ollama' }), EON_WORKLOAD_KINDS.LOCAL_TEXT_AI);
  assert.equal(getEonAiWorkloadKind({ id: 'openai' }), EON_WORKLOAD_KINDS.HOSTED_AI);
  assert.equal(getEonAiWorkloadKind({}, 'http://127.0.0.1:11434/v1'), EON_WORKLOAD_KINDS.LOCAL_TEXT_AI);
  const truth = getEonWorkloadGovernorTruth();
  assert.equal(truth.schema, EON_WORKLOAD_GOVERNOR_SCHEMA);
  assert.equal(truth.remoteTelemetry, false);
  assert.equal(truth.readsPrompts, false);
  assert.equal(truth.startsModels, false);
  assert.equal(truth.deviceThermalMeasurement, false);
});


test('W555A keeps light audio playback cooperative while treating offline exports as heavy media work', () => {
  const governor = createGovernor({ memory: 8, cores: 8 });
  governor.acquire(EON_WORKLOAD_KINDS.CITY_RENDER, { id: 'city' });
  const audio = governor.acquire(EON_WORKLOAD_KINDS.AUDIO_PLAYBACK, { id: 'music' });
  const wav = governor.acquire(EON_WORKLOAD_KINDS.MEDIA_EXPORT, { id: 'wav-export', source: 'music-lab' });

  assert.equal(audio.ok, true);
  assert.equal(wav.ok, false);
  assert.equal(wav.decision.decision, 'needs-user-choice');
  assert.equal(wav.decision.requiredAction, 'city:pause');
});
