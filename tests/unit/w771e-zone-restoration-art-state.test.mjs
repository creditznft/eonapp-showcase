import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW771ERestorationArtState } from '../../assets/js/city/w771/eon-expanse-w771e-zone-restoration-art-state.js';

test('W771E starts all zones damaged without fabricating restoration', () => {
  const state = deriveEonExpanseW771ERestorationArtState();
  assert.equal(state.zones.length, 5);
  assert.equal(state.restoredZoneCount, 0);
  assert.equal(state.damagedZoneCount, 5);
  assert.equal(state.awardsXp, false);
  assert.equal(state.mutatesMissionState, false);
});

test('W771E projects partial physical objective progress as restoring rather than restored', () => {
  const state = deriveEonExpanseW771ERestorationArtState({ beaconOneStage: 2, archiveRecordCount: 2, activatedRelayNodeIds: ['relay-node-0'] });
  assert.equal(state.zones.find((zone) => zone.zoneId === 'beacon-fields').artStage, 'restoring');
  assert.equal(state.zones.find((zone) => zone.zoneId === 'archive-ruins').artStage, 'restoring');
  assert.equal(state.zones.find((zone) => zone.zoneId === 'transit-scar').artStage, 'restoring');
  assert.equal(state.restoredZoneCount, 0);
});

test('W771E reveals each restored state only from its canonical milestone or progress authority', () => {
  const state = deriveEonExpanseW771ERestorationArtState({
    companionBonded: true,
    beaconOneStage: 3,
    beaconTwoRepaired: true,
    regionalTransitRestored: true,
    campaignComplete: true
  });
  assert.equal(state.restoredZoneCount, 5);
  assert.ok(state.zones.every((zone) => zone.revealRestorationModules));
  assert.equal(state.averageRestorationPercent, 100);
});

test('W771E exposes bounded visual intensities and no private content', () => {
  const state = deriveEonExpanseW771ERestorationArtState({ beaconOneStage: 1, regionalCoreSynchronized: true });
  for (const zone of state.zones) {
    assert.ok(zone.circuitIntensity >= 0.16 && zone.circuitIntensity <= 1);
    assert.ok(zone.warmIntensity >= 0.12 && zone.warmIntensity <= 0.88);
    assert.ok(zone.fogRelief >= 0 && zone.fogRelief <= 0.48);
  }
  assert.equal(state.privateContentStored, false);
});
