import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { installEonContinueSurface } from '../../assets/js/retention/eon-continue-surface.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

test('L95 shell has one project-continuity owner when Active Project is visible', () => {
  const main = { prepend() { throw new Error('generic Continue must not mount'); } };
  const doc = {
    body: { dataset: { eonAppPage: 'chat' } },
    querySelector(selector) {
      if (selector === 'main') return main;
      if (selector === '[data-eon-w630-project-strip]') return { dataset: { eonW630ProjectStrip: '1' } };
      return null;
    }
  };
  const result = installEonContinueSurface({ document: doc, localStorage: memoryStorage(), sessionStorage: memoryStorage() });
  assert.equal(result.installed, false);
  assert.equal(result.reason, 'active-project-strip-owns-continuity');
});

test('L95 removes the redundant floating help bubble while preserving Help in Quick Command', () => {
  const wholeApp = read('assets/js/shell/eon-whole-app-ux.js');
  const quick = read('assets/js/command/eon-command-surface.js');
  assert.match(wholeApp, /persistentHelpBubble:\s*false/);
  assert.doesNotMatch(wholeApp, /helpLink\.className\s*=\s*'eon-w630-context-help'/);
  assert.match(quick, /<a href="\/help">Help<\/a>/);
});

test('L95 Quick Command registers a composer-aware safe zone instead of covering Send', () => {
  const js = read('assets/js/command/eon-command-surface.js');
  const css = read('assets/css/eon-command-surface.css');
  assert.match(js, /installOrbSafeZone/);
  assert.match(js, /data-eonbot-home-composer/);
  assert.match(js, /getBoundingClientRect/);
  assert.match(js, /ResizeObserver/);
  assert.match(js, /visualViewport/);
  assert.match(js, /layoutHeight\s*-\s*rect\.top\s*\+\s*12/);
  assert.match(css, /--eon-command-safe-bottom/);
  assert.match(css, /body\[data-eon-app-page="chat"\]\s+\.eon-command-host/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.eon-command-orb-label \{ display: none; \}/);
});

test('L95 shell installs Active Project before generic Continue so dedupe is deterministic', () => {
  const shell = read('assets/js/eon-app-shell.js');
  assert.ok(shell.indexOf('installW630WholeAppUx();') < shell.indexOf('installEonContinueSurface();'));
});

test('L95 narrow chat header collapses Share and Profile into the overflow menu', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const css = read('assets/css/eon-chat-first.css');
  assert.match(shell, /data-eon-header-action="share">Share EONAPP/);
  assert.match(shell, /data-eon-header-action="profile">Profile &amp; settings/);
  assert.match(shell, /if \(action === 'share'\) void openShare\(\)/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.eon-chat-header-share,[\s\S]*\.eon-chat-header-account[\s\S]*display: none !important/);
});

test('L95 active project strip consumes layout space instead of overlaying chat chrome', () => {
  const wholeApp = read('assets/js/shell/eon-whole-app-ux.js');
  const shellCss = read('assets/css/eon-app-shell.css');
  const homeCss = read('assets/css/eonbot-home.css');
  assert.match(wholeApp, /doc\.body\.dataset\.eonProjectContext = 'active'/);
  assert.match(shellCss, /body\[data-eon-app-page="chat"\] \.eon-w630-project-strip[\s\S]*height: 3\.25rem/);
  assert.match(shellCss, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: minmax\(0,1fr\) auto auto/);
  assert.match(homeCss, /body\.eonbot-home\[data-eon-project-context="active"\] \.eonbot-home-container[\s\S]*100dvh - 3\.25rem/);
});
