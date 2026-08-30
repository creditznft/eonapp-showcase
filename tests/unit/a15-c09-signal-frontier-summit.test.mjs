import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEonCityC09SignalFrontierSummit,
  validateEonCityC09SignalFrontierSummit,
  getEonCityC09SignalFrontierTruth
} from '../../assets/js/city/c09/eon-city-c09-signal-frontier-summit.js';

const summit = buildEonCityC09SignalFrontierSummit();

test('C09 preserves the exact 35-case W802A owner matrix', () => {
  assert.equal(summit.requiredCaseCount, 35);
  assert.equal(new Set(summit.cases.map((entry) => entry.id)).size, 35);
});

test('C09 maps all 28 product cases to source and tests', () => {
  const product = summit.cases.filter((entry) => entry.sourceCovered);
  assert.equal(product.length, 28);
  assert.equal(product.every((entry) => entry.sourceModule && entry.sourceTest), true);
});

test('C09 keeps all seven browser and performance cases externally pending', () => {
  const external = summit.cases.filter((entry) => entry.externalEvidenceRequired);
  assert.deepEqual(external.map((entry) => entry.id), [
    'chrome-desktop', 'edge-desktop', 'mobile-landscape',
    'performance-lite', 'performance-balanced', 'performance-cinematic', 'transition-soak'
  ]);
  assert.equal(external.every((entry) => entry.passed === false), true);
});

test('C09 cannot certify or deploy from source coverage', () => {
  const result = validateEonCityC09SignalFrontierSummit(summit);
  assert.equal(result.ok, true, result.errors.join(','));
  const truth = getEonCityC09SignalFrontierTruth();
  assert.equal(truth.flagshipSourceProgrammeComplete, true);
  assert.equal(truth.renderedOwnerEvidenceComplete, false);
  assert.equal(truth.productionReady, false);
});
