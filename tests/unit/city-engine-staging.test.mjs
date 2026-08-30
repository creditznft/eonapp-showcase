import assert from 'node:assert/strict';
import test from 'node:test';
import { createCityEngineStageQueue, getCityEngineStagePlan } from '../../assets/js/city/eon-city-engine-staging.js';

test('CITY-ENGINE stages balanced City detail in deterministic frame order', () => {
  const scheduled = [];
  const ran = [];
  const queue = createCityEngineStageQueue({ requestFrame: (callback) => { scheduled.push(callback); return scheduled.length; }, cancelFrame: () => {} });
  queue.add('districts', () => ran.push('districts'));
  queue.add('street-life', () => ran.push('street-life'));
  queue.add('atmosphere', () => ran.push('atmosphere'));
  queue.add('cinematic', () => ran.push('cinematic'));
  queue.start();
  while (scheduled.length) scheduled.shift()(0);
  assert.deepEqual(ran, ['districts', 'street-life', 'atmosphere']);
  assert.deepEqual(queue.getSummary().stages.map((stage) => [stage.id, stage.status]), [['districts', 'complete'], ['street-life', 'complete'], ['atmosphere', 'complete'], ['cinematic', 'skipped']]);
});

test('CITY-ENGINE respects reduced motion and Lite profile stage exclusions', () => {
  const lite = getCityEngineStagePlan({ quality: 'lite', reducedMotion: false });
  const reduced = getCityEngineStagePlan({ quality: 'cinematic', reducedMotion: true });
  assert.equal(lite.stages.find((stage) => stage.id === 'atmosphere').enabled, false);
  assert.equal(reduced.stages.find((stage) => stage.id === 'cinematic').enabled, false);
  assert.equal(reduced.stages.find((stage) => stage.id === 'districts').enabled, true);
});
