import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreatorIntent, getCreatorModeTruth, getCreatorRailContinuation } from '../../assets/js/create/creator-mode-contract.js';

test('W627A creates one local intent without starting execution', () => {
  const result = buildCreatorIntent({ mediaKind: 'image', rail: 'guide', goal: 'A calm graphite launch illustration.' }, { explicitUserAction: true, now: () => 1_700_000_000_000 });
  assert.equal(result.ok, true);
  assert.equal(result.intent.executionStarted, false);
  assert.equal(result.intent.providerRequestCreated, false);
  assert.equal(getCreatorRailContinuation(result.intent).executionOwner, 'guide-only-no-generation');
});

test('W627A rejects hidden rails and secret-looking goals', () => {
  assert.equal(buildCreatorIntent({ mediaKind: 'image', rail: 'cloud-auto', goal: 'test' }, { explicitUserAction: true }).reason, 'execution-rail-required');
  assert.equal(buildCreatorIntent({ mediaKind: 'image', rail: 'guide', goal: 'api_key=secretvalue' }, { explicitUserAction: true }).reason, 'secret-looking-input-rejected');
  assert.equal(getCreatorModeTruth().hiddenCloudFallback, false);
});
