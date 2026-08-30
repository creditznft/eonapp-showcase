import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W719.13 City controls have one visible launcher authority and real route effects', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const quick = read('assets/js/city/eon-city-eonbot-quick-work.js');
  const css = read('assets/css/eon-city-play.css');
  const membership = read('assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js');
  const capture = read('assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js');

  assert.match(product, /const leaveCity = typeof onLeaveCity === 'function'/);
  assert.match(product, /environment\.location\.assign\(destination\)/);
  assert.match(product, /onLeaveCity: leaveCity/);
  assert.match(quick, /data-eon-city-eonbot-direct-route="projects"/);
  assert.match(quick, /event\.preventDefault\(\);[\s\S]*onLeaveCity/);
  assert.match(css, /City Menu owns Capture and Membership launchers/);
  assert.match(css, /\.eon-w659g-capture > button[\s\S]*display: none !important/);
  assert.match(membership, /dispatchEonWorkSurfaceOpen\(\{ id: 'plans'/);
  assert.match(membership, /explicitUserAction: true/);
  assert.match(capture, /dispatchEonWorkSurfaceOpen\(\{ id: 'creator-capture'/);
  assert.match(capture, /explicitUserAction: true/);
  assert.doesNotMatch(membership, /role=\"dialog\" aria-modal=\"true\"/);
  assert.doesNotMatch(capture, /role=\"dialog\" aria-modal=\"true\"/);
});

test('W719.13 district identity reaches the primary HUD instead of staying Command District', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(product, /publishDistrictContext\('reviewed-travel-arrival'\)/);
  assert.match(product, /publishDistrictContext\('walked-district-boundary'\)/);
  assert.match(product, /eon:city:district-context/);
  assert.match(station, /const sessionTitle = root\.querySelector\('#eon-play-session-title'\)/);
  assert.match(station, /sessionTitle\.textContent = label/);
  assert.match(station, /w719-13-district-hud-context/);
});
