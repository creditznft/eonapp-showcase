import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  prepareSealedLocalAction,
  verifySealedLocalAction,
  confirmSealedLocalAction,
  getLocalActionSealTruth
} from '../../assets/js/local-first/eon-local-action-seal.js';
import { runW309LocalActionSealGate } from '../../scripts/w309-local-action-seal-gate.mjs';

const cryptoApi = webcrypto;
const now = 1_770_000_000_000;
const input = Object.freeze({
  kind: 'export-local-artifact',
  capabilityId: 'creator-suite-2',
  route: '/workspace',
  summary: 'Export the reviewed local artifact yourself.',
  artifactHashes: ['sha256:AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-ABCDE']
});

test('W309 seals an expiring local action and detects payload tampering', async () => {
  const action = await prepareSealedLocalAction(input, { now, cryptoApi });
  const verified = await verifySealedLocalAction(action, { now: now + 1, cryptoApi });
  assert.equal(verified.ok, true);
  assert.equal(verified.status, 'prepared');
  assert.equal(action.externalEffectStarted, false);
  assert.equal(action.networkRequestCreated, false);

  const tampered = { ...action, route: '/chat' };
  const invalid = await verifySealedLocalAction(tampered, { now: now + 1, cryptoApi });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, 'seal-mismatch');
});

test('W309 requires explicit local confirmation and confirmation never executes a provider or publish effect', async () => {
  const action = await prepareSealedLocalAction(input, { now, cryptoApi });
  const denied = await confirmSealedLocalAction(action, { now: now + 1, cryptoApi });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'explicit-user-confirmation-required');
  const confirmed = await confirmSealedLocalAction(action, { explicitConfirmation: true, now: now + 1, cryptoApi });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.action.status, 'confirmed');
  assert.equal(confirmed.action.executionAllowed, false);
  assert.equal(confirmed.action.externalEffectStarted, false);
  assert.equal(confirmed.action.networkRequestCreated, false);
  assert.equal((await verifySealedLocalAction(confirmed.action, { now: now + 2, cryptoApi })).ok, true);
});

test('W309 expires a record before any confirmation may be recorded', async () => {
  const action = await prepareSealedLocalAction({ ...input, expiresAt: new Date(now + 1_000).toISOString() }, { now, cryptoApi });
  const result = await confirmSealedLocalAction(action, { explicitConfirmation: true, now: now + 1_001, cryptoApi });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'action-expired');
});

test('W309 local action truth and source gate remain no-execution', () => {
  const truth = getLocalActionSealTruth();
  assert.equal(truth.externalExecution, false);
  assert.equal(truth.unattendedScheduling, false);
  assert.equal(truth.providerOrAccountConnection, false);
  assert.equal(runW309LocalActionSealGate().ok, true);
});
