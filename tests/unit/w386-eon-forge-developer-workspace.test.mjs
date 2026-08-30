import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W386 upgrades EON Forge into a local developer workspace while preserving local preview and manual deployment boundaries', () => {
  const html = read('forge.html');
  const forge = read('assets/js/forge/eon-forge-quick-build.js');
  const css = read('assets/css/eon-forge.css');

  assert.match(html, /data-eon-forge="w(?:38[67]|648)"/);
  assert.match(forge, /EON Forge (?:AI )?Developer Workspace/);
  assert.match(forge, /eon-forge-local-project\.v[23]/);
  assert.match(forge, /runProjectChecks/);
  assert.match(forge, /Local revision history/);
  assert.match(forge, /sandbox="allow-scripts"/);
  assert.match(forge, /Content-Security-Policy/);
  assert.match(forge, /connect-src 'none'/);
  assert.match(forge, /manual export only/);
  assert.match(forge, /GitHub, hosting and publishing remain separate|GitHub, Cloudflare and publishing are not connected|GitHub publishing is review-first|review branch and PR/);
  assert.match(forge, /Ctrl\/Cmd \+ S saves a revision/);
  assert.doesNotMatch(forge, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon/);
  assert.match(css, /eon-forge-code-input/);
  assert.match(css, /eon-forge-line-numbers/);
  assert.match(css, /eon-forge-preview-frame-wrap\.is-mobile/);
  assert.match(css, /@media \(max-width:650px\)/);
});

import { EON_FORGE_QUICK_BUILD } from '../../assets/js/forge/eon-forge-quick-build.js';

test('W386 keeps source checks and preview hardening deterministic without a browser connection', () => {
  const project = EON_FORGE_QUICK_BUILD.buildProject({
    title: 'Forge Test',
    brief: 'Build a calm local test page with a clear contact action.',
    type: 'website',
    style: 'graphite'
  });
  assert.equal(project.schema, 'eon-forge-local-project.v3');
  assert.ok(project.history.length >= 1);
  assert.ok(project.files['README.md'].includes('Forge Test'));

  const preview = EON_FORGE_QUICK_BUILD.composePreview(project.files);
  assert.match(preview, /Content-Security-Policy/);
  assert.match(preview, /connect-src 'none'/);
  assert.match(preview, /<style>/);
  assert.match(preview, /EON Forge starter loaded/);

  const safe = EON_FORGE_QUICK_BUILD.runProjectChecks(project.files);
  assert.equal(safe.errors.length, 0);

  const unsafe = EON_FORGE_QUICK_BUILD.runProjectChecks({
    ...project.files,
    'script.js': `const key = "${['sk', 'abcdefghijklmnopqrstuvwxyz123456'].join('-')}";`
  });
  assert.ok(unsafe.errors.some((entry) => entry.title === 'Possible secret found'));

  assert.deepEqual(EON_FORGE_QUICK_BUILD.lineDelta('one\ntwo', 'one\nthree'), { changed: true, added: 1, removed: 1 });
});
