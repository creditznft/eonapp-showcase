import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  W136_BUTTON_AUDIT_GROUPS,
  W136_EONCITY_SCENARIO,
  W136_LIVE_PROOF_SCHEMA,
  W136_MAKEOVER_PRIORITIES,
  W136_PRODUCTION_ROUTES,
  W136_RUNTIME_ERROR_DENYLIST,
  W136_VIEWPORTS
} from '../../assets/js/utils/w136-live-proof-contract.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W136 defines a real desktop/mobile live route proof matrix', () => {
  assert.equal(W136_LIVE_PROOF_SCHEMA, 'eonapp.w136.live-browser-proof.v1');
  assert.ok(W136_PRODUCTION_ROUTES.length >= 16);
  assert.deepEqual(W136_VIEWPORTS.map((viewport) => viewport.id), ['desktop', 'mobile-portrait', 'mobile-landscape']);
  assert.ok(W136_PRODUCTION_ROUTES.some((route) => route.path === '/telegram'));
  assert.ok(W136_PRODUCTION_ROUTES.some((route) => route.path === '/telegram.html'));
});

test('W136 browser runner captures screenshots, console, links, buttons, and EON City scenario', () => {
  const runner = read('scripts/w136-live-browser-proof.mjs');
  assert.match(runner, /page\.on\('console'/);
  assert.match(runner, /page\.on\('pageerror'/);
  assert.match(runner, /page\.screenshot/);
  assert.match(runner, /locator\('a'\)/);
  assert.match(runner, /button, \[role="button"\]/);
  assert.match(runner, /realm-after-play/);
  assert.ok(W136_EONCITY_SCENARIO.steps.includes('verify-hud-is-minimizable-or-compact'));
});

test('W136 denylist includes the exact live blockers from the user audit', () => {
  const denylist = W136_RUNTIME_ERROR_DENYLIST.join('\n');
  assert.match(denylist, /Cannot read properties of null/);
  assert.match(denylist, /addEventListener/);
  assert.match(denylist, /ERR_TOO_MANY_REDIRECTS/);
  assert.match(denylist, /clearcoat/);
});

test('W136 button groups cover nav, footer, Workstation, Market, and Realm HUD', () => {
  const ids = W136_BUTTON_AUDIT_GROUPS.map((group) => group.id);
  for (const id of ['top-nav', 'footer', 'workstation-launchers', 'market-filters', 'realm3d-hud']) {
    assert.ok(ids.includes(id), `${id} should be audited`);
  }
});

test('W136 product makeover boundaries are explicit after proof wave', () => {
  const waves = W136_MAKEOVER_PRIORITIES.map((item) => item.wave);
  for (const wave of ['W137', 'W138', 'W139', 'W140', 'W141', 'W142', 'W143', 'W144']) {
    assert.ok(waves.includes(wave), `${wave} should remain in the expanded roadmap`);
  }
});

test('W136 gate writes route/button matrix stats', () => {
  const statsPath = path.join(root, 'tmp', 'w136-route-button-matrix.json');
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w136-live-browser-proof-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W136_LIVE_PROOF_SCHEMA);
  assert.equal(stats.ok, true);
  assert.equal(stats.gateChecks.missingInternalTargets, 0);
});
