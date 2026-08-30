import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonCityMegaBlueprint } from '../../assets/js/realm3d/engine/EonCityMegaBlueprint.js';
import { buildEonCityVoxelWorld, buildMyRealm3dSeed } from '../../assets/js/realm3d/engine/EonCityMap.js';

test('W75 EON City blueprint centers the private 3D workstation and EONBot companion', () => {
  const blueprint = getEonCityMegaBlueprint();
  assert.equal(blueprint.schema, 'eon.realm3d.mega-blueprint.w75-w80.v1');
  assert.ok(blueprint.districts.some((district) => district.id === 'eon-workstation'));
  assert.ok(blueprint.workstationScreens.length >= 6);
  assert.ok(blueprint.workstationScreens.some((screen) => screen.route === '/chat.html'));
  assert.ok(blueprint.workstationScreens.some((screen) => String(screen.secretSafe).includes('redact')));
  assert.equal(blueprint.eonbot.id, 'eonbot-companion');
  assert.ok(blueprint.eonbot.behavior.includes('follow-player'));
});

test('W75 EON City blueprint keeps ad rewards value-only and secret-safe', () => {
  const blueprint = getEonCityMegaBlueprint();
  assert.equal(blueprint.privacy.noRawIpStorage, true);
  assert.equal(blueprint.privacy.noCountryStorageForRewards, true);
  assert.equal(blueprint.privacy.adRewardMetric, 'monetag_or_provider_reward_event_type_plus_estimated_price_only');
  assert.match(blueprint.privacy.secretScreenshots, /blur-or-hide/i);
});

test('W75 generated user realms include private workstation entrance and share output', () => {
  const blueprint = getEonCityMegaBlueprint();
  assert.ok(blueprint.userRealmGenerator.requiredModules.includes('private-workstation-entrance'));
  assert.ok(blueprint.userRealmGenerator.requiredModules.includes('eonbot-companion'));
  assert.ok(blueprint.userRealmGenerator.shareOutput.includes('signed-tour-link'));
  const seed = buildMyRealm3dSeed({ username: 'manisha', seed: 'eoncity' });
  assert.ok(seed.modules.includes('private-workstation-entrance'));
  assert.ok(seed.modules.includes('eonbot-companion'));
});

test('W75 EON City world exposes the mega blueprint for phased rendering', () => {
  const world = buildEonCityVoxelWorld();
  assert.equal(world.megaBlueprint.schema, 'eon.realm3d.mega-blueprint.w75-w80.v1');
  assert.ok(world.megaBlueprint.implementationOrder.includes('ship-private-workstation-room'));
});

test('W75 EON City blueprint defines AAA upgrade options, workstation interaction, and open-world illusion', () => {
  const blueprint = getEonCityMegaBlueprint();
  assert.ok(blueprint.worldQualityOptions.some((option) => option.id === 'pro-city'));
  assert.ok(blueprint.worldQualityOptions.some((option) => option.id === 'infinite-illusion'));
  assert.equal(blueprint.workstationInteraction.coreGoal.includes('inside the private 3D workspace'), true);
  assert.equal(blueprint.workstationInteraction.firstShipMode, 'safe-panel-proxy');
  assert.ok(blueprint.workstationInteraction.screens.includes('chat'));
  assert.ok(blueprint.workstationInteraction.screens.includes('support-eonbot'));
  assert.ok(blueprint.controls.desktop.some((item) => /W moves forward/i.test(item)));
  assert.ok(blueprint.controls.qa.includes('pointer-lock-exit-test'));
  assert.ok(blueprint.openWorld.chunkTypes.includes('station-cluster'));
  assert.ok(blueprint.openWorld.weather.includes('soft-rain'));
});

test('W75 EON City world quality score tracks workstation, EONBot, controls, and open-world systems', () => {
  const world = buildEonCityVoxelWorld();
  assert.equal(world.qualityScore.schema, 'eon.realm3d.quality-score.w75.v1');
  assert.ok(world.qualityScore.total >= 80);
  assert.equal(world.qualityScore.requirements.hasWorkstation, true);
  assert.equal(world.qualityScore.requirements.hasEonBot, true);
  assert.equal(world.qualityScore.requirements.hasScreenPlan, true);
  assert.equal(world.qualityScore.requirements.hasControlsPlan, true);
  assert.equal(world.qualityScore.requirements.hasOpenWorldPlan, true);
});
