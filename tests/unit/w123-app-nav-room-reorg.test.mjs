import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { DISTRICTS } from '../../assets/js/realm3d/engine/BlockPalette.js';
import { createModularCharacter, getCharacterKitStats } from '../../assets/js/realm3d/engine/EonCityCharacterKit.js';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildSession7InteriorCatalog, buildSession7InteriorEntryPortals } from '../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js';
import {
  W123_APP_NAV_SCHEMA,
  buildW123AppNavigationPlan,
  buildW123BuildOsPlan,
  scoreW123AppNavigationPlan
} from '../../assets/js/realm3d/engine/EonCityW123AppNavigationRuntime.js';

const panelsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/WorldPanels.js', import.meta.url), 'utf8');
const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const portalSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/PortalSystem.js', import.meta.url), 'utf8');
const livePanelSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityLiveAppPanelRuntime.js', import.meta.url), 'utf8');

test('W123 authors ten dedicated rooms including Device Lab and Spawn Orientation Hall', () => {
  const catalog = buildSession7InteriorCatalog(DISTRICTS);
  const ids = new Set(catalog.map((room) => room.id));
  assert.equal(catalog.length, 10);
  for (const id of ['spawn', 'ai', 'builder', 'device', 'vault', 'trade', 'store', 'mission', 'referral', 'portal']) assert.ok(ids.has(id), `missing ${id}`);
  assert.match(catalog.find((room) => room.id === 'spawn').label, /Orientation Hall/);
  assert.match(catalog.find((room) => room.id === 'device').label, /Device Lab/);
});

test('W123 corrects Trade Dome and exposes Code Showcase / Build OS / Device Lab station types', () => {
  const catalog = buildSession7InteriorCatalog(DISTRICTS);
  const stations = catalog.flatMap((room) => room.stations.map((station) => ({ ...station, roomId: room.id })));
  const types = new Set(stations.map((station) => station.type));
  for (const type of ['trade-terminal', 'code-showcase', 'build-os', 'device-lab', 'chat', 'vault-summary']) assert.ok(types.has(type), `missing ${type}`);
  const tradeStations = stations.filter((station) => station.roomId === 'trade');
  assert.ok(tradeStations.every((station) => station.route.startsWith('/trade')));
  assert.ok(tradeStations.every((station) => station.type === 'trade-terminal'));
  assert.equal(tradeStations.some((station) => station.type === 'marketplace-preview'), false);
});

test('W123 building entries and city stations use quick preview before dedicated room entry', () => {
  const catalog = buildSession7InteriorCatalog(DISTRICTS);
  const entries = buildSession7InteriorEntryPortals(catalog);
  assert.equal(entries.length, 10);
  assert.ok(entries.every((entry) => entry.quickPreview?.flow === 'approach-building-preview-then-open-page-or-enter-room'));
  assert.ok(entries.every((entry) => entry.quickPreview?.actions.includes('open-full-page') && entry.quickPreview?.actions.includes('enter-dedicated-room')));
  const city = buildEonCityVoxelWorld();
  assert.ok(city.cityStationScreens.filter((screen) => screen.quickPreview?.flow === 'approach-building-preview-then-open-page-or-enter-room').length >= 10);
  assert.equal(city.w123AppNavigationPlan.schema, W123_APP_NAV_SCHEMA);
  assert.equal(city.w123AppNavigationScore.ok, true);
});

test('W123 private workstation is a two-row professional command wall with visible code showcase', () => {
  const world = buildPrivateWorkstationVoxelWorld({ owner: 'test-operator' });
  assert.ok(world.workstationScreens.length >= 10);
  assert.ok(world.workstationScreens.some((screen) => screen.id === 'screen-code-showcase'));
  const rows = new Set(world.workstationScreens.map((screen) => screen.commandWallRow));
  assert.ok(rows.has('primary') && rows.has('secondary'));
  for (let i = 0; i < world.workstationScreens.length; i += 1) {
    for (let j = i + 1; j < world.workstationScreens.length; j += 1) {
      const [ax, az] = world.workstationScreens[i].position;
      const [bx, bz] = world.workstationScreens[j].position;
      const distance = Math.hypot(ax - bx, az - bz);
      assert.ok(distance >= 3.2, `${world.workstationScreens[i].id} overlaps ${world.workstationScreens[j].id}`);
    }
  }
  assert.equal(world.w123AppNavigationScore.checks.codeShowcaseVisible, true);
});

test('W123 readable NPC faces are exaggerated enough to be perceived in gameplay', () => {
  const npc = createModularCharacter({ npc: { id: 'w123-test-npc', role: 'guide', audience: 'public' }, quality: 'standard' });
  const parts = npc.userData.parts || {};
  assert.equal(npc.userData.w123ReadableFaceDetail, 'oversized-eyes-pupils-mouth-brows-cheek-emote-panel');
  assert.ok(parts.leftEye?.name?.includes('w123-big'));
  assert.ok(parts.rightEye?.name?.includes('w123-big'));
  assert.ok(parts.mouthGlow);
  const stats = getCharacterKitStats();
  assert.match(stats.visualSchema, /w123/);
  assert.match(stats.facialDetail, /oversized-readable-eyes/);
});

test('W123 panel and boot sources expose preview actions, room entry, Build OS, and allowed routes', () => {
  const buildOs = buildW123BuildOsPlan();
  assert.ok(buildOs.lanes.some((lane) => lane.id === 'code-showcase'));
  assert.ok(buildOs.lanes.some((lane) => lane.id === 'device-lab'));
  assert.match(panelsSource, /openBuildingPreview/);
  assert.match(panelsSource, /Enter dedicated room/);
  assert.match(panelsSource, /Code Showcase/);
  assert.match(panelsSource, /build-os/);
  assert.match(bootSource, /realmAppNavigationSession = 'w123'/);
  assert.match(portalSource, /Tap Preview/);
  for (const route of ['/trade', '/workbench.html', '/realm-code-preview.html', '/automation-studio.html']) assert.match(livePanelSource, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const plan = buildW123AppNavigationPlan({ districts: DISTRICTS, cityScreens: buildEonCityVoxelWorld().cityStationScreens, privateScreens: buildPrivateWorkstationVoxelWorld().workstationScreens, interiors: buildSession7InteriorCatalog(DISTRICTS) });
  assert.equal(scoreW123AppNavigationPlan(plan).score, 100);
});
