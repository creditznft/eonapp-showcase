import assert from 'node:assert/strict';
import test from 'node:test';
import { CITY_PERFORMANCE_LAB_CASES } from '../../assets/js/city/eon-city-performance-lab.js';
import { W371_PERFORMANCE_LAB_CONTRACT } from '../../config/w371-performance-lab-contract.mjs';

test('L95 launch checklist requires a warm unchanged City reopen asset-reuse proof', () => {
  const item = CITY_PERFORMANCE_LAB_CASES.find((entry) => entry.id === 'warm-reopen-cache');
  assert.ok(item);
  assert.equal(item.required, true);
  assert.match(item.detail, /close\/reopen the unchanged release/i);
  assert.match(item.detail, /zero or near-zero observed City-art network transfer/i);
  assert.ok(W371_PERFORMANCE_LAB_CONTRACT.requiredCases.includes('warm-reopen-cache'));
});
