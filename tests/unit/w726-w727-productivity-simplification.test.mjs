import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W726 keeps beginner actions first and collapses advanced creation and project handoff tools', () => {
  const create = read('assets/js/create/eon-create-hub.js');
  const projects = read('assets/js/projects/eon-projects-page.js');
  assert.match(create, /Choose the result you want/);
  assert.match(create, /<summary>Advanced creation workspaces<\/summary>/);
  assert.ok(create.indexOf('eon-create-layout') < create.indexOf('Advanced creation workspaces'));
  assert.match(projects, /<summary>Review or export a local project handoff<\/summary>/);
  assert.match(projects, /Project workspace/);
});

test('W727 makes Library distinct and moves the legacy workspace behind disclosure', () => {
  const workspace = read('assets/js/eon-workspace-pages.js');
  assert.match(workspace, /<h2>Reusable local work<\/h2>/);
  assert.match(workspace, /Data and recovery/);
  assert.match(workspace, /<summary>Advanced workspace tools<\/summary>/);
  assert.ok(workspace.indexOf('Current local work') < workspace.indexOf('Advanced workspace tools'));
});
