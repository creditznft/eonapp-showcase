import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_COMPACT_PRIMARY_NAVIGATION,
  getEonShellNavigationItems,
  resolveEonShellPage
} from '../../assets/js/shell/eon-shell-navigation.js';
import {
  EON_CREATE_EXECUTION_RAILS,
  EON_CREATE_MODES,
  getEonCreateMode,
  validateEonCreateCatalog
} from '../../assets/js/create/eon-create-catalog.js';
import { getRouteRow } from '../../config/route-contract.mjs';
import { inspectW623eInformationArchitecture } from '../../scripts/w623e-information-architecture-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W623E freezes one beginner-first primary sidebar', () => {
  assert.deepEqual(EONAPP_COMPACT_PRIMARY_NAVIGATION.map((item) => item.id), ['chat', 'create', 'projects', 'library', 'eoncity']);
  assert.equal(EONAPP_COMPACT_PRIMARY_NAVIGATION.every((item) => item.href && !item.action), true);
  assert.equal(getEonShellNavigationItems().some((item) => item.label === 'Tools' || item.label === 'Studio'), false);
  assert.equal(resolveEonShellPage({ pathname: '/forge' }), 'create');
  assert.equal(resolveEonShellPage({ pathname: '/market' }), 'create');
  assert.equal(resolveEonShellPage({ pathname: '/eoncity' }), 'eoncity');
});

test('W623E Create catalogue exposes all seven outcomes with honest execution rails', () => {
  assert.deepEqual(EON_CREATE_MODES.map((mode) => mode.id), ['image', 'video', 'music', 'website', 'project', 'automation', 'guide']);
  assert.deepEqual(EON_CREATE_EXECUTION_RAILS, ['local-runtime', 'direct-user-owned-byok', 'guide']);
  assert.equal(validateEonCreateCatalog().ok, true);
  assert.equal(getEonCreateMode('video').primary.kind, 'chat');
  assert.match(getEonCreateMode('video').truth, /real saved video through EONAPP/i);
  assert.equal(getEonCreateMode('website').primary.href, '/forge');
  assert.equal(getEonCreateMode('automation').primary.href, '/automations');
});

test('W623E makes Create canonical and old product names compatibility-only', () => {
  assert.equal(getRouteRow('/create')?.status, 200);
  assert.equal(getRouteRow('/create')?.file, 'create.html');
  for (const route of ['/apps', '/studio', '/collection', '/tools', '/creator-studio']) {
    assert.equal(getRouteRow(route)?.to, '/create', route);
    assert.equal(getRouteRow(route)?.status, 301, route);
  }
  assert.equal(getRouteRow('/market')?.lifecycle, 'compatibility-hidden');
  assert.match(read('assets/js/market/eon-market-page.js'), /Compatibility preview/);
});

test('W623E Create page and shell keep keyboard, mobile drawer and account destinations predictable', () => {
  const html = read('create.html');
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(html, /Skip to Create choices/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-eon-app-page="create"/);
  assert.match(shell, /getEonShellDrawerAccessibilityState/);
  for (const route of ['/profile', '/billing', '/eon-keys', '/vault', '/settings', '/help', '/install']) assert.match(shell, new RegExp(`href="${route.replace('/', '\\/')}"`));
  assert.doesNotMatch(shell, /Studio \/ Collection|Open Apps|renderAppsPanel/);
});

test('W623E standalone gate passes', () => {
  const report = inspectW623eInformationArchitecture();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.deepEqual(report.counts, {
    primaryNavigationItems: 5,
    createModes: 7,
    legacyAliasesRedirected: 10,
    accountDestinations: 7
  });
});
