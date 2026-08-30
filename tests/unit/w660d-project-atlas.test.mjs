import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EON_NEXUS_PROJECT_ATLAS_LIMITS,
  getEonNexusProjectAtlasTruth,
  projectEonNexusProjectAtlas
} from '../../assets/js/nexus/eon-nexus-project-atlas.js';
import { buildEonNexusPrivacyProjectedState } from '../../assets/js/nexus/eon-nexus-privacy-projection.js';

const project = {
  id: 'project_alpha',
  title: 'Secret launch project',
  status: 'active',
  tasks: [
    { id: 'task_1', title: 'Private research task', status: 'done', updatedAt: '2026-07-18T10:00:00.000Z' },
    { id: 'task_2', title: 'Private build task', status: 'in-progress', updatedAt: '2026-07-19T10:00:00.000Z' },
    { id: 'task_3', title: 'Private validation task', status: 'todo', updatedAt: '2026-07-19T11:00:00.000Z' }
  ],
  artifacts: [
    { id: 'artifact_1', title: 'Private launch brief', type: 'brief', updatedAt: '2026-07-19T09:00:00.000Z' }
  ]
};

const context = {
  projectId: 'project_alpha',
  projectTitle: 'Secret launch project',
  route: '/projects?project=project_alpha',
  conversationId: 'chat_linked'
};

test('W660D Atlas renders one selected project and rejects mismatched project data', () => {
  const atlas = projectEonNexusProjectAtlas({ activeProjectContext: context, project });
  assert.equal(atlas.selected, true);
  assert.equal(atlas.projectId, 'project_alpha');
  assert.equal(atlas.tasks.length, 3);

  const mismatch = projectEonNexusProjectAtlas({ activeProjectContext: context, project: { ...project, id: 'project_other' } });
  assert.equal(mismatch.selected, false);
  assert.equal(mismatch.tasks.length, 0);
  assert.equal(mismatch.artifacts.length, 0);
});

test('W660D Atlas redacts project, task, artifact and conversation labels by default', () => {
  const hidden = projectEonNexusProjectAtlas({
    activeProjectContext: context,
    project,
    thread: { id: 'chat_linked', title: 'Private strategy chat', messages: [{}, {}] },
    detailsOpened: false
  });
  assert.equal(hidden.projectLabel, 'Active project');
  assert.deepEqual(hidden.tasks.map((row) => row.label), ['Task 1', 'Task 2', 'Task 3']);
  assert.equal(hidden.artifacts[0].label, 'Project item 1');
  assert.equal(hidden.conversations[0].label, 'Private related conversation');
  assert.doesNotMatch(JSON.stringify(hidden), /Secret launch|Private research|Private launch brief|Private strategy chat/);

  const opened = projectEonNexusProjectAtlas({
    activeProjectContext: context,
    project,
    thread: { id: 'chat_linked', title: 'Private strategy chat', messages: [{}, {}] },
    detailsOpened: true
  });
  assert.equal(opened.projectLabel, 'Secret launch project');
  assert.equal(opened.tasks[0].label, 'Private research task');
  assert.equal(opened.artifacts[0].label, 'Private launch brief');
  assert.equal(opened.conversations[0].label, 'Private strategy chat');
});

test('W660D Atlas includes only exact project-bound agent activity and remains bounded', () => {
  const taskRecords = Array.from({ length: 14 }, (_, index) => ({
    taskId: `eontask_alpha_${String(index).padStart(2, '0')}`,
    projectId: index === 13 ? 'project_other' : 'project_alpha',
    state: index === 0 ? 'review-needed' : 'completed',
    workflowState: index === 0 ? 'validation' : 'complete',
    artifactIds: index === 0 ? ['artifact_1'] : [],
    updatedAt: new Date(Date.parse('2026-07-19T12:00:00.000Z') - index * 1000).toISOString()
  }));
  const atlas = projectEonNexusProjectAtlas({ activeProjectContext: context, project, taskRecords });
  assert.equal(atlas.activity.length, EON_NEXUS_PROJECT_ATLAS_LIMITS.activity);
  assert.ok(atlas.activity.every((row) => !row.id.includes('other')));
  assert.equal(atlas.nextAction.kind, 'review');
  assert.equal(atlas.nextAction.route, '/workspace');
});

test('W660D Atlas derives incomplete work and a deterministic next action without inventing milestones or files', () => {
  const atlas = projectEonNexusProjectAtlas({ activeProjectContext: { ...context, conversationId: '' }, project });
  assert.equal(atlas.incompleteCount, 2);
  assert.equal(atlas.completedTaskCount, 1);
  assert.equal(atlas.nextAction.kind, 'continue-task');
  assert.match(atlas.limitations.join(' '), /No durable conversation-to-project link/);
  assert.match(atlas.limitations.join(' '), /no distinct milestone records/i);
  assert.match(atlas.limitations.join(' '), /no first-class linked file records/i);
});

test('W660D Atlas travels through the same privacy-projected EON NEXUS snapshot', () => {
  const snapshot = buildEonNexusPrivacyProjectedState({
    activeProjectContext: context,
    project,
    thread: { id: 'chat_linked', title: 'Private strategy chat', messages: [{ role: 'user', text: 'secret' }] },
    taskRecords: [{ taskId: 'eontask_alpha_123456', projectId: 'project_alpha', state: 'running', workflowState: 'research', updatedAt: '2026-07-19T12:00:00.000Z' }],
    now: Date.parse('2026-07-19T12:00:00.000Z')
  });
  assert.equal(snapshot.atlas.selected, true);
  assert.equal(snapshot.atlas.projectId, snapshot.project.id);
  assert.equal(snapshot.atlas.projectLabel, 'Active project');
  assert.equal(snapshot.atlas.activity.length, 1);
  assert.equal(Object.isFrozen(snapshot.atlas), true);
});

test('W660D truth contract owns no project, chat or task runtime', () => {
  const truth = getEonNexusProjectAtlasTruth();
  assert.equal(truth.selectedProjectOnly, true);
  assert.equal(truth.ownsProjectStore, false);
  assert.equal(truth.ownsConversationStore, false);
  assert.equal(truth.ownsTaskRuntime, false);
  assert.equal(truth.labelsRedactedByDefault, true);
  assert.equal(truth.missingRelationshipsInvented, false);
  assert.equal(truth.wholeAccountGalaxy, false);
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.externalEffect, false);
});
