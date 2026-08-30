import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEonCityW660CompletionMatrix,
  validateEonCityW660CompletionMatrix
} from '../../assets/js/city/w660/eon-city-w660-completion-matrix.js';

test('W660 City completion matrix has exactly 34 effective assets after five exclusions and six replacements', () => {
  const matrix = buildEonCityW660CompletionMatrix();
  assert.equal(matrix.baseAssetCount, 33);
  assert.equal(matrix.supersededAssetCount, 5);
  assert.equal(matrix.functionalReplacementCount, 6);
  assert.equal(matrix.effectiveAssetCount, 34);
  assert.equal(new Set(matrix.effectiveAssetIds).size, 34);
});

test('W660 City completion matrix binds all fourteen effective character assets', () => {
  const matrix = buildEonCityW660CompletionMatrix();
  assert.equal(matrix.effectiveCharacterCount, 14);
  assert.equal(matrix.productBoundCharacterCount, 14);
  assert.deepEqual(matrix.missingCharacterRoleAssetIds, []);
});

test('W660 City completion matrix covers nine playable districts and nine Nexus stations', () => {
  const matrix = buildEonCityW660CompletionMatrix();
  assert.equal(matrix.playableDistrictCount, 9);
  assert.equal(matrix.nexusStationCount, 9);
  assert.deepEqual(matrix.missingStreamedDistrictIds, []);
  assert.equal(matrix.commandCentreProceduralCore, true);
});

test('W660 City completion matrix locks the recovered productive systems without overstating browser proof', () => {
  const check = validateEonCityW660CompletionMatrix();
  assert.equal(check.ok, true, check.errors.join(','));
  assert.ok(Object.values(check.matrix.systems).every(Boolean));
  assert.equal(check.matrix.browserProof.sourceComplete, true);
  assert.equal(check.matrix.browserProof.localHeadedPending, true);
  assert.equal(check.matrix.browserProof.rtx3050PhysicalPending, true);
  assert.equal(check.matrix.browserProof.previewPending, true);
  assert.equal(check.matrix.browserProof.productionPending, true);
});
