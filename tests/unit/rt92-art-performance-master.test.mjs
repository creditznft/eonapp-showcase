import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const perf = read('assets/js/city/rt92/eon-city-rt92-art-performance-master.js');
const life = read('assets/js/city/rt92/eon-city-rt92-environmental-life-art.js');
const vfx = read('assets/js/city/rt92/eon-city-rt92-cinematic-vfx-art.js');

test('RT92 Wave 9 defines distinct bounded quality performance profiles', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) assert.match(perf, new RegExp(`${quality}:\\s*freeze\\(\\{`));
  assert.match(perf, /firstFrameNewBinaryBytes:\s*0/);
  assert.match(perf, /hiddenWorldsSuspended:\s*true/);
  assert.match(perf, /ownsRenderLoop:\s*false/);
});

test('RT92 sharpness master preserves structure/emission and no-raster targets', () => {
  assert.match(perf, /neutralStructureShareMin:\s*0\.7/);
  assert.match(perf, /emissiveShareMax:\s*0\.1/);
  assert.match(perf, /worldCardVectorBytesMax:\s*300_000/);
  assert.match(perf, /newRasterBytesTarget:\s*0/);
  assert.match(perf, /newGlbBytesTarget:\s*8_000_000/);
  assert.match(perf, /ambientBloomForbidden:\s*true/);
});

test('service life and cinematic VFX use the shared cadence rather than adding another loop', () => {
  assert.match(life, /createEonCityRt92ArtCadence/);
  assert.match(life, /shouldUpdate\('service-life'/);
  assert.match(vfx, /createEonCityRt92ArtCadence/);
  assert.match(vfx, /shouldUpdate\('cinematic-vfx'/);
  assert.doesNotMatch(life + vfx + perf, /runRenderLoop|new Engine|new Scene/);
});
