import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const art = await readFile(new URL('../../assets/js/city/rt92/storm/eon-city-rt92-storm-deep-art.js', import.meta.url), 'utf8');
const presenter = await readFile(new URL('../../assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js', import.meta.url), 'utf8');

test('RT92 Storm deep art preserves the real Storm hero foundation and adds four authored support set pieces', () => {
  assert.match(art, /heroLandmarksPreserved: 3/);
  for (const id of ['lightning-capture-field', 'maintenance-yard', 'stabilizer-support-deck', 'storm-eye-emergency-site']) assert.match(art, new RegExp(id));
  assert.match(art, /buildEonCityRt91StormIndustrialKit/);
  assert.doesNotMatch(art, /finishedHeroBuilding: true/);
});

test('RT92 Storm deep art connects landmarks through bounded infrastructure and ground storytelling', () => {
  for (const family of ['power-trunk', 'coolant-pipe', 'ground-cable', 'maintenance-lights']) assert.match(art, new RegExp(family));
  for (const family of ['electrical-burn', 'fracture-seam', 'cable-trench', 'hazard-band']) assert.match(art, new RegExp(family));
  assert.match(art, /EON_EXPANSE_W792B_STORM_SECTOR_ROUTES/);
  assert.match(art, /connectedHeroInstallation: true/);
});

test('RT92 Storm art is optional procedural presentation with zero Hub binary delta and no runtime ownership', () => {
  assert.match(art, /proceduralGeometryOnly: true/);
  assert.match(art, /newBinaryBytes: 0/);
  assert.match(art, /firstFrameHubBinaryDelta: 0/);
  assert.match(art, /mountedOnlyWithStormPresenter: true/);
  assert.match(art, /ownsRenderLoop: false/);
  assert.match(art, /remoteTextures: false/);
  assert.doesNotMatch(art, /runRenderLoop\s*\(/);
  assert.doesNotMatch(art, /new\s+Engine\s*\(/);
  assert.doesNotMatch(art, /new\s+Scene\s*\(/);
});

test('W792C lifecycle owns RT92 Storm deep-art activation, update, suspension and disposal', () => {
  assert.match(presenter, /mountEonCityRt92StormDeepArt/);
  assert.match(presenter, /rt92StormDeepArt\.activate/);
  assert.match(presenter, /rt92StormDeepArt\?\.update/);
  assert.match(presenter, /rt92StormDeepArt\?\.deactivate/);
  assert.match(presenter, /rt92StormDeepArt\?\.dispose/);
  assert.match(presenter, /rt92DeepArt: rt92StormDeepArt\?\.getSummary/);
});
