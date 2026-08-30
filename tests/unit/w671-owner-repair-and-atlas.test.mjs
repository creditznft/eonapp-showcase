import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET,
  buildEonCityW671AtlasModel,
  createEonCityW671DistrictBoundaryStabilizer,
  getEonCityW671OwnerRepairTruth,
  resolveEonCityW671PlayerVisualHeading
} from '../../assets/js/city/w671/eon-city-w671-owner-repair.js';
import { EON_CITY_W660I_DISTRICTS } from '../../assets/js/city/w660i/eon-city-w660i-district-config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W671 removes the accidental half-turn between world movement and the Pathfinder visual', () => {
  assert.equal(EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET, 0);
  assert.equal(resolveEonCityW671PlayerVisualHeading(-Math.PI / 2), -Math.PI / 2);
  assert.equal(resolveEonCityW671PlayerVisualHeading(Math.PI / 2), Math.PI / 2);
});

test('W671 district boundary requires a stable candidate before changing identity', () => {
  const stabilizer = createEonCityW671DistrictBoundaryStabilizer({ holdMs: 500 });
  stabilizer.reset('orientation-hall');
  for (let index = 0; index < 4; index += 1) {
    const snapshot = stabilizer.update({ currentDistrictId: 'orientation-hall', candidateDistrictId: 'transit-network', deltaSeconds: 0.1 });
    assert.equal(snapshot.districtId, 'orientation-hall');
    assert.equal(snapshot.changed, false);
  }
  const changed = stabilizer.update({ currentDistrictId: 'orientation-hall', candidateDistrictId: 'transit-network', deltaSeconds: 0.1 });
  assert.equal(changed.districtId, 'transit-network');
  assert.equal(changed.changed, true);
  const resetByReturn = stabilizer.update({ currentDistrictId: 'transit-network', candidateDistrictId: 'transit-network', deltaSeconds: 0.1 });
  assert.equal(resetByReturn.pendingDistrictId, '');
});

test('W671 Atlas exposes every authored district as a readable explicit-travel node', () => {
  const atlas = buildEonCityW671AtlasModel(EON_CITY_W660I_DISTRICTS, 'orientation-hall');
  assert.equal(atlas.nodes.length, 9);
  assert.ok(atlas.links.length >= 8);
  assert.equal(atlas.nodes.filter((node) => node.active).length, 1);
  assert.ok(atlas.nodes.every((node) => node.x >= 8 && node.x <= 92 && node.y >= 8 && node.y <= 92));
  assert.equal(atlas.automaticTravel, false);
  assert.equal(atlas.readable2dFirst, true);
});

test('W671 source wiring keeps Atlas visible and owner repairs local-only', async () => {
  const core = await readFile(path.join(ROOT, 'assets/js/city/w649/eon-city-w649-babylon-core-runtime.js'), 'utf8');
  const product = await readFile(path.join(ROOT, 'assets/js/city/w659n/eon-city-w659n-product-layer.js'), 'utf8');
  const cityCss = await readFile(path.join(ROOT, 'assets/css/eon-city-play.css'), 'utf8');
  const productCss = await readFile(path.join(ROOT, 'assets/css/eon-city-product-layer.css'), 'utf8');
  assert.match(core, /EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET/);
  assert.doesNotMatch(core, /slot:\s*'player'[\s\S]{0,180}rotationY:\s*Math\.PI/);
  assert.match(product, /createEonCityW671DistrictBoundaryStabilizer/);
  assert.match(product, /data-eon-w671-atlas-map/);
  assert.match(product, /<span>⌁<\/span> Atlas<\/button>/);
  assert.match(cityCss, /W671 owner-observed HUD repair/);
  assert.match(productCss, /eon-city-atlas-map/);
  const truth = getEonCityW671OwnerRepairTruth();
  assert.equal(truth.startsAiWork, false);
  assert.equal(truth.remoteNetwork, false);
});
