import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEonCityRt91WorldMap } from '../../assets/js/city/rt91/eon-city-rt91-world-map.js';
import { buildEonCityRt91TravelTransition, validateEonCityRt91TravelTransition } from '../../assets/js/city/rt91/eon-city-rt91-travel-transition.js';
import { migrateEonCityRt91SaveEnvelope, sanitizeEonCityRt91SaveEnvelope, validateEonCityRt91SaveEnvelope } from '../../assets/js/city/rt91/eon-city-rt91-save-envelope.js';
import { createEonCityRt91InteractionRegistry, defineEonCityRt91Interaction, validateEonCityRt91InteractionRegistry } from '../../assets/js/city/rt91/eon-city-rt91-interaction-registry.js';
import { deriveEonCityRt91NpcLifeDecision, validateEonCityRt91NpcLifeDecision } from '../../assets/js/city/rt91/eon-city-rt91-npc-life-director.js';
import { deriveEonCityRt91EonbotWorldBehavior } from '../../assets/js/city/rt91/eon-city-rt91-eonbot-world-director.js';
import { buildEonCityRt91AudioMix } from '../../assets/js/city/rt91/eon-city-rt91-audio-director.js';

test('RT91 world map projects authored landmarks without inventing navigation paths or icon floods', () => {
  const map = buildEonCityRt91WorldMap({ discoveredIds: ['beacon-fields', 'relay-basin'] });
  assert.equal(map.worlds['signal-frontier'].length, 5);
  assert.equal(map.worlds['storm-sector'].length, 4);
  assert.equal(map.worlds['my-frontier'].length, 7);
  assert.equal(map.iconFloodingAvoided, true);
  assert.equal(map.createsNavigationPath, false);
  assert.equal(map.grantsProgression, false);
});

test('RT91 canonical travel waits for first playable frame before optional target streaming', () => {
  const plan = buildEonCityRt91TravelTransition({ fromWorldId: 'signal-frontier', toWorldId: 'storm-sector' });
  assert.equal(plan.ok, true);
  assert.equal(validateEonCityRt91TravelTransition(plan).ok, true);
  assert.ok(plan.phases.indexOf('wait-for-target-first-playable-frame') < plan.phases.indexOf('resume-target-optional-streaming'));
  assert.equal(plan.signalCompletionRequiredForWorldEntry, false);
  assert.equal(plan.createsSecondRenderLoop, false);
});

test('RT91 internal fast travel fails closed for undiscovered anchors', () => {
  const blocked = buildEonCityRt91TravelTransition({ fromWorldId: 'my-frontier', toWorldId: 'signal-frontier', internalFastTravel: true, targetAnchorId: 'horizon-vault', discoveredAnchorIds: [] });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'undiscovered-fast-travel-anchor');
});

test('RT91 save envelope is bounded, privacy-safe and owns no legacy XP/unlock/build-coordinate authority', () => {
  const envelope = sanitizeEonCityRt91SaveEnvelope({
    worldSeed: 'owner-world', currentWorldId: 'my-frontier',
    completedContractIds: Array.from({ length: 180 }, (_, i) => `contract-${i}`),
    districtLevels: { creator: 9, systems: 2, unknown: 4 },
    privateContentStored: true, rawPromptStored: true
  });
  assert.equal(validateEonCityRt91SaveEnvelope(envelope).ok, true);
  assert.equal(envelope.completedContractIds.length, 120);
  assert.equal(envelope.districtLevels.creator, 4);
  assert.equal(Object.hasOwn(envelope.districtLevels, 'unknown'), false);
  assert.equal(envelope.privateContentStored, false);
  assert.equal(envelope.ownsXpAuthority, false);
  assert.equal(envelope.ownsBuildingCoordinateAuthority, false);
  assert.equal(migrateEonCityRt91SaveEnvelope({ seed: 'legacy-a', worldId: 'storm-sector' }).currentWorldId, 'storm-sector');
});

test('RT91 interaction registry forbids ambiguous significant objects', () => {
  const registry = createEonCityRt91InteractionRegistry([
    defineEonCityRt91Interaction({ id: 'storm-relay-console', worldId: 'storm-sector', label: 'Storm Relay Console', action: 'review-storm-relay', prompt: 'Review relay', range: 3.2, authority: 'storm-mission-runtime' }),
    defineEonCityRt91Interaction({ id: 'storm-background-pipe', worldId: 'storm-sector', label: 'Background pipe', kind: 'decorative' })
  ]);
  assert.equal(validateEonCityRt91InteractionRegistry(registry).ok, true);
  assert.equal(registry.entries[0].pickable, true);
  assert.equal(registry.entries[1].pickable, false);
});

test('RT91 NPC life decisions are low-frequency, deterministic and suspend off-world', () => {
  const first = deriveEonCityRt91NpcLifeDecision({ npcId: 'maintainer-a', worldId: 'storm-sector', role: 'maintenance-worker', at: 10_000, nearPlayer: true, stormSeverity: 3 });
  const again = deriveEonCityRt91NpcLifeDecision({ npcId: 'maintainer-a', worldId: 'storm-sector', role: 'maintenance-worker', at: 10_000, nearPlayer: true, stormSeverity: 3 });
  assert.deepEqual(first, again);
  assert.equal(validateEonCityRt91NpcLifeDecision(first).ok, true);
  assert.equal(first.decisionRunsAtFrameRate, false);
  const hidden = deriveEonCityRt91NpcLifeDecision({ npcId: 'maintainer-a', worldId: 'storm-sector', hiddenWorld: true });
  assert.equal(hidden.active, false);
  assert.equal(hidden.cadenceMs, 0);
});

test('RT91 EONBOT guides and warns without auto-navigation or camera obstruction', () => {
  const warning = deriveEonCityRt91EonbotWorldBehavior({ worldId: 'storm-sector', hazardSeverity: 4 });
  assert.equal(warning.state, 'warn');
  assert.equal(warning.autoNavigatesPlayer, false);
  assert.equal(warning.positioning.avoidCameraCenterCone, true);
  assert.equal(warning.positioning.blocksPlayerCollision, false);
  assert.equal(warning.localAiRequired, false);
});

test('RT91 audio uses layered crossfades and fully suspends hidden worlds', () => {
  const active = buildEonCityRt91AudioMix({ worldId: 'storm-sector', zoneId: 'storm-eye', eventId: 'supercell', missionId: 'storm-rescue' });
  assert.ok(active.layers.length >= 4);
  assert.equal(active.tinyBoundaryCrossingRestartsBaseTrack, false);
  assert.equal(active.ownsAudioContext, false);
  const hidden = buildEonCityRt91AudioMix({ worldId: 'storm-sector', zoneId: 'storm-eye', hiddenWorld: true });
  assert.equal(hidden.hiddenWorldAudioSuspended, true);
  assert.ok(hidden.layers.every((layer) => layer.gain === 0));
});
