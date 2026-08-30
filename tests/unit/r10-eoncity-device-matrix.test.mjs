import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  EON_CITY_R10_CANONICAL_VIEWPORTS,
  buildEonCityR10DeviceMatrix,
  validateEonCityR10DeviceMatrix
} from '../../assets/js/city/r10/eon-city-r10-device-matrix.js';

test('R10 certifies the canonical 11-viewport matrix without a portrait product fork', () => {
  assert.equal(EON_CITY_R10_CANONICAL_VIEWPORTS.length, 11);
  const result = validateEonCityR10DeviceMatrix(buildEonCityR10DeviceMatrix());
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.viewportCount, 11);
  const portraitPhones = result.matrix.filter((entry) => entry.profile.id === 'mobile-portrait');
  assert.ok(portraitPhones.length >= 4);
  assert.ok(portraitPhones.every((entry) => entry.startsBabylon && !entry.portraitBlocked && entry.profile.surfaceMode === 'bottom-sheet'));
});

test('R10 source starts direct portrait City through Babylon and never dims or blocks portrait play', () => {
  const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  const mode = fs.readFileSync(new URL('../../assets/js/city/eon-city-mobile-mode.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
  assert.match(mode, /portrait-explore/);
  assert.match(mode, /startsBabylonAutomatically:\s*mode !== 'mobile-unknown'/);
  assert.doesNotMatch(station.slice(station.indexOf('} else if (directEntry) {'), station.indexOf('} else {\n    renderGate', station.indexOf('} else if (directEntry) {'))), /renderPortraitCompanion/);
  assert.match(css, /orientation:portrait[\s\S]{0,500}eon-play-orientation-note\{display:none!important;pointer-events:none\}/);
});

test('R10 gives every major City blocking surface a visible minimize/restore path', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const host = fs.readFileSync(new URL('../../assets/js/work-surface/eon-work-surface-host.js', import.meta.url), 'utf8');
  const map = fs.readFileSync(new URL('../../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js', import.meta.url), 'utf8');
  for (const selector of ['data-eon-city-menu-minimize', 'data-eon-city-transit-minimize', 'data-eon-city-expanse-minimize']) assert.match(runtime, new RegExp(selector));
  for (const id of ['city-menu', 'transit-review', 'expanse-review', 'accessible-map', 'work-surface']) {
    assert.match(runtime, new RegExp(`register(?:\\?\\.)?\\('${id}'`));
  }
  assert.match(runtime, /data-eon-city-surface-restore/);
  assert.match(host, /data-eon-work-surface-minimize/);
  assert.match(host, /const minimize =/);
  assert.match(host, /const restore =/);
  assert.match(map, /data-eon-city-semantic-minimize/);
  assert.match(map, /const minimize =/);
  assert.match(map, /const restore =/);
});
