import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_DURABLE_WORK_RUNTIME_STATUS,
  prepareEonDurableWorkPacket,
  getEonDurableWorkContractTruth
} from '../../assets/js/automation/eon-durable-work-contract.js';

const nowMs = 1_786_948_800_000;
const base = {
  jobId: 'job:rt92:1',
  accountRef: 'acct:opaque:1',
  projectId: 'project:1',
  capabilityId: 'business-intelligence-briefs',
  taskClass: 'local-business-brief',
  safeLabel: 'Prepare business brief',
  inputDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  idempotencyKey: 'idem:rt92:1',
  nonce: 'nonce:rt92:1',
  nowMs,
  expiresAtMs: nowMs + 60_000,
  capacity: {
    softwareAccess: true,
    workloadClass: 'platform-hosted',
    capacityAuthority: 'subscription',
    serverVerifiedCapacity: true,
    currentUsage: 2,
    requestedUnits: 1,
    limit: 10
  }
};

test('durable work contract remains design-only and cannot execute', () => {
  const result = prepareEonDurableWorkPacket(base);
  assert.equal(result.ok, true);
  assert.equal(result.runtimeActive, false);
  assert.equal(result.jobCreated, false);
  assert.equal(result.backgroundJobCreated, false);
  assert.equal(result.networkRequestCreated, false);
  assert.equal(result.externalEffectCreated, false);
  assert.equal(result.platformBackendLegacyAllowed, false);
  assert.equal(result.packet.browserExecutionAuthority, false);
  assert.equal(result.packet.rawPromptStored, false);
  assert.equal(EON_DURABLE_WORK_RUNTIME_STATUS, 'design-only-disabled');
});

test('raw prompt, credentials or raw outputs are rejected from durable packet', () => {
  for (const unsafe of [
    { prompt: 'secret prompt' },
    { credentials: { token: 'x' } },
    { output: 'raw model output' }
  ]) {
    const result = prepareEonDurableWorkPacket({ ...base, ...unsafe });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'raw-payload-not-allowed-in-durable-contract');
  }
});

test('platform-hosted work fails closed without server-verified finite capacity', () => {
  const noServerProof = prepareEonDurableWorkPacket({
    ...base,
    capacity: { ...base.capacity, serverVerifiedCapacity: false }
  });
  assert.equal(noServerProof.ok, false);
  assert.match(noServerProof.reason, /server-verified-capacity-required/);

  const ultimateOnly = prepareEonDurableWorkPacket({
    ...base,
    capacity: { softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: '' }
  });
  assert.equal(ultimateOnly.ok, false);
  assert.match(ultimateOnly.reason, /capacity-authority-required/);
});

test('external effects must identify an existing Action Gateway type and remain unapproved', () => {
  const unknown = prepareEonDurableWorkPacket({ ...base, externalActionType: 'email-anything' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'external-action-must-use-known-action-gateway-type');

  const known = prepareEonDurableWorkPacket({ ...base, externalActionType: 'github-repository-create' });
  assert.equal(known.ok, true);
  assert.equal(known.actionGatewayRequiredForExternalEffect, true);
  assert.equal(known.packet.externalAction.actionTypeId, 'github-repository-create');
  assert.equal(known.packet.externalAction.requiresSeparateExplicitApproval, true);
  assert.equal(known.packet.externalAction.approved, false);
  assert.equal(known.packet.externalEffectAuthorized, false);
});

test('expiry, nonce, digest and idempotency are mandatory', () => {
  assert.equal(prepareEonDurableWorkPacket({ ...base, expiresAtMs: nowMs }).ok, false);
  assert.equal(prepareEonDurableWorkPacket({ ...base, nonce: '' }).ok, false);
  assert.equal(prepareEonDurableWorkPacket({ ...base, inputDigest: 'not-a-digest' }).ok, false);
  assert.equal(prepareEonDurableWorkPacket({ ...base, idempotencyKey: '' }).ok, false);
});

test('truth contract names future proofs without claiming a released runtime', () => {
  const truth = getEonDurableWorkContractTruth();
  assert.equal(truth.runtimeActive, false);
  assert.equal(truth.browserCanCreateDurableJob, false);
  assert.equal(truth.browserCanGrantHostedCapacity, false);
  assert.equal(truth.actionGatewayRequiredForExternalEffects, true);
  assert.equal(truth.legacyPlatformBackendAllowed, false);
  assert.ok(truth.requiredFutureProofs.includes('cost-and-abuse-budget-proof'));
});
