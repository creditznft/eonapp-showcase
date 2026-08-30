import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  HOME_REDIRECT,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS,
  ROUTE_CONTRACT_VERSION,
  createDevRouteRewrites,
  renderCloudflareRedirects,
  validateRouteContract
} from '../../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function row(from) {
  return RETIRED_REDIRECTS.find((entry) => entry.from === from);
}

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W380 defines one valid root-first route contract', () => {
  assert.match(ROUTE_CONTRACT_VERSION, /^eonapp\.w\d+\.[a-z0-9.-]+\.v\d+$/);
  assert.deepEqual(validateRouteContract(), []);
  assert.deepEqual(HOME_REDIRECT, { id: 'home', from: '/', to: '/index.html', status: 200, lifecycle: 'live' });

  for (const [from, file] of [
    ['/', 'index.html'], ['/projects', 'projects.html'], ['/library', 'library.html'], ['/workspace', 'workspace.html'], ['/forge', 'forge.html'],
    ['/eoncity', 'eoncity.html'], ['/market', 'market.html'], ['/insights', 'trade.html'],
    ['/automations', 'automations.html'], ['/profile', 'profile.html'], ['/vault', 'vault.html'], ['/capsule', 'capsule.html'],
    ['/local-ai', 'local-ai.html'], ['/realm-studio', 'realm-studio.html']
  ]) {
    const route = PRIMARY_APP_ROUTES.find((entry) => entry.from === from);
    assert.equal(route?.file, file, `${from} maps to ${file}`);
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} exists`);
  }
});

test('W423 keeps one public Babylon City while old map, tour and play URLs redirect', () => {
  assert.equal(PRIMARY_APP_ROUTES.filter((entry) => entry.from.startsWith('/eoncity')).length, 1);
  assert.deepEqual(row('/eoncity/lite'), { from: '/eoncity/lite', to: '/eoncity', status: 301 });
  assert.deepEqual(row('/eoncity/tour'), { from: '/eoncity/tour', to: '/eoncity', status: 301 });
  assert.deepEqual(row('/eoncity/3d'), { from: '/eoncity/3d', to: '/eoncity', status: 301 });
  assert.deepEqual(row('/eoncity/play'), { from: '/eoncity/play', to: '/eoncity', status: 301 });
});

test('W380 keeps legacy chat links compatible while the root owns the public chat', () => {
  const redirects = renderCloudflareRedirects();
  assert.match(redirects, /^\/chat \/ 301$/m);
  assert.match(redirects, /^\/chat\.html \/ 301$/m);
  assert.match(redirects, /^\/index\.html \/ 301$/m);
  assert.equal(PRIMARY_APP_ROUTES.some((entry) => entry.from === '/chat'), false);
  assert.deepEqual(row('/vault/backup'), { from: '/vault/backup', to: '/capsule', status: 301 });
  assert.deepEqual(row('/vault-backup.html'), { from: '/vault-backup.html', to: '/capsule', status: 301 });
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('legacy aliases remain explicit and rewards stay outside primary routing', () => {
  for (const [from, to] of [
    ['/automation', '/automations'], ['/automate', '/automations'], ['/automation-studio.html', '/automations'],
    ['/eon-browser.html', '/workspace'], ['/workbench.html', '/workspace'], ['/marketplace.html', '/market'],
    ['/realmworld.html', '/eoncity'], ['/trade/sandbox', '/insights'], ['/subscription.html', '/archive'],
    ['/tools/*', '/workspace'], ['/games/*', '/archive']
  ]) {
    assert.deepEqual(row(from), { from, to, status: 301 });
  }
  assert.equal(PRIMARY_APP_ROUTES.some((entry) => entry.from === '/rewards'), false);
});

test('generated redirect files are identical, conflict-free, and match the contract', () => {
  const expected = renderCloudflareRedirects();
  assert.equal(expected.includes('\r'), false);
  assert.equal(read('_redirects').includes('\r'), false);
  assert.equal(read('public/_redirects').includes('\r'), false);
  assert.equal(read('_redirects'), expected);
  assert.equal(read('public/_redirects'), expected);

  const origins = expected.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/)[0]);
  assert.equal(new Set(origins).size, origins.length);
});

test('development rewrites keep root on index.html and avoid retired source pages', () => {
  const rewrites = createDevRouteRewrites();
  assert.equal(rewrites.get('/'), '/index.html');
  assert.equal(rewrites.get('/chat'), '/index.html');
  assert.equal(rewrites.get('/automation'), '/automations.html');
  assert.equal(rewrites.get('/trade/sandbox'), '/trade.html');
  assert.equal(rewrites.get('/subscription'), '/archive.html');
  assert.equal(rewrites.get('/capsule'), '/capsule.html');
  assert.equal(rewrites.get('/vault/backup'), '/capsule.html');
  assert.equal(rewrites.get('/realmworld'), '/eoncity.html');
});


test('W448 exposes Research Lab at /insights and retires the legacy /trade entry', () => {
  assert.deepEqual(PRIMARY_APP_ROUTES.find((entry) => entry.from === '/insights') && { file: PRIMARY_APP_ROUTES.find((entry) => entry.from === '/insights').file, lifecycle: PRIMARY_APP_ROUTES.find((entry) => entry.from === '/insights').lifecycle }, { file: 'trade.html', lifecycle: 'local-research' });
  assert.deepEqual(row('/trade'), { from: '/trade', to: '/insights', status: 301 });
  assert.deepEqual(row('/trade.html'), { from: '/trade.html', to: '/insights', status: 301 });
});
