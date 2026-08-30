import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W719.14 district composition cannot overwrite the active Babylon arrival camera', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(product, /single camera authority/);
  assert.match(product, /createEonCityW660iDistrictComposition\(\{ scene, camera: null, playerAnchor/);
  assert.doesNotMatch(product, /createEonCityW660iDistrictComposition\(\{ scene, camera, playerAnchor/);
});

test('W719.14 paid structural GLBs participate in camera composition and occlusion protection', () => {
  const runtime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  assert.match(runtime, /const structuralAsset = !interactiveCharacter/);
  assert.match(runtime, /eonCityCameraOcclusion: structuralAsset/);
  assert.match(runtime, /structureId: structuralAsset \? assetId : ''/);
  assert.doesNotMatch(runtime, /if \(!mesh \|\| !interactive\) continue/);
});

test('W719.14 City header uses semantic block rows for district, quality and runtime status', () => {
  const station = read('assets/js/city/eon-city-access-station.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /<p class="eon-city-reduced-quality" data-eon-city-quality-badge>/);
  assert.match(station, /<p class="eon-city-reduced-runtime-status" data-eon-city-reduced-status aria-live="polite">/);
  assert.doesNotMatch(station, /<span data-eon-city-quality-badge>/);
  assert.match(css, /\[data-eon-city-quality-badge\],[\s\S]*\[data-eon-city-reduced-status\]\{display:block;margin:0\}/);
});

test('W719.14 Living Nexus keeps direct, delegated and Escape close authorities', () => {
  const panel = read('assets/js/city/eon-city-living-nexus-panel.js');
  assert.match(panel, /const LIVING_NEXUS_CLOSE_SELECTOR = '\[data-eon-play-living-nexus-close\]'/);
  assert.match(panel, /const closeTrigger = event\.target\?\.closest\?\.\(LIVING_NEXUS_CLOSE_SELECTOR\)/);
  assert.match(panel, /closeTrigger && panel\.contains\?\.\(closeTrigger\)/);
  assert.match(panel, /close\.addEventListener\('click', onCloseClick\)/);
  assert.match(panel, /event\.key === 'Escape'[\s\S]*hide\(\)/);
});

test('W719.14 Nexus proximity copy has semantic identity and guidance lanes', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const css = read('assets/css/eon-city-product-layer.css');
  const publicCss = read('public/assets/css/eon-city-product-layer.css');
  assert.match(product, /class="eon-city-nexus-station-identity"/);
  assert.match(product, /class="eon-city-nexus-station-proximity"/);
  assert.match(css, /\.eon-city-nexus-station-proximity \{[\s\S]*display:grid;[\s\S]*gap:5px/);
  assert.match(css, /\.eon-city-nexus-station-proximity b,[\s\S]*display:block/);
  assert.equal(publicCss, css);
});

test('W719.14 desktop gameplay controls occupy reserved HUD lanes and duplicate launchers stay hidden', () => {
  const css = read('assets/css/eon-city-play.css');
  assert.match(css, /reserve distinct desktop HUD lanes/);
  assert.match(css, /@media \(min-width:761px\)[\s\S]*eon-city-reduced-objective[\s\S]*top:max\(/);
  assert.match(css, /eon-city-reduced-district-actions[\s\S]*bottom:auto/);
  assert.match(css, /eon-w659g-progress>button[\s\S]*display:none!important/);
  assert.match(css, /eon-w659g-panel[\s\S]*pointer-events:auto/);
});

test('W719.14 active Babylon owners retain Ray authority while the forwarding entrypoint delegates the first-frame side effect', () => {
  const forwardingEntry = read('assets/js/city/eon-city-play-core.js');
  const firstFrameGuard = read('assets/js/city/w736a/eon-city-w736a-first-frame-guard.js');
  assert.match(forwardingEntry, /installEonCityW736AFirstFrameGuard/);
  assert.match(firstFrameGuard, /import '@babylonjs\/core\/Culling\/ray\.js';/);
  for (const relative of [
    'assets/js/city/eon-city-play-babylon.js',
    'assets/js/nexus/eon-nexus-living-core.js'
  ]) {
    const source = read(relative);
    const rayIndex = source.indexOf("import { Ray } from '@babylonjs/core/Culling/ray.js';");
    const materialIndex = source.indexOf('StandardMaterial');
    assert.ok(rayIndex >= 0, relative);
    assert.ok(materialIndex > rayIndex, relative);
    assert.match(source, /typeof Ray !== 'function'/);
    assert.doesNotMatch(source, /import '@babylonjs\/core\/Culling\/ray\.js';/);
  }
});
