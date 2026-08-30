import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W741 gives the Command Hub exactly one visible City Menu launcher authority', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const css = read('assets/css/eon-city-play.css');

  assert.doesNotMatch(access, /data-eon-city-district-actions|data-eon-city-open-menu/);
  assert.match(access, /data-eon-city-retry-3d hidden tabindex="-1" aria-hidden="true"/);
  assert.equal((runtime.match(/makeLauncher\('City Menu'/g) || []).length, 1);
  assert.match(runtime, /data-eon-city-runtime-launcher/);
  assert.match(runtime, /querySelectorAll\('body > \[data-eon-city-command-menu\]'/);
  assert.match(runtime, /session\.__eonCityCommandHubUi\?\.dispose/);
  assert.match(css, /eon-city-reduced-district-actions \{ display:none!important; \}/);
  assert.match(css, /data-eon-city-command-hub="w737"/);
});

test('W741 menu closes with Escape, restores focus and remains restart-deduplicated', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');

  assert.match(runtime, /event\.key === 'Escape'[\s\S]*closeMenu\(\)/);
  assert.match(runtime, /aria-expanded', 'true'/);
  assert.match(runtime, /lastFocus\?\.isConnected/);
  assert.match(runtime, /delete globalThis\.EON_CITY_COMMAND_HUB_RUNTIME/);
  assert.match(access, /eonCityMountGeneration/);
  assert.match(access, /previous-runtime-restored/);
  assert.doesNotMatch(access, /mountGeneration[\s\S]{0,400}root\.__eonCityRuntime\?\.destroy/);
});

test('W741 shows no more than three decluttered markers plus one nearby interaction card', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const css = read('assets/css/eon-city-play.css');

  assert.match(runtime, /promptTarget\?\.entity\?\.id === record\.entity\.id/);
  assert.match(runtime, /if \(placed\.length >= 3\) break/);
  assert.match(runtime, /const blocked = promptRect/);
  assert.match(runtime, /labels\.dataset\.visibleCount = String\(placed\.length\)/);
  assert.equal((runtime.match(/className = 'eon-city-command-prompt'/g) || []).length, 1);
  assert.match(css, /\[data-eon-city-label-id\]/);
  assert.match(css, /\[data-eon-city-label-kind="discovery"\]/);
});
