import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getEonShellDrawerAccessibilityState } from '../../assets/js/shell/eon-shell-navigation.js';
import { inspectW617aShellLaunchReadinessGate } from '../../scripts/w617a-shell-launch-readiness-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W617A drawer state makes the closed mobile sidebar inert, not only aria-hidden', () => {
  const closed = getEonShellDrawerAccessibilityState({ mobile: true, open: false });
  assert.deepEqual(closed, Object.freeze({
    drawerState: 'closed',
    sidebarOpen: false,
    backdropOpen: false,
    bodyMenuOpen: false,
    sidebarAriaHidden: 'true',
    sidebarInert: true,
    mainInert: false,
    toggleExpanded: 'false'
  }));

  const open = getEonShellDrawerAccessibilityState({ mobile: true, open: true });
  assert.equal(open.drawerState, 'open');
  assert.equal(open.sidebarAriaHidden, 'false');
  assert.equal(open.sidebarInert, false);
  assert.equal(open.mainInert, true);
  assert.equal(open.toggleExpanded, 'true');
});

test('W617A desktop sidebar remains available and never inherits mobile drawer hiding', () => {
  const desktop = getEonShellDrawerAccessibilityState({ mobile: false, open: true });
  assert.equal(desktop.drawerState, 'desktop');
  assert.equal(desktop.sidebarOpen, false);
  assert.equal(desktop.sidebarAriaHidden, '');
  assert.equal(desktop.sidebarInert, false);
  assert.equal(desktop.mainInert, false);
  assert.equal(desktop.toggleExpanded, 'false');
});

test('W617A app shell applies drawer state on install, close and viewport resize', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(shell, /getEonShellDrawerAccessibilityState/);
  assert.match(shell, /sidebar\.inert = accessibility\.sidebarInert/);
  assert.match(shell, /if \(main\) main\.inert = accessibility\.mainInert/);
  assert.match(shell, /setDrawerOpen\(false, state\);/);
  assert.match(shell, /setDrawerOpen\(sidebar\.classList\.contains\('is-open'\), state\);/);
  assert.match(shell, /sidebar\.dataset\.eonDrawerState = accessibility\.drawerState/);
});

test('W617A legacy bottom navigation label colours meet the launch contrast floor', () => {
  for (const file of ['assets/css/chat.css', 'assets/css/layout.css', 'assets/css/subscription.css', 'assets/css/workbench.css']) {
    const css = read(file);
    assert.doesNotMatch(css, /#64748b|#818cf8|#c4b5fd|#c7d2fe|#a9b5c7/i, file);
    assert.match(css, /#94a3b8|#aebbd0/i, file);
    assert.match(css, /#e0e7ff/i, file);
  }
});

test('W617A standalone gate passes', () => {
  const report = inspectW617aShellLaunchReadinessGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.checks, 10);
});
