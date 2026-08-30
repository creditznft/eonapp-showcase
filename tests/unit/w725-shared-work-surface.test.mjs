import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  getEonWorkSurfaceDefinition,
  listEonWorkSurfaceDefinitions,
  normalizeEonWorkSurfaceInvocation
} from '../../assets/js/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W725 provides one full-screen shared work-surface registry', () => {
  const ids = listEonWorkSurfaceDefinitions().map((entry) => entry.id);
  for (const required of ['chat', 'create', 'projects', 'library', 'share', 'creator-capture', 'plans', 'command-status', 'automations', 'local-ai', 'help', 'my-realm']) assert.ok(ids.includes(required));
  assert.equal(getEonWorkSurfaceDefinition('membership').id, 'plans');
  assert.equal(normalizeEonWorkSurfaceInvocation({ surface: 'capture', source: 'eoncity', explicitUserAction: true }).id, 'creator-capture');
});

test('W725 host is modal, full-screen, accessible and installed before Quick Command', () => {
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const css = read('assets/css/eon-work-surface.css');
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(host, /aria-modal/);
  assert.match(host, /returnFocus/);
  assert.match(host, /Escape/);
  assert.match(host, /inertSnapshot/);
  assert.match(host, /const alreadyOpen = !root\.hidden/);
  assert.match(host, /Reference: work-surface-unavailable/);
  assert.match(css, /position:fixed;inset:0/);
  assert.match(css, /min-height:100dvh/);
  assert.match(css, /forced-colors:active/);
  assert.ok(shell.lastIndexOf('installEonWorkSurfaceHost') < shell.lastIndexOf('installEonQuickCommandSurface'));
  assert.match(shell, /const workSurface = installEonWorkSurfaceHost[\s\S]*const quickCommand = installEonQuickCommandSurface/);
});

test('W725 Quick Command routes productive work into shared surfaces', () => {
  const registry = read('assets/js/command/eon-command-registry.js');
  const surface = read('assets/js/command/eon-command-surface.js');
  assert.match(registry, /action: 'surface'/);
  assert.match(registry, /surface: 'share'/);
  assert.match(surface, /dispatchEonWorkSurfaceOpen/);
  assert.match(surface, /creator-capture/);
  assert.match(surface, /Plans &amp; access/);
});
