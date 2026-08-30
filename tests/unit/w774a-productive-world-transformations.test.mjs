import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW774AProductiveTransformations, validateEonExpanseW774ATransformationContract } from '../../assets/js/city/w774/eon-expanse-w774a-productive-world-transformations.js';

test('W774A maps exactly the five maintained productive mission families', () => {
  const validation = validateEonExpanseW774ATransformationContract();
  assert.equal(validation.ok, true);
  assert.equal(validation.transformationCount, 5);
});

test('W774A activates only transformations backed by completed productive missions', () => {
  const view = deriveEonExpanseW774AProductiveTransformations({ completedProductiveMissions: ['create-expedition', 'automation-relay', 'forged-mission'] });
  assert.equal(view.activeCount, 2);
  assert.equal(view.rows.find((row) => row.missionId === 'create-expedition').active, true);
  assert.equal(view.rows.find((row) => row.missionId === 'knowledge-recovery').active, false);
});

test('W774A remains visual-only, non-interactive and privacy safe', () => {
  const view = deriveEonExpanseW774AProductiveTransformations({ completedProductiveMissions: ['local-ai-survey'] });
  assert.equal(view.rows.every((row) => row.interactive === false && row.grantsXp === false), true);
  assert.equal(view.mutatesMissionState, false);
  assert.equal(view.privateContentStored, false);
});
