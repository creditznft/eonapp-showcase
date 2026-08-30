import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';

import {
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusPageContext,
  shouldInstallEonNexusAppShell
} from '../../assets/js/nexus/eon-nexus-app-shell.js';
import {
  EON_CITY_W660_NEXUS_STATIONS
} from '../../assets/js/city/w660/eon-city-w660-nexus-stations.js';
import {
  createEonCityW660NexusHologram
} from '../../assets/js/city/w660/eon-city-w660-nexus-hologram.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function standaloneDocument(page) {
  return { body: { dataset: { eonNexusShell: '1', eonAppPage: page } } };
}

function adapter() {
  const snapshot = { eonbot: { state: 'ready' }, route: { privateOnDevice: false }, approval: { pending: false }, results: { count: 0 }, project: { selected: false } };
  return { start() {}, getSnapshot: () => snapshot, subscribe: () => () => {}, dispose() {} };
}

test('W660O mounts restrained Nexus continuity on Billing and Support without replacing their site shell', () => {
  for (const [file, page] of [['billing.html', 'billing'], ['support.html', 'support']]) {
    const html = read(file);
    assert.match(html, new RegExp(`data-eon-nexus-shell="1"[^>]*data-eon-app-page="${page}"`));
    assert.match(html, /\/assets\/js\/nexus\/eon-nexus-page-bootstrap\.js/);
    assert.equal(shouldInstallEonNexusAppShell({ page, document: standaloneDocument(page) }), true);
    assert.equal(getEonNexusPageContext(page)?.presentation, 'restrained');
    assert.equal(getEonNexusPageContext(page)?.allowLiveNexus, false);
  }
  assert.equal(EON_NEXUS_PAGE_CONTEXTS.support.route, '/support');
  const css = read('assets/css/eon-nexus-pulse.css');
  const restrainedBlock = css.match(/\.eon-nexus-pulse\[data-eon-nexus-presentation='restrained'\] \.eon-nexus-pulse__toggle-label \{([\s\S]*?)\}/)?.[1] || '';
  assert.match(restrainedBlock, /position:\s*static/);
  assert.match(restrainedBlock, /clip-path:\s*none/);
  assert.doesNotMatch(restrainedBlock, /width:\s*1px/);
});

test('W660O City Nexus stations include a discoverability beacon without a second render owner', () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const layer = createEonCityW660NexusHologram({ scene, adapter: adapter(), quality: 'balanced', environment: {} });
  layer.start();
  const names = new Set(scene.meshes.map((mesh) => mesh.name));
  for (const station of EON_CITY_W660_NEXUS_STATIONS) {
    assert.ok(names.has(`w660-nexus-beacon-${station.id}`), station.id);
    assert.ok(names.has(`w660-nexus-beacon-ring-${station.id}`), station.id);
  }
  const summary = layer.getSummary();
  assert.equal(summary.stationCount, 9);
  assert.equal(summary.overheadBeacon, true);
  assert.equal(summary.ownsRenderLoop, false);
  assert.equal(summary.secondCanvas, false);
  layer.dispose();
  scene.dispose();
  engine.dispose();
});

test('W660O production verification fails closed when standalone Nexus or City beacons disappear', () => {
  const build = read('scripts/build-production.mjs');
  assert.match(build, /EONNexusPageSurface/);
  assert.match(build, /w660-nexus-beacon-ring-/);
  assert.match(build, /Standalone Nexus bootstrap was not emitted/);
  assert.match(build, /City Nexus discoverability beacons were not emitted/);
  assert.match(build, /Restrained Nexus labels are not visibly discoverable/);
});
