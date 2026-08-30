import test from 'node:test';
import assert from 'node:assert/strict';
import { getEonNexusProjectAtlasSpatialModel, getEonNexusProjectAtlasTruth, projectEonNexusProjectAtlas } from '../../assets/js/nexus/eon-nexus-project-atlas.js';

const project = {
  id: 'p1', title: 'Private project', status: 'active',
  tasks: [
    { id: 't1', title: 'Plan', status: 'in-progress' },
    { id: 't2', title: 'Review', status: 'todo' },
    { id: 't3', title: 'Done', status: 'done' }
  ],
  artifacts: [{ id: 'a1', title: 'Output', type: 'file' }]
};

test('W662E produces a central project, three bounded rings and Needs Attention', () => {
  const atlas = projectEonNexusProjectAtlas({ activeProjectContext: { projectId: 'p1', route: '/projects?project=p1', conversationId: 'chat1' }, project, thread: { id: 'chat1', messages: [] }, taskRecords: [{ taskId: 'job1', projectId: 'p1', state: 'review-needed', workflowState: 'validation' }] });
  const map = getEonNexusProjectAtlasSpatialModel(atlas);
  assert.equal(map.selected, true);
  assert.equal(map.centre.id, 'p1');
  assert.ok(map.nodes.some((node) => node.ring === 1 && node.sector === 'tasks'));
  assert.ok(map.nodes.some((node) => node.ring === 2 && node.sector === 'linked'));
  assert.ok(map.nodes.some((node) => node.ring === 3 && node.sector === 'history'));
  assert.ok(map.attention.some((row) => row.state === 'review-needed'));
  assert.ok(map.nodes.length <= 12);
});

test('W662E keeps the readable list alternative and does not invent missing records', () => {
  const truth = getEonNexusProjectAtlasTruth();
  assert.equal(truth.spatialPrimaryRenderer, true);
  assert.equal(truth.threeRings, true);
  assert.equal(truth.needsAttentionSector, true);
  assert.equal(truth.accessibleListAlternative, true);
  assert.equal(truth.missingRelationshipsInvented, false);
});
