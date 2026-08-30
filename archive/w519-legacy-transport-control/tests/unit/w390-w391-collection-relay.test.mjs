import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonCollectionTruth, resolveDeterministicVaultReveal } from '../../assets/js/collection/eon-collection-foundation.js';
import { getEonRelayPilotTruth, validateRelayCandidate } from '../../assets/js/relay/eon-relay-pilot-contract.js';
import { inspectW390W391CollectionRelay } from '../../scripts/w390-w391-collection-relay-gate.mjs';

test('W390 keeps Collection deterministic, locked and non-financial', () => {
  const truth = getEonCollectionTruth();
  const reveal = resolveDeterministicVaultReveal({ missionId: 'forge-local-export-reviewed', evidenceKind: 'forge-source-review' });
  assert.equal(truth.enabled, false);
  assert.equal(truth.transferable, false);
  assert.equal(truth.cashValue, false);
  assert.equal(reveal.ok, true);
  assert.equal(reveal.deterministic, true);
  assert.equal(reveal.randomChance, false);
  assert.equal(reveal.grantCreated, false);
});

test('W391 keeps EON Relay disabled and rejects every candidate', () => {
  const truth = getEonRelayPilotTruth();
  const decision = validateRelayCandidate({ event: 'verified-activation', verifiedGrantCount: 0 });
  assert.equal(truth.enabled, false);
  assert.equal(truth.createsInviteLink, false);
  assert.equal(decision.ok, false);
  assert.ok(decision.reasons.includes('relay-disabled'));
});

test('W390/W391 static foundation gate passes without a live program', () => {
  const report = inspectW390W391CollectionRelay({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No Collection grant/i);
});
