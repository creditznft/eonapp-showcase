import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildEonNexusW705AtlasEntryModel, getEonNexusW705AtlasEntryTruth } from '../../assets/js/nexus/w705/eon-nexus-w705-atlas-entry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W705 provides four useful explicit Atlas actions without a project', () => {
  const model = buildEonNexusW705AtlasEntryModel({ route: { href: '/create' }, conversation: { label: 'Current creator work' } });
  assert.deepEqual(model.actions.map((action) => action.id), ['create-project', 'choose-project', 'explore-city', 'continue-work']);
  assert.equal(model.actions[0].href, '/projects?new=1');
  assert.equal(model.actions[2].href, '/eoncity?from=nexus-atlas');
  assert.equal(model.actions[3].href, '/create');
  assert.equal(model.fakeProjectGenerated, false);
});

test('W705 every visible Atlas command opens Atlas even when no project is selected', () => {
  const live = read('assets/js/nexus/eon-nexus-live.js');
  assert.match(live, /receipt\.action === 'request-atlas'[\s\S]*setTab\('atlas'/);
  assert.match(live, /focusAtlas\.addEventListener\('click',[\s\S]*setTab\('atlas'/);
  assert.match(live, /atlasCommand\.addEventListener\('click',[\s\S]*setTab\('atlas'/);
  assert.match(live, /openAtlas\(requestedMode = mode\)/);
});

test('W705 Atlas empty state renders real first-step anchors and no fake records', () => {
  const atlas = read('assets/js/nexus/eon-nexus-project-atlas.js');
  assert.match(atlas, /buildEonNexusW705AtlasEntryModel/);
  assert.match(atlas, /data\.atlasEntryAction|dataset\.atlasEntryAction/);
  assert.match(atlas, /No fake milestones or activity are generated/);
  assert.match(atlas, /opensWithoutSelectedProject: true/);
});

test('W705 direct Atlas and create-project links are consumed by their target surfaces', () => {
  const shell = read('assets/js/nexus/eon-nexus-app-shell.js');
  const projects = read('assets/js/projects/eon-projects-page.js');
  const projectModel = read('assets/js/projects/w704/eon-projects-w704-command-workspace.js');
  assert.match(shell, /get\('nexus'\) === 'atlas'/);
  assert.match(shell, /openAtlas\?\.\(\)/);
  assert.match(projects, /get\('new'\) === '1'/);
  assert.match(projectModel, /href: '\/projects\?view=atlas'/);
});

test('W705 truth stays explicit, local and non-executing', () => {
  const truth = getEonNexusW705AtlasEntryTruth();
  assert.equal(truth.atlasOpensWithoutProject, true);
  assert.equal(truth.projectDataRemainsEmpty, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticProjectCreation, false);
  assert.equal(truth.automaticCityEntry, false);
  assert.equal(truth.startsAiWork, false);
});
