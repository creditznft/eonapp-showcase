import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W128 Workbench opens with six clear Build OS lanes', () => {
  const html = read('workbench.html');
  const lanes = [...html.matchAll(/data-w128-build-lane="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(lanes, ['ask', 'website', 'code', 'creator', 'automation', 'device']);
  assert.match(html, /Build OS · EONBOT · Creator Studio · Device Lab/);
  assert.match(html, /data-w128-build-os="primary"/);
});

test('W128 keeps advanced modes behind drawers and explicit reveal', () => {
  const html = read('workbench.html');
  assert.match(html, /id="legacy-mode-matrix"[^>]*hidden/);
  assert.match(html, /data-w128-toggle-legacy="1"/);
  assert.equal((html.match(/data-w128-drawer="primary"/g) || []).length, 6);
  assert.ok((html.match(/data-w128-drawer="advanced"/g) || []).length >= 4);
  for (const label of ['Hive / Agent board', 'Compute / marketplace', 'Trust / rules', 'Voice / language / browser']) {
    assert.match(html, new RegExp(label.replace(/[\/]/g, '\\$&')));
  }
});

test('W128 Build OS has runtime and responsive Vault-style CSS', () => {
  const js = read('assets/js/workbench-page.js');
  const css = read('assets/css/workbench.css');
  assert.match(js, /function initW128BuildOsShell/);
  assert.match(js, /W128_BUILD_LANE_COPY/);
  assert.match(js, /eonW128BuildOs/);
  assert.match(css, /W128 Vault-style Build OS refactor/);
  assert.match(css, /\.w128-vault-shell/);
  assert.match(css, /@media \(max-width: 860px\)/);
});
