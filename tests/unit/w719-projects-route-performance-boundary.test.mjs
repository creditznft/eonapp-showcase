import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W719.9 Projects owns a dedicated route entry instead of the full Workspace controller', () => {
  const page = read('projects.html');
  assert.match(page, /assets\/js\/projects\/eon-projects-page\.js/);
  assert.doesNotMatch(page, /assets\/js\/eon-workspace-pages\.js/);
});

test('W719.9 dedicated Projects entry contains the complete local project workflow', () => {
  const source = read('assets/js/projects/eon-projects-page.js');
  for (const marker of [
    'data-project-command-strip',
    'Project workspace',
    'project-shell',
    'project-resume',
    "get('new') === '1'",
    "renderLockedFeatureSurface('projects'",
    'renderCityBeginnerMission',
    'parseProjectHandoffText'
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('W719.9 Projects entry excludes Workspace-only initial dependencies', () => {
  const source = read('assets/js/projects/eon-projects-page.js');
  for (const forbidden of [
    'creator-suite-2-workspace',
    'creator-engine-workspace',
    'asset-provenance-workspace',
    'media-lifecycle-workspace',
    'eon-share-pack-workspace',
    'eon-remix-card-workspace',
    'eon-collection-workspace',
    'eon-action-gateway-workspace',
    'eon-social-connectors-workspace',
    'forge-remote-deploy-workspace',
    'eon-device-evidence-records',
    'eon-beta-readiness-records',
    'user-approved-social-scheduler'
  ]) assert.doesNotMatch(source, new RegExp(forbidden));
});
