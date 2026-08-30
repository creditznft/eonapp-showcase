import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const CORE_ROUTES = [
  'chat.html', 'projects.html', 'library.html', 'workspace.html', 'eoncity.html', 'eoncity-lite.html', 'eoncity-3d.html',
  'market.html', 'trade.html', 'automations.html', 'profile.html', 'vault.html', 'capsule.html',
  'local-ai.html', 'realm-studio.html'
];

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W243 keeps a simple ChatGPT-style public navigation with one canonical EONAPP hierarchy', () => {
  const appShell = read('assets/js/eon-app-shell.js');
  const navigation = read('assets/js/shell/eon-shell-navigation.js');
  const expected = [
    "id: 'chat'", "id: 'projects'", "id: 'library'", "id: 'forge'",
    "id: 'eoncity'", "id: 'vault'", "id: 'search'", "id: 'more'"
  ];
  const positions = expected.map((needle) => navigation.indexOf(needle));
  assert.ok(positions.every((position) => position >= 0), 'all canonical navigation entries exist');
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), 'navigation order is intentional');
  assert.match(appShell, /eon-shell-navigation/);
  assert.match(navigation, /EONAPP_PRODUCT_HIERARCHY/);
  assert.match(navigation, /href: '\/'/);
  assert.match(navigation, /label: 'EONBOT'/);
  assert.match(navigation, /label: 'Forge'/);
  assert.doesNotMatch(navigation, /label: 'AI Cockpit'/);
  assert.doesNotMatch(navigation, /label: 'Apps'/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W243 applies Graphite, Obsidian, or Neon Night before core-route styles render', () => {
  const bootstrap = read('assets/js/eon-theme-bootstrap.js');
  assert.match(bootstrap, /defaultTheme = 'graphite'/);
  assert.match(bootstrap, /obsidian/);
  assert.match(bootstrap, /neon-night/);
  assert.match(bootstrap, /classic-eon/);
  assert.match(bootstrap, /data-eon-theme-bootstrap/);
  assert.doesNotMatch(bootstrap, /localStorage\.setItem/);
  for (const page of CORE_ROUTES) {
    const html = read(page);
    const bootAt = html.indexOf('/assets/js/eon-theme-bootstrap.js');
    const styleAt = html.indexOf('stylesheet');
    assert.ok(bootAt >= 0, `${page} has early theme bootstrap`);
    assert.ok(styleAt < 0 || bootAt < styleAt, `${page} runs bootstrap before stylesheet links`);
  }
});
