import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  W137_BUTTON_MATRIX_GROUPS,
  W137_CANONICAL_WORKSTATION_ROUTE,
  W137_REQUIRED_WORKSTATION_APPS,
  W137_ROUTE_ALIASES,
  W137_WORKSTATION_SCHEMA
} from '../../assets/js/utils/w137-workstation-consolidation-contract.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W137 defines EON Browser as the canonical workstation route', () => {
  assert.equal(W137_WORKSTATION_SCHEMA, 'eonapp.w137.workstation-consolidation.v1');
  assert.equal(W137_CANONICAL_WORKSTATION_ROUTE, '/eon-browser.html');
  assert.ok(W137_REQUIRED_WORKSTATION_APPS.length >= 10);
  assert.ok(W137_ROUTE_ALIASES.some(([from, to]) => from === '/build' && to === '/eon-browser.html'));
});

test('EON Browser exposes all primary launcher apps without old redirect-only app cards', () => {
  const html = read('eon-browser.html');
  for (const app of W137_REQUIRED_WORKSTATION_APPS) {
    assert.ok(html.includes(`data-ew-open="${app.route}"`) || read('assets/js/eon-workstation-page.js').includes(`url: '${app.route}'`), `${app.id} launcher missing`);
  }
  assert.doesNotMatch(html, /data-app-url="\/build"|data-app-url="\/create"|data-app-url="\/trade"/);
});

test('Workstation controller intercepts internal launchers and honors initial app query aliases', () => {
  const js = read('assets/js/eon-workstation-page.js');
  assert.match(js, /WORKSTATION_ROUTE_ALIASES/);
  assert.match(js, /WORKSTATION_QUERY_APP_ALIASES/);
  assert.match(js, /installGlobalWorkstationRouting/);
  assert.match(js, /event\.preventDefault\(\)/);
  assert.match(js, /applyInitialWorkstationRoute/);
  assert.match(js, /w137Version: '5\.0\.0-w137'/);
});

test('Device Lab and Code Showcase have visible, accessible routes', () => {
  assert.match(read('workbench.html'), /id="device-lab"/);
  assert.match(read('workbench.html'), /data-w137-device-lab-section="true"/);
  assert.match(read('assets/js/workbench-page.js'), /initW137WorkbenchAliasRouting/);
  assert.match(read('assets/js/realm3d/realm-code-preview.js'), /data-w137-code-showcase="standalone-visible"/);
  assert.match(read('realm-code-preview.html'), /unsafe-inline/);
});

test('W137 button matrix groups are explicit', () => {
  const ids = W137_BUTTON_MATRIX_GROUPS.map((group) => group.id);
  for (const id of ['command-deck', 'workstation-app-list', 'workbench-alias', 'device-lab-anchor', 'code-showcase-standalone']) {
    assert.ok(ids.includes(id), `${id} missing`);
  }
});

test('W137 gate writes workstation stats', () => {
  const statsPath = path.join(root, 'tmp', 'w137-workstation-consolidation-stats.json');
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w137-workstation-consolidation-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W137_WORKSTATION_SCHEMA);
  assert.equal(stats.ok, true);
});
