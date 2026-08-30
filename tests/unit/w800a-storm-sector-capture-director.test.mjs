import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW800AStormCaptureDirector } from '../../assets/js/city/w800/eon-expanse-w800a-storm-sector-capture-director.js';

test('W800A requires an explicit verified-action handoff', () => {
  const capture = createEonExpanseW800AStormCaptureDirector({ now: () => 1000 });
  assert.equal(capture.record({ type: 'objective', objectiveId: 'review-weather-array' }).reason, 'explicit-user-action-required');
  assert.equal(capture.derive({ regionActive: true, at: 1000 }).available, false);
});

test('W800A creates a privacy-safe local objective capture moment', () => {
  const capture = createEonExpanseW800AStormCaptureDirector({ now: () => 1000 });
  const recorded = capture.record({ type: 'objective', objectiveId: 'review-weather-array', label: 'Weather array reviewed' }, { explicitUserAction: true });
  assert.equal(recorded.ok, true);
  const view = capture.derive({ regionActive: true, at: 1100 });
  assert.equal(view.available, true);
  assert.equal(view.context.regionId, 'storm-sector');
  assert.equal(view.context.localCaptureOnly, true);
  assert.equal(view.context.includesPrivateContent, false);
  assert.equal(view.recordsAutomatically, false);
  assert.equal(view.publishesAutomatically, false);
  assert.equal(view.awardsXp, false);
});

test('W800A accepts mission and region milestones but never posts automatically', () => {
  let clock = 2000;
  const capture = createEonExpanseW800AStormCaptureDirector({ now: () => clock });
  assert.equal(capture.record({ type: 'mission', missionId: 'weather-restoration' }, { explicitUserAction: true }).ok, true);
  assert.equal(capture.derive({ regionActive: true, at: clock }).source, 'storm-sector-mission');
  clock = 3000;
  assert.equal(capture.record({ type: 'region', missionId: 'storm-sector' }, { explicitUserAction: true }).ok, true);
  const region = capture.derive({ regionActive: true, at: clock });
  assert.equal(region.source, 'storm-sector-restored');
  assert.equal(region.uploadsAutomatically, false);
  assert.equal(region.publicPostingRequired, undefined);
  assert.equal(region.context.publicPostingRequired, false);
});

test('W800A expires and resets without persistence or progression', () => {
  const capture = createEonExpanseW800AStormCaptureDirector({ now: () => 1000, ttlMs: 30000 });
  capture.record({ type: 'mission', missionId: 'relay-repair' }, { explicitUserAction: true });
  assert.equal(capture.derive({ regionActive: false, at: 1100 }).available, false);
  assert.equal(capture.derive({ regionActive: true, at: 32000 }).available, false);
  capture.record({ type: 'mission', missionId: 'relay-repair' }, { explicitUserAction: true });
  capture.reset('return-signal-frontier');
  assert.equal(capture.derive({ regionActive: true, at: 1200 }).available, false);
});
