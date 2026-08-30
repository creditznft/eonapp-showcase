import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DISTRICTS } from '../../assets/js/realm3d/engine/BlockPalette.js';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildSession7InteriorCatalog, buildW125InteriorPortalNetwork } from '../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js';
import {
  W125_GAME_EXPERIENCE_SCHEMA,
  W125_PUBLIC_MENU_LABELS,
  buildW125FullscreenAppWorkspaceContract,
  buildW125GameExperiencePlan,
  scoreW125GameExperiencePlan
} from '../../assets/js/realm3d/engine/EonCityW125GameExperienceRuntime.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W125 scores the city as an end-to-end gamified app OS, not just decoration', () => {
  const city = buildEonCityVoxelWorld();
  assert.equal(city.w125GameExperiencePlan.schema, W125_GAME_EXPERIENCE_SCHEMA);
  assert.equal(city.w125GameExperienceScore.ok, true);
  assert.equal(city.w125GameExperienceScore.score, 100);
  assert.match(city.w125GameExperiencePlan.appFlow, /full-screen app preview/);
  assert.equal(city.w125GameExperiencePlan.portalNetwork.authoredRooms, 10);
  assert.deepEqual(city.w125GameExperiencePlan.portalNetwork.missingRooms, []);
  assert.equal(city.w125GameExperiencePlan.codeShowcaseVisible, true);
  assert.equal(city.w125GameExperiencePlan.deviceLabVisible, true);
});

test('W125 room portal network keeps all core rooms teleportable and useful', () => {
  const interiors = buildSession7InteriorCatalog(DISTRICTS);
  const network = buildW125InteriorPortalNetwork(DISTRICTS);
  assert.equal(network.requiredRooms, 10);
  assert.equal(network.authoredRooms, 10);
  assert.ok(network.everyRoomHasBigScreen);
  assert.ok(network.everyRoomHasExit);
  for (const room of interiors) {
    assert.ok(room.w125RoomActions.includes('portal-to-workstation'));
    assert.ok(room.w125RoomActions.includes('room-directory'));
    assert.equal(room.exitPortal.reliableExit, true);
  }
});

test('W125 full-screen app workspace contract prevents tiny clipped app frames', () => {
  const city = buildEonCityVoxelWorld();
  const contract = buildW125FullscreenAppWorkspaceContract(city.cityStationScreens[0]);
  assert.equal(contract.layout, 'large-modal-stage-not-small-iframe');
  assert.ok(contract.controls.openFullPage);
  assert.ok(contract.controls.minimizeToCity);
  assert.ok(contract.controls.pinToWorkstation);
  assert.ok(contract.safety.noArbitraryExternalEmbed);
  assert.ok(city.w125GameExperiencePlan.fullscreenWorkspaceCount >= 10);
});

test('W125 keeps private workstation as command wall and portal hub', () => {
  const workstation = buildPrivateWorkstationVoxelWorld({ owner: 'test-operator' });
  assert.equal(workstation.w125GameExperienceScore.ok, true);
  assert.equal(workstation.w125GameExperiencePlan.privateHasCommandWall, true);
  assert.ok(workstation.w125GameExperiencePlan.fullscreenContracts.some((item) => /code-showcase/i.test(`${item.id} ${item.route}`)));
  assert.ok(workstation.w125GameExperiencePlan.fullscreenContracts.some((item) => /device-lab/i.test(`${item.id} ${item.route}`)));
  assert.match(workstation.w125GameExperiencePlan.workstationRole, /central professional command wall/);
});

test('W125 My Realm inherits safe game OS routing without arbitrary uploads or developer copy', () => {
  const realm = buildMyRealmVoxelWorld({ username: 'operator' });
  assert.equal(realm.seedEnvelope.safeTemplatesOnly, true);
  assert.equal(realm.seedEnvelope.noArbitraryHtml, true);
  assert.equal(realm.w125GameExperienceScore.ok, true);
  assert.equal(realm.w125GameExperiencePlan.checklist.realmGeneratorSafeTemplates, true);
});

test('W125 public UI copy and panels hide developer-only language and expose real controls', () => {
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const boot = read('assets/js/realm3d/engine/EngineBoot.js');
  const css = read('assets/css/realm3d.css');
  assert.equal(W125_PUBLIC_MENU_LABELS.photoMode, 'Capture View');
  assert.equal(W125_PUBLIC_MENU_LABELS.diagnosticHud, 'Performance View');
  assert.match(boot, /Capture View/);
  assert.match(boot, /Performance View/);
  assert.doesNotMatch(boot, />Photo Mode</);
  assert.match(panels, /data-w125-fullscreen-app="true"/);
  assert.match(panels, /Minimize to city/);
  assert.match(panels, /Pin to workstation/);
  assert.match(panels, /full-screen app workspace/);
  assert.doesNotMatch(panels, /screenshot proof/);
  assert.match(css, /realm3d-fullscreen-app-panel/);
  assert.match(css, /min-height: min\(58svh, 640px\)/);
});

test('W125 score helper fails loudly if a future edit removes critical game controls', () => {
  const plan = buildW125GameExperiencePlan({ world: { kind: 'eon-city' }, interiors: [], cityScreens: [], privateScreens: [], npcs: [] });
  const score = scoreW125GameExperiencePlan(plan);
  assert.equal(score.ok, false);
  assert.ok(score.score < 100);
  assert.equal(score.checks.tenRooms, false);
  assert.equal(score.checks.fullScreenWorkspace, false);
});
