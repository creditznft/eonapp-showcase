import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const palette = read('assets/js/realm3d/engine/BlockPalette.js');
const map = read('assets/js/realm3d/engine/EonCityMap.js');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const director = read('assets/js/realm3d/engine/RealmExperienceDirector.js');
const player = read('assets/js/realm3d/engine/PlayerController.js');
const css = read('assets/css/realm3d.css');

test('W41 final metaverse readiness policy is explicit', () => {
  assert.match(palette, /REALM3D_POLISH_SCHEMA/);
  assert.match(palette, /METAVERSE_READINESS/);
  assert.match(palette, /guidedCityTour: true/);
  assert.match(palette, /photoModeProof: true/);
});

test('W42 city art and layout are upgraded beyond the base voxel map', () => {
  assert.match(map, /addSpawnMonument/);
  assert.match(map, /addPortalBoulevard/);
  assert.match(map, /addDistrictInteriorKit/);
  assert.match(map, /eon\.realm3d\.city-map\.v45/);
});

test('W43 private workstation and My Realm generator are stronger worlds', () => {
  assert.match(map, /workstation\.v2/);
  assert.match(map, /Command Table/);
  assert.match(map, /realmName/);
  assert.match(map, /portal-court/);
  assert.match(map, /photo-pad/);
});

test('W44 guided tour, route hint, and photo mode are wired', () => {
  assert.match(director, /routeHint/);
  assert.match(boot, /startGuidedTour/);
  assert.match(boot, /openPhotoMode/);
  assert.match(player, /teleportTo/);
});

test('W45 world polish renders visible proof markers and panels', () => {
  assert.match(voxel, /addGuidedTourMarkers/);
  assert.match(voxel, /portal.label/);
  assert.match(panels, /renderGuidedTour/);
  assert.match(panels, /renderPhotoMode/);
  assert.match(css, /SAFE METAVERSE/);
});
