import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { getEonNexusW668CommandModel } from '../../assets/js/nexus/w668/eon-nexus-w668-command-model.js';
import { getEonNexusProjectAtlasSpatialModel } from '../../assets/js/nexus/eon-nexus-project-atlas.js';

function source(path) { return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'); }

const base = Object.freeze({
  conversationRoute: '/?thread=one', projectRoute: '/projects?project=one', reviewRoute: '/workspace?review=one', resultRoute: '/workspace?result=one',
  projectSelected: true, atlasAvailable: true, reviewVisible: false, resultVisible: false
});

test('W668B exposes one clear next action and no more than three simple paths', () => {
  const normal = getEonNexusW668CommandModel(base, { spatialAvailable: true });
  assert.equal(normal.primary.kind, 'project');
  assert.equal(normal.paths.length, 3);
  assert.deepEqual(normal.paths.map((row) => row.kind), ['project', 'atlas', 'spatial']);
  assert.deepEqual(normal.modeLabels, { conversation: 'Now', agents: 'Nodes', results: 'Activity', atlas: 'Atlas' });
  assert.equal(normal.technicalControlsCollapsed, true);
  assert.equal(normal.startsWork, false);
  assert.equal(normal.autoNavigate, false);
});

test('W668B prioritizes approval, then result, then project, then conversation', () => {
  const approval = getEonNexusW668CommandModel({ ...base, reviewVisible: true, reviewLabel: 'Approve export' });
  const result = getEonNexusW668CommandModel({ ...base, resultVisible: true, resultLabel: 'Open render' });
  const project = getEonNexusW668CommandModel(base);
  const chat = getEonNexusW668CommandModel({ ...base, projectSelected: false, atlasAvailable: false });
  assert.equal(approval.primary.kind, 'review');
  assert.equal(result.primary.kind, 'result');
  assert.equal(project.primary.kind, 'project');
  assert.equal(chat.primary.kind, 'chat');
  assert.ok([approval, result, project, chat].every((model) => model.primary.explicitUserAction && !model.primary.startsWork && !model.primary.autoApprove));
});

test('W668B Atlas distributes rings into separate sectors and marks real attention', () => {
  const atlas = getEonNexusProjectAtlasSpatialModel({
    selected: true, projectId: 'p1', projectLabel: 'EONCITY', projectStatus: 'active', projectRoute: '/projects', completedTaskCount: 1, incompleteCount: 3,
    nextAction: { label: 'Review output', route: '/workspace' },
    tasks: [
      { id: 'todo', label: 'Next task', status: 'todo' },
      { id: 'doing', label: 'Current task', status: 'in-progress' },
      { id: 'done', label: 'Finished task', status: 'done' }
    ],
    conversations: [{ id: 'chat', label: 'Conversation', route: '/?thread=chat' }],
    artifacts: [{ id: 'output', label: 'Output', kind: 'output' }],
    activity: [{ id: 'review', label: 'Review output', state: 'review-needed' }, { id: 'history', label: 'Completed activity', state: 'completed' }],
    limitations: []
  });
  const taskAngles = atlas.nodes.filter((node) => node.sector === 'tasks').map((node) => node.angle);
  const linkedAngles = atlas.nodes.filter((node) => node.sector === 'linked').map((node) => node.angle);
  const historyAngles = atlas.nodes.filter((node) => node.sector === 'history').map((node) => node.angle);
  assert.ok(taskAngles.length && linkedAngles.length && historyAngles.length);
  assert.notEqual(taskAngles[0], linkedAngles[0]);
  assert.notEqual(linkedAngles[0], historyAngles[0]);
  assert.ok(atlas.nodes.some((node) => node.attention === true));
  assert.ok(atlas.attention.some((node) => node.state === 'review-needed'));
});

test('W668B source renders a living signal field, simple command actions and a useful empty Atlas', () => {
  const live = source('assets/js/nexus/eon-nexus-live.js');
  const atlas = source('assets/js/nexus/eon-nexus-project-atlas.js');
  const css = source('assets/css/eon-nexus-live.css');
  assert.match(live, /eon-nexus-live__signal-field/);
  assert.match(live, /primary-command/);
  assert.match(live, /command-atlas/);
  assert.match(live, /\['conversation', 'Now'\]/);
  assert.match(atlas, /Choose one project to give Atlas a clear centre/);
  assert.match(atlas, /data-ring-label|dataset\.ringLabel/);
  assert.match(css, /W668B/);
  assert.match(css, /eon-nexus-live__command-actions/);
  assert.match(css, /eon-nexus-atlas__centre--empty/);
  const w668bCss = css.split('/* W668B')[1] || '';
  assert.doesNotMatch(w668bCss, /calc\([^)]*\*/);
});
