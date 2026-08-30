import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW773AZoneRestorationBoard } from '../../assets/js/city/w773/eon-expanse-w773a-zone-restoration-board.js';

test('W773A reports all five authored zones with truthful art stages', () => {
  const board = deriveEonExpanseW773AZoneRestorationBoard({ companionBonded: true, beaconOneStage: 2, archiveRecordCount: 0 });
  assert.equal(board.rows.length, 5);
  assert.equal(board.rows.find((row) => row.zoneId === 'gateway-overlook').artStage, 'restored');
  assert.equal(board.rows.find((row) => row.zoneId === 'beacon-fields').artStage, 'restoring');
  assert.equal(board.rows.find((row) => row.zoneId === 'archive-ruins').artStage, 'damaged');
});

test('W773A exposes screenshot-recognizable zone labels and bounded percentages', () => {
  const board = deriveEonExpanseW773AZoneRestorationBoard({ campaignComplete: true, beaconOneStage: 3, beaconTwoRepaired: true, regionalTransitRestored: true, companionBonded: true });
  assert.deepEqual(board.rows.map((row) => row.label), ['Gateway Overlook', 'Beacon Fields', 'Archive Ruins', 'Transit Scar', 'Horizon Vault']);
  assert.equal(board.rows.every((row) => row.restorationPercent >= 0 && row.restorationPercent <= 100), true);
  assert.equal(board.restoredZoneCount, 5);
});

test('W773A is projection-only and stores no private content', () => {
  const board = deriveEonExpanseW773AZoneRestorationBoard({});
  assert.equal(board.receiptDerivedOnly, true);
  assert.equal(board.privateContentStored, false);
  assert.equal(board.mutatesMissionState, false);
  assert.equal(board.rows.every((row) => row.grantsXp === false), true);
});
