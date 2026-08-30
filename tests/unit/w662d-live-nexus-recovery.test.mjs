import test from 'node:test';
import assert from 'node:assert/strict';
import { getEonNexusLiveTruth, getEonNexusLiveViewModel } from '../../assets/js/nexus/eon-nexus-live.js';

test('W662D resolves contradictory Ready/Complete signals into one truthful narrative', () => {
  const running = getEonNexusLiveViewModel({
    eonbot: { state: 'complete', statusLabel: 'Complete' },
    task: { id: 'task', state: 'running', stageLabel: 'Validating', cancellable: true },
    approval: { pending: false }, results: { count: 0 }, connection: { state: 'available' }, nodes: []
  });
  assert.equal(running.state, 'processing');
  assert.equal(running.stateLabel, 'Working');
  assert.match(running.statusSummary, /Validating/);

  const emptyComplete = getEonNexusLiveViewModel({
    eonbot: { state: 'complete' }, task: {}, results: { count: 0 }, approval: {}, connection: { state: 'available' }, nodes: []
  });
  assert.equal(emptyComplete.state, 'ready');
  assert.equal(emptyComplete.taskStage, 'Ready for your next action');
});

test('W662D models the approved command field and explicit Spatial Nexus handoff', () => {
  const truth = getEonNexusLiveTruth();
  assert.equal(truth.visualCommandFieldPercent.minimum, 55);
  assert.equal(truth.visualCommandFieldPercent.maximum, 65);
  assert.equal(truth.maximumPrimaryNodes, 5);
  assert.equal(truth.mobileVisualFieldAndSheet, true);
  assert.equal(truth.spatialNexusExplicitHandoff, true);
  assert.equal(truth.rendersFakeProgress, false);
});
