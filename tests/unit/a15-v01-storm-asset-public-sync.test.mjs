import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('V01 publishes the maintained Storm Sector package before City binary content addressing', () => {
  const sync = read('scripts/sync-public-assets.mjs');
  assert.match(sync, /\['assets\/city\/future-regions', 'assets\/city\/future-regions'\]/);
  assert.ok(fs.existsSync(path.join(root, 'assets/city/future-regions/storm-sector/models/storm-command-spire-lod0.glb')));
});

test('V01 build verification follows the A15 redirect-only chat compatibility policy', () => {
  const vite = read('vite.config.mjs');
  const build = read('scripts/build-production.mjs');
  assert.match(vite, /chat\.html and support\.html are[\s\S]*never emitted as application entries/);
  assert.doesNotMatch(build.match(/const required = \[[\s\S]*?\];/)?.[0] || '', /'chat\.html'/);
});

test('V01 keeps the EONBOT landing route below its transfer budget with an interaction-owned chat split', () => {
  const index = read('index.html');
  const bootstrap = read('assets/js/eonbot-home-bootstrap.js');
  for (const deferred of ['eon-app-shell.js', 'chat-page.js', 'eonbot-home.js', 'chat-page-deferred.js']) {
    assert.doesNotMatch(index, new RegExp(`src="/assets/js/${deferred.replace('.', '\\.')}`));
    assert.match(bootstrap, new RegExp(`import\\('./${deferred.replace('.', '\\.')}'\\)`));
  }
  assert.match(index, /src="\/assets\/js\/eonbot-home-bootstrap\.js"/);
  assert.match(bootstrap, /DEFERRED_STYLES/);
  assert.match(bootstrap, /import\('\.\.\/css\/eon-app-shell\.css'\)/);
  assert.doesNotMatch(bootstrap, /['"]\/assets\/css\/eon-app-shell\.css['"]/);
  assert.match(bootstrap, /event\.preventDefault\(\)/);
  assert.match(bootstrap, /document\.getElementById\('chat-send'\)\?\.click\(\)/);
  assert.doesNotMatch(bootstrap, /(?:babylon|storm-sector|assets\/js\/city\/)/i);
  assert.match(bootstrap, /requestIdleCallback/);
  assert.match(bootstrap, /import\('\.\/eon-app-shell\.js'\)/);
});
