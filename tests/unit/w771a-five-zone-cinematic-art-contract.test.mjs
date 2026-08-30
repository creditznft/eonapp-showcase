import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_EXPANSE_W771A_ZONE_IDENTITIES, getEonExpanseW771AZoneIdentity, validateEonExpanseW771ACinematicArtContract } from '../../assets/js/city/w771/eon-expanse-w771a-five-zone-cinematic-art-contract.js';

test('W771A defines one distinct cinematic identity for all five Signal Frontier zones', () => {
  const result = validateEonExpanseW771ACinematicArtContract();
  assert.equal(result.ok, true);
  assert.equal(result.zoneCount, 5);
  assert.equal(result.screenshotDistinctZoneCount, 5);
  assert.deepEqual(EON_EXPANSE_W771A_ZONE_IDENTITIES.map((zone) => zone.zoneId), ['gateway-overlook', 'beacon-fields', 'archive-ruins', 'transit-scar', 'horizon-vault']);
});

test('W771A requires validated authored hero assets and forbids finished hero primitives', () => {
  for (const zone of EON_EXPANSE_W771A_ZONE_IDENTITIES) {
    assert.match(zone.heroAssetId, /^eoncity-/);
    assert.equal(zone.heroPresentation, 'validated-authored-asset-only');
    assert.equal(zone.finishedHeroPrimitiveAllowed, false);
    assert.equal(zone.modularPrimitiveUse, 'small-environment-connectors-only');
  }
});

test('W771A gives each zone a complete prop kit and restoration transformation', () => {
  for (const zone of EON_EXPANSE_W771A_ZONE_IDENTITIES) {
    assert.ok(zone.propFamilies.length >= 5);
    assert.ok(zone.transformation.milestone);
    assert.ok(zone.transformation.before);
    assert.ok(zone.transformation.after);
    assert.ok(zone.audioFamily);
  }
  assert.equal(getEonExpanseW771AZoneIdentity('archive-ruins')?.signature, 'violet-vertical-archive');
});
