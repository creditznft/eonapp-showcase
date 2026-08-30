import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { EON_FORGE_QUICK_BUILD } from '../../assets/js/forge/eon-forge-quick-build.js';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const LOCAL_IMAGE = 'data:image/png;base64,aGVsbG8=';

test('W387 adds local-only assets, import review and receipts without claiming a connection or deployment', () => {
  const html = read('forge.html');
  const forge = read('assets/js/forge/eon-forge-quick-build.js');
  const css = read('assets/css/eon-forge.css');

  assert.match(html, /data-eon-forge="w387"/);
  assert.match(forge, /EON Forge Integrity and Change Review/);
  assert.match(forge, /eon-forge-local-project\.v3/);
  assert.match(forge, /eon-forge-local-change-receipt\.v1/);
  assert.match(forge, /Import local source/);
  assert.match(forge, /Add local image/);
  assert.match(forge, /Create local copy/);
  assert.match(forge, /Local Forge images are inlined only into this preview/);
  assert.match(forge, /No repository, connection, or publish action occurred/);
  assert.doesNotMatch(forge, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon/);
  assert.match(css, /eon-forge-import-review/);
  assert.match(css, /eon-forge-receipt-list/);
  assert.match(css, /eon-forge-asset-preview/);
});

test('W387 keeps source assets local, detects missing assets, and creates source-free change receipts', () => {
  const project = EON_FORGE_QUICK_BUILD.buildProject({
    title: 'Asset Test',
    brief: 'Build a local source review page with a clear image asset.',
    type: 'website',
    style: 'graphite'
  });
  const withAsset = {
    ...project.files,
    'index.html': project.files['index.html'].replace('</main>', '<img src="assets/demo.png" alt="Demo" /></main>'),
    'assets/demo.png': LOCAL_IMAGE
  };
  const preview = EON_FORGE_QUICK_BUILD.composePreview(withAsset);
  assert.match(preview, /data:image\/png;base64,aGVsbG8=/);
  assert.equal(EON_FORGE_QUICK_BUILD.runProjectChecks(withAsset).errors.length, 0);

  const missing = EON_FORGE_QUICK_BUILD.runProjectChecks({
    ...project.files,
    'index.html': project.files['index.html'].replace('</main>', '<img src="assets/missing.png" alt="Missing" /></main>')
  });
  assert.ok(missing.errors.some((entry) => entry.title === 'Missing local asset: assets/missing.png'));

  const nextFiles = { ...withAsset, 'style.css': `${withAsset['style.css']}\n.demo { display:block; }` };
  const receipt = EON_FORGE_QUICK_BUILD.createChangeReceipt(project, withAsset, nextFiles, EON_FORGE_QUICK_BUILD.runProjectChecks(nextFiles), 'revision-1');
  assert.equal(receipt.storage, 'local-browser-only');
  assert.ok(receipt.changedFiles.some((entry) => entry.path === 'style.css'));
  assert.equal(JSON.stringify(receipt).includes('display:block'), false);
  assert.equal(EON_FORGE_QUICK_BUILD.safeAssetPath('assets/demo.png'), 'assets/demo.png');
  assert.equal(EON_FORGE_QUICK_BUILD.safeAssetPath('../secret.txt'), '');
  assert.deepEqual(EON_FORGE_QUICK_BUILD.projectFileOrder(withAsset).slice(-1), ['assets/demo.png']);
});
