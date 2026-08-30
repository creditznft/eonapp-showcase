import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAPABILITY_TRUTH_LIFECYCLES,
  CAPABILITY_TRUTH_REGISTRY,
  getCapabilityTruth,
  getCapabilityTruthForRoute,
  isCapabilityAvailableLocally
} from '../../assets/js/capabilities/capability-truth-registry.js';

test('W302 registry has one truthful record per reviewed capability with required boundary fields', () => {
  const ids = new Set();
  for (const record of CAPABILITY_TRUTH_REGISTRY) {
    assert.ok(record.id);
    assert.equal(ids.has(record.id), false, `duplicate ${record.id}`);
    ids.add(record.id);
    assert.ok(CAPABILITY_TRUTH_LIFECYCLES.includes(record.lifecycle));
    assert.ok(record.label && record.canonicalSurface && record.evidenceOwner && record.evidenceTest && record.truthfulUserFacingNote);
    if (record.externalEffect) assert.equal(record.requiresApproval, true, `${record.id} effect requires approval`);
  }
});

test('W302 distinguishes local active work from planned, retired, and blocked areas', () => {
  assert.equal(getCapabilityTruth('workspace')?.lifecycle, 'active-local');
  assert.equal(getCapabilityTruth('youtube-private-upload')?.lifecycle, 'planned');
  assert.equal(getCapabilityTruth('legacy-social-publisher')?.lifecycle, 'retired');
  assert.equal(getCapabilityTruth('reward-wallet-referral')?.lifecycle, 'blocked');
  assert.equal(getCapabilityTruth('server-referral-eonkeys')?.lifecycle, 'active-connected');
  assert.equal(getCapabilityTruth('server-referral-eonkeys')?.externalEffect, true);
  assert.match(getCapabilityTruth('server-referral-eonkeys')?.truthfulUserFacingNote || '', /server-authoritative/i);
  assert.match(getCapabilityTruth('server-referral-eonkeys')?.truthfulUserFacingNote || '', /sharing.*never grant value/i);
  assert.equal(isCapabilityAvailableLocally('workspace'), true);
  assert.equal(isCapabilityAvailableLocally('youtube-private-upload'), false);
  assert.equal(isCapabilityAvailableLocally('server-referral-eonkeys'), false);
  assert.equal(getCapabilityTruthForRoute('/eoncity?target=workspace')?.id, 'eon-city-mirror');
  assert.equal(getCapabilityTruthForRoute('/eon-keys')?.id, 'server-referral-eonkeys');
});
