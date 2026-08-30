import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EON_EXPANSE_W766_ZONES, deriveEonExpanseW766WorldProgress } from '../../assets/js/city/w766/eon-expanse-w766-region-contract.js';

const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js', import.meta.url), 'utf8');

test('W766B uses one canonical five-zone Signal Frontier contract', () => {
  assert.deepEqual(EON_EXPANSE_W766_ZONES.map(({ id }) => id), ['gateway-overlook', 'beacon-fields', 'archive-ruins', 'transit-scar', 'horizon-vault']);
  assert.ok(EON_EXPANSE_W766_ZONES.every((zone) => zone.status === 'playable'));
  assert.match(source, /EON_EXPANSE_W766B_ZONES = EON_EXPANSE_W766_ZONES/);
});

test('W766B mounts authored routes and landmark families', () => {
  assert.match(source, /w766b-route-/);
  assert.match(source, /w766b-beacon-/);
  assert.match(source, /w766b-archive-pillar-/);
  assert.match(source, /w766b-archive-lintel-/);
  assert.match(source, /w766b-route-pylon-/);
  assert.match(source, /w766b-transit-rail-/);
  assert.match(source, /w766b-vault-core/);
});

test('W766B reconstructs partial and completed world state from persistence', () => {
  const progress = deriveEonExpanseW766WorldProgress({ milestones: ['archive-record:archive-record-0', 'relay-node:relay-node-1', 'vault:signal-vanguard-revealed'] });
  assert.deepEqual(progress.archiveRecordIds, ['archive-record-0']);
  assert.deepEqual(progress.activatedRelayNodeIds, ['relay-node-1']);
  assert.equal(progress.signalVanguardClaimed, true);
  assert.match(source, /applyProgress/);
  assert.match(source, /PointerEventTypes\.POINTERPICK/);
});
