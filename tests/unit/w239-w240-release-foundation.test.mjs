import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { RETIRED_REDIRECTS } from '../../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const route = (from) => RETIRED_REDIRECTS.find((entry) => entry.from === from);

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W239 quarantines nested legacy Tool and Game routes before production output', () => {
  assert.deepEqual(route('/tools/*'), { from: '/tools/*', to: '/workspace', status: 301 });
  assert.deepEqual(route('/games/*'), { from: '/games/*', to: '/archive', status: 301 });

  const vite = read('vite.config.mjs');
  assert.match(vite, /RETIRED_ENTRY_DIRECTORIES/);
  assert.match(vite, /RETIRED_ENTRY_DIRECTORIES\.has\(entry\)/);

  const gate = read('scripts/w239-public-output-quarantine-gate.mjs');
  assert.match(gate, /for \(const relative of \['tools', 'games'\]\)/);
  assert.match(gate, /path\.join\(dist, relative\)/);
  assert.match(gate, /\/tools\/\*/);
  assert.match(gate, /\/games\/\*/);
});

test('R4-COMM-01 makes Graphite the default and migrates retired legacy theme values safely', () => {
  const storage = read('assets/js/utils/storage.js');
  const profile = read('profile.html');
  assert.match(storage, /EON_THEME_DEFAULT = 'graphite'/);
  assert.match(storage, /EON_THEME_EXPLICIT_KEY/);
  assert.match(storage, /Older Classic EON\/System values migrate to Graphite/i);
  assert.match(storage, /\['graphite', 'obsidian', 'ember'\]/);

  const graphiteIndex = profile.indexOf('data-eon-theme-choice="graphite"');
  const obsidianIndex = profile.indexOf('data-eon-theme-choice="obsidian"');
  const emberIndex = profile.indexOf('data-eon-theme-choice="ember"');
  assert.ok(graphiteIndex >= 0 && obsidianIndex > graphiteIndex && emberIndex > obsidianIndex, 'profile presents Graphite, Obsidian, then Ember.');
});
