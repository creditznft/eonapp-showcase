import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const nexus = read('assets/js/city/w749/eon-city-w749-living-nexus.js');

test('R01 makes the procedural Nexus an explicit fallback and retires it when authored Nexus becomes ready', () => {
  assert.match(runtime, /unregisterLoadedAsset\('fallback:station:eonbot-nexus'\)[\s\S]{0,220}registerSpatialNode\('procedural:w749-living-nexus'[\s\S]{0,180}primaryRole: 'living-nexus-core'/);
  assert.match(runtime, /livingNexus\.setPresentationEnabled\?\.\(false\)[\s\S]{0,120}unregisterLoadedAsset\('procedural:w749-living-nexus'\)[\s\S]{0,180}authored:living-nexus-core/);
  assert.match(nexus, /setPresentationEnabled\(enabled = true\)/);
  assert.match(nexus, /root\.setEnabled\?\.\(presentationEnabled\)/);
  assert.match(nexus, /disposed \|\| !presentationEnabled/);
});

test('R01 classifies EONBOT docks and Nexus terminal as support geometry, not competing primary structures', () => {
  assert.doesNotMatch(runtime, /procedural:eonbot-dock'[\s\S]{0,140}primaryRole:/);
  assert.doesNotMatch(runtime, /authored:eonbot-dock'[\s\S]{0,160}primaryRole:/);
  assert.match(runtime, /authored:terminal:\$\{station\.id\}[\s\S]{0,220}allowHeroZone: station\.id === 'eonbot-nexus'/);
  assert.match(runtime, /allowArrivalRay: station\.id === 'eonbot-nexus'/);
});

test('R01 removes the legacy outer-wall gallery from default scene ownership without deleting its implementation', () => {
  assert.match(runtime, /EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED = false/);
  assert.match(runtime, /const wallGalleryStations = EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED \? \[\.\.\.EON_CITY_W731_STATIONS\.entries\(\)\] : \[\]/);
  assert.doesNotMatch(runtime, /primaryRole: 'outer-wall-display'/);
  assert.match(runtime, /createEonCityW765R7WallDisplay/);
  assert.match(runtime, /createEonCityW750CommandCentre/);
});
