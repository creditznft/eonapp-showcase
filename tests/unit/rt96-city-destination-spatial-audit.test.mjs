import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_W731_STATIONS,
  EON_CITY_W737_DISCOVERIES,
  EON_CITY_W731_WORLD_BOUNDS,
  validateEonCityW731CommandHubContract
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  createEonCityW765R6PlayerCollisionZones,
  isEonCityW765R6PositionCollisionFree,
  validateEonCityW765R6DiscoveryPolicy
} from '../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js';

const destinations = [...EON_CITY_W731_STATIONS, ...EON_CITY_W737_DISCOVERIES];
const zones = createEonCityW765R6PlayerCollisionZones([
  ...EON_CITY_W731_STATIONS.map((station) => ({ id: `station:${station.id}`, position: station.position, footprintRadius: station.footprintRadius })),
  ...EON_CITY_W737_DISCOVERIES.map((discovery) => ({ id: `discovery:${discovery.id}`, position: discovery.position, footprintRadius: 1.72 }))
]);

test('RT96 canonical Command Hub and discovery contracts remain valid', () => {
  assert.equal(validateEonCityW731CommandHubContract().ok, true);
  assert.equal(validateEonCityW765R6DiscoveryPolicy(EON_CITY_W737_DISCOVERIES).ok, true);
});

test('RT96 every guided destination focus is collision-free, in bounds and actually interactable', () => {
  for (const destination of destinations) {
    const focus = destination.focus;
    assert.ok(focus, `${destination.id} must expose a focus pose`);
    assert.ok(Math.hypot(focus.x, focus.z) <= EON_CITY_W731_WORLD_BOUNDS.safetyRadius, `${destination.id} focus must remain in world bounds`);
    const ownDistance = Math.hypot(focus.x - destination.position.x, focus.z - destination.position.z);
    assert.ok(ownDistance <= Number(destination.activationRadius || 4.2), `${destination.id} focus must be within activation radius`);
    assert.equal(isEonCityW765R6PositionCollisionFree(focus, zones).ok, true, `${destination.id} focus must not land inside another physical footprint`);
  }
});

test('RT96 station NPC identities and actions are complete and unique', () => {
  const npcIds = new Set();
  for (const destination of destinations) {
    assert.ok(destination.npc?.id, `${destination.id} requires an NPC/guide identity`);
    assert.ok(destination.npc?.name, `${destination.id} requires a guide name`);
    assert.ok(destination.npc?.role, `${destination.id} requires a guide role`);
    assert.ok(destination.npc?.action, `${destination.id} requires an interaction action`);
    assert.equal(npcIds.has(destination.npc.id), false, `${destination.npc.id} must not be duplicated across destinations`);
    npcIds.add(destination.npc.id);
  }
});
