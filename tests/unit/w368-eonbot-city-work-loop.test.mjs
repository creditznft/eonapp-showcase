import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  createCityWorkLoopProposal,
  getCityWorkLoopIntents,
  getCityWorkLoopTruth,
  recordCityWorkLoopReturn,
  validateCityWorkLoopProposal
} from '../../assets/js/city/eon-city-work-loop.js';
import { W368_EONBOT_CITY_WORK_LOOP_CONTRACT, validateW368EonbotCityWorkLoopContract } from '../../config/w368-eonbot-city-work-loop-contract.mjs';

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test('W368 exposes a small bounded EONBOT City intent catalogue', () => {
  assert.equal(getCityWorkLoopIntents().length, 4);
  assert.equal(getCityWorkLoopTruth().providerRequest, false);
  assert.deepEqual(validateW368EonbotCityWorkLoopContract(), []);
  assert.equal(W368_EONBOT_CITY_WORK_LOOP_CONTRACT.truthRules.typedCityTextStored, false);
});

test('W368 creates a local review-only plan while discarding typed City text', async () => {
  const sessionStorage = storage();
  const cityStorage = storage();
  const result = await createCityWorkLoopProposal({ intentId: 'shape-project', typedRequest: 'Private launch details must never persist here', now: Date.UTC(2026, 5, 26, 6, 0, 0) }, { cryptoApi: webcrypto, sessionStorage, cityStorage });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.proposal.state, 'review-needed');
  assert.equal(result.proposal.typedRequest.present, true);
  assert.equal(result.proposal.typedRequest.stored, false);
  assert.equal(result.proposal.typedRequest.forwarded, false);
  assert.equal(JSON.stringify(result.proposal).includes('Private launch details'), false);
  assert.equal(validateCityWorkLoopProposal(result.proposal).ok, true);
});

test('W368 return receipt stays bounded and local', async () => {
  const sessionStorage = storage();
  const cityStorage = storage();
  const created = await createCityWorkLoopProposal({ intentId: 'build-brief', now: Date.UTC(2026, 5, 26, 6, 0, 0) }, { cryptoApi: webcrypto, sessionStorage, cityStorage });
  const returned = recordCityWorkLoopReturn(created.proposal, { now: Date.UTC(2026, 5, 26, 6, 1, 0), cityStorage });
  assert.equal(returned.ok, true);
  assert.equal(returned.receipt.storesUserContent, false);
  assert.equal(returned.receipt.externalEffect, false);
});
