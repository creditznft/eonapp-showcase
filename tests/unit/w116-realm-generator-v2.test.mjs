import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildRealmGeneratorV2Plan, scoreRealmGeneratorV2Plan, W116_REALM_GENERATOR_SCHEMA } from '../../assets/js/realm3d/engine/EonCityRealmGeneratorV2.js';

const mapSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityMap.js', import.meta.url), 'utf8');
const panelsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/WorldPanels.js', import.meta.url), 'utf8');


test('W116 realm generator v2 creates usable districts, roads, props, NPCs, portals, and quest hooks', () => {
  const plan = buildRealmGeneratorV2Plan({ username: 'qauser', seed: 113116, biome: 'ai-rainforest', layout: 'mini-city-grid', quality: 'neon' });
  assert.equal(plan.schema, W116_REALM_GENERATOR_SCHEMA);
  assert.equal(plan.safety.safeTemplatesOnly, true);
  assert.ok(plan.districts.length >= 7);
  assert.ok(plan.roads.length >= 6);
  assert.ok(plan.props.length >= 30);
  assert.ok(plan.npcs.length >= 5);
  assert.ok(plan.portals.length >= 2);
  assert.ok(plan.questHooks.length >= 6);
  assert.ok(plan.buildings.every((building) => building.door && building.lobby && building.signage && building.useTarget));
  assert.ok(scoreRealmGeneratorV2Plan(plan) >= 98);
});

test('W116 generated realm is attached beside the W111 compatibility plan', () => {
  const world = buildMyRealmVoxelWorld({ username: 'qauser', seed: 'w116' });
  assert.equal(world.realmGenerationPlan.schema, 'eon.realm3d.realm-generator.w111.aaa-v2');
  assert.equal(world.realmGeneratorV2.schema, W116_REALM_GENERATOR_SCHEMA);
  assert.ok(world.realmGeneratorV2Score >= 98);
  assert.ok(world.districts.length >= 7);
  assert.ok(world.blocks.some((block) => block.generatedBy === W116_REALM_GENERATOR_SCHEMA));
  assert.ok(world.npcs.some((npc) => npc.generatedBy === W116_REALM_GENERATOR_SCHEMA));
  assert.ok(world.portals.some((portal) => portal.generatedBy === W116_REALM_GENERATOR_SCHEMA));
});

test('W116 exposes the generator v2 plan in the user-facing native panel', () => {
  assert.match(mapSource, /addRealmGeneratorV2Blocks/);
  assert.match(mapSource, /realmGeneratorV2Score/);
  assert.match(panelsSource, /renderRealmGeneratorV2/);
  assert.match(panelsSource, /Realm Generator ·/);
});
