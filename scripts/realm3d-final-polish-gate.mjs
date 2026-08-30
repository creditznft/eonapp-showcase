import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';

function summarize(world) {
  const cityStationScreens = world.cityStationScreens || [];
  return {
    kind: world.kind,
    blockCount: world.blocks?.length || 0,
    districtCount: world.districts?.length || 0,
    portalCount: world.portals?.length || 0,
    npcCount: world.npcs?.length || 0,
    screenCount: world.workstationScreens?.length || 0,
    cityStationCount: cityStationScreens.length,
    artScore: world.artQualityScore?.total || 0,
    qualityScore: world.qualityScore?.total || 0,
    livePanelScore: world.livePanelScore?.total || 0,
    lootboxRewardScore: world.lootboxRewardScore?.total || 0,
    hasLootboxStation: JSON.stringify(world).includes('lootbox'),
    hasInteractiveScreens: (world.workstationScreens || []).every((screen) => screen.route && screen.secretSafe && Array.isArray(screen.input)),
    hasWeather: Array.isArray(world.atmosphere?.weather) && world.atmosphere.weather.length >= 3
  };
}

test('W91 EON City has dense art and every major station has an interactive in-world screen', () => {
  const world = buildEonCityVoxelWorld();
  const report = summarize(world);
  assert.ok(report.blockCount >= 30000, `expected dense city block count, got ${report.blockCount}`);
  assert.ok(report.artScore >= 98, `expected high art score, got ${report.artScore}`);
  assert.ok(report.screenCount >= report.districtCount + 6, `expected district screens plus workstation screens, got ${report.screenCount}`);
  assert.ok(report.cityStationCount >= 12, `expected city station screens and reward kiosks, got ${report.cityStationCount}`);
  assert.ok(report.hasInteractiveScreens, 'all station/workstation screens need safe route/input/secret policy');
  assert.ok(report.hasLootboxStation, 'city must expose lootbox reward/market stations');
});

test('W91 private workstation is an open-ceiling interactive command room, not a closed sparse box', () => {
  const world = buildPrivateWorkstationVoxelWorld({ owner: 'qa' });
  const report = summarize(world);
  assert.ok(report.districtCount >= 6, `expected room zones, got ${report.districtCount}`);
  assert.ok(report.screenCount >= 8, `expected app screens, got ${report.screenCount}`);
  assert.ok(report.artScore >= 90, `expected workstation art score >= 90, got ${report.artScore}`);
  assert.ok(report.livePanelScore >= 95, `expected safe live panels, got ${report.livePanelScore}`);
  assert.ok(report.hasWeather, 'private room needs skyline/weather atmosphere metadata');
});

test('W91 generated realms include user-facing stations, lootboxes, and interactive screens', () => {
  const world = buildMyRealmVoxelWorld({ username: 'qa-owner', seed: 'final-polish' });
  const report = summarize(world);
  assert.ok(report.blockCount >= 7000, `expected generated realm density, got ${report.blockCount}`);
  assert.ok(report.artScore >= 95, `expected generated realm art score >= 95, got ${report.artScore}`);
  assert.ok(report.screenCount >= 10, `expected generated realm interactive screens, got ${report.screenCount}`);
  assert.ok(report.cityStationCount >= 7, `expected generated realm stations, got ${report.cityStationCount}`);
  assert.ok(report.hasLootboxStation, 'generated realm must expose lootbox station/reward path');
});

if (process.env.EONAPP_PRINT_REALM3D_FINAL_REPORT === '1') {
  console.log(JSON.stringify({
    city: summarize(buildEonCityVoxelWorld()),
    workstation: summarize(buildPrivateWorkstationVoxelWorld()),
    realm: summarize(buildMyRealmVoxelWorld({ username: 'qa-owner', seed: 'final-polish' }))
  }, null, 2));
}
