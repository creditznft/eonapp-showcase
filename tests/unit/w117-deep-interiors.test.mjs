import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildEonCityVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildSession7InteriorCatalog, buildSession7InteriorTelemetry, validateSession7InteriorCatalog } from '../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js';
import { buildW117InteriorDetailPlan, buildW117InteriorTelemetry, validateW117InteriorUpgrade, W117_INTERIOR_DETAIL_SCHEMA } from '../../assets/js/realm3d/engine/EonCityW117InteriorDetailPass.js';

const session7Source = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js', import.meta.url), 'utf8');
const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const panelsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/WorldPanels.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');

test('W117 gives each landmark interior a unique room identity, zones, props, and use targets', () => {
  const city = buildEonCityVoxelWorld();
  const catalog = buildSession7InteriorCatalog(city.districts || []);
  const validation = validateW117InteriorUpgrade(catalog, { quality: 'neon' });
  assert.equal(validation.ok, true);
  assert.equal(validation.telemetry.schema, W117_INTERIOR_DETAIL_SCHEMA);
  assert.equal(validation.telemetry.roomCount, 10);
  assert.ok(validation.telemetry.useTargetCount >= 48);
  assert.ok(validation.telemetry.propCount >= 112);
  assert.equal(validation.telemetry.noSecretSurfaces, true);
  assert.equal(validation.telemetry.noExternalIframes, true);
  assert.equal(validation.telemetry.everyRoomHasExitCue, true);
});

test('W117 keeps low mode functional while desktop/neon gets richer detail density', () => {
  const city = buildEonCityVoxelWorld();
  const catalog = buildSession7InteriorCatalog(city.districts || []);
  const low = buildW117InteriorTelemetry({ catalog, quality: 'low' });
  const neon = buildW117InteriorTelemetry({ catalog, quality: 'neon' });
  assert.equal(low.qualityTier, 'mobile-basic');
  assert.equal(neon.qualityTier, 'desktop-ultra');
  assert.ok(neon.propCount > low.propCount);
  assert.ok(neon.useTargetCount > low.useTargetCount);
  assert.equal(low.everyRoomHasPurpose, true);
  assert.equal(low.everyRoomHasExitCue, true);
});

test('W117 bridges into session7 runtime, panel shell, CSS, and EngineBoot dataset', () => {
  assert.match(session7Source, /createW117InteriorDetailLayer/);
  assert.match(session7Source, /updateW117InteriorDetail/);
  assert.match(session7Source, /w117InteriorDetail/);
  assert.match(bootSource, /realmDeepInteriorSession/);
  assert.match(panelsSource, /renderW117InteriorStationContext/);
  assert.match(panelsSource, /W117/);
  assert.match(cssSource, /realm3d-w117-interior-card/);
});

test('W117 remains compatible with the existing session7 interior validation contract', () => {
  const city = buildEonCityVoxelWorld();
  const catalog = buildSession7InteriorCatalog(city.districts || []);
  const session7 = validateSession7InteriorCatalog(catalog);
  const telemetry = buildSession7InteriorTelemetry({ catalog, quality: 'standard' });
  const aiPlan = buildW117InteriorDetailPlan({ interior: catalog.find((interior) => interior.id === 'ai'), quality: 'standard' });
  assert.equal(session7.ok, true);
  assert.equal(session7.w117Schema, W117_INTERIOR_DETAIL_SCHEMA);
  assert.equal(telemetry.w117InteriorDetail.schema, W117_INTERIOR_DETAIL_SCHEMA);
  assert.match(aiPlan.roomName, /Model Orchestration/);
  assert.ok(aiPlan.useTargets.every((target) => target.visualAnchor));
});
