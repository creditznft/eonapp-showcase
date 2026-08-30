import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW778ASideMissionTransformations, validateEonExpanseW778ATransformationContract } from '../../assets/js/city/w778/eon-expanse-w778a-side-mission-transformations.js';

test('W778A maps exactly the five maintained side mission families', () => {
  const contract = validateEonExpanseW778ATransformationContract();
  assert.equal(contract.ok, true);
  assert.equal(contract.total, 5);
  assert.equal(contract.interactive, false);
});

test('W778A activates only signals backed by canonical side completion state', () => {
  const projection = deriveEonExpanseW778ASideMissionTransformations({ completedSideMissions: ['lost-worker', 'signal-salvage'], sideCompletionCounts: { 'signal-salvage': 3, 'lost-worker': 1 } });
  assert.equal(projection.activeCount, 2);
  assert.equal(projection.completionTotal, 4);
  assert.equal(projection.rows.find((row) => row.missionId === 'signal-salvage').completionCount, 3);
  assert.equal(projection.rows.find((row) => row.missionId === 'archive-sweep').active, false);
});

test('W778A remains non-interactive, non-financial and progression-free', () => {
  const projection = deriveEonExpanseW778ASideMissionTransformations({ completedSideMissions: ['lost-worker'] });
  assert.equal(projection.mutatesMissionState, false);
  assert.equal(projection.grantsXp, false);
  assert.equal(projection.privateContentStored, false);
  assert.ok(projection.rows.every((row) => row.interactive === false && row.grantsXp === false));
});
