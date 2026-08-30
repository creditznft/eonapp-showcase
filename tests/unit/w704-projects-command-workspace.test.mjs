import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonProjectsW704CommandStrip,
  getEonProjectsW704CommandWorkspaceTruth,
  resolveEonProjectsW704CommandWorkspace
} from '../../assets/js/projects/w704/eon-projects-w704-command-workspace.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W704 resolves one existing active project without creating or opening anything', () => {
  const model = resolveEonProjectsW704CommandWorkspace({ projects: [
    { id: 'p1', title: 'Paused', status: 'paused', tasks: [], artifacts: [] },
    { id: 'p2', title: 'Launch', summary: 'Ship safely', status: 'active', tasks: [{ id: 't1' }], artifacts: [] }
  ] });
  assert.equal(model.activeProjectId, 'p2');
  assert.equal(model.ownsSingleResumeSurface, true);
  assert.equal(model.automaticNavigation, false);
});

test('W704 command strip is useful with and without a project', () => {
  const ready = buildEonProjectsW704CommandStrip(resolveEonProjectsW704CommandWorkspace({ projects: [{ id: 'p1', title: 'Launch', status: 'active', tasks: [], artifacts: [] }] }));
  const empty = buildEonProjectsW704CommandStrip(resolveEonProjectsW704CommandWorkspace());
  assert.equal(ready.primaryAction.id, 'resume-project');
  assert.equal(ready.secondaryActions.some((action) => action.id === 'open-atlas'), true);
  assert.equal(empty.primaryAction.id, 'create-project');
  assert.equal(empty.automaticAction, false);
});

test('W704 removes all three duplicate Projects continuation owners', () => {
  const page = read('projects.html');
  const continueSurface = read('assets/js/retention/eon-continue-surface.js');
  const wholeApp = read('assets/js/shell/eon-whole-app-ux.js');
  const workspace = read('assets/js/projects/eon-projects-page.js');
  assert.equal(page.includes('installW631ContinuityPanel'), false);
  assert.match(continueSurface, /pageType === 'projects'.*projects-own-command-workspace/s);
  assert.match(wholeApp, /context && pageType !== 'projects'/);
  assert.match(workspace, /data-project-command-strip/);
  assert.match(workspace, /Project workspace/);
});

test('W704 truth contract is local, non-executing and non-navigating', () => {
  const truth = getEonProjectsW704CommandWorkspaceTruth();
  assert.equal(truth.oneResumeSurfaceOnProjects, true);
  assert.equal(truth.createsProjectAutomatically, false);
  assert.equal(truth.startsAiAutomatically, false);
  assert.equal(truth.writesStorage, false);
  assert.equal(truth.performsNavigation, false);
});
