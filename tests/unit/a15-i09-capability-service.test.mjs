import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EON_CAPABILITY_ENVELOPE_SCHEMA,
  buildEffectiveCapabilitySnapshot,
  fetchEonCapabilitySnapshot,
  getFreeCapabilitySnapshot,
  getEonCapabilityLimit,
  hasEonCapability,
  setCurrentCapabilitySnapshot,
  signCapabilitySnapshot,
  verifyCapabilityEnvelope
} from '../../assets/js/capabilities/eon-capability-service.js';
import { evaluateEonCapacity } from '../../assets/js/storage/eon-capacity-authority.js';
import { registerProjectSource } from '../../assets/js/projects/eon-project-registry.js';
import { resolveLockedFeature } from '../../assets/js/referrals/eon-feature-unlock-resolver.js';
import { onRequestGet as getCapabilityStatus } from '../../functions/api/capabilities/status.js';

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(String(key), String(value)),
    removeItem: (key) => map.delete(String(key)),
    key: (index) => [...map.keys()][index] ?? null,
    get length() { return map.size; }
  };
}

function activeEntitlement(tierId = 'studio', now = Date.now()) {
  return {
    entitlement: { tier_id: tierId, status: 'active', renews_at: now + 86400000 },
    lifecycle: { tier_id: tierId, access_status: 'active', current_period_end: now + 86400000 }
  };
}

test('A15 I09 fails closed to maintained Free limits before a server snapshot arrives', () => {
  const snapshot = getFreeCapabilitySnapshot({ now: 1000 });
  assert.equal(snapshot.tierId, 'free');
  assert.equal(snapshot.serverAuthoritative, false);
  assert.equal(snapshot.limits.projectSlots, 3);
  assert.equal(snapshot.limits['ordinary-projects'], 3);
  assert.equal(snapshot.browserClaimAccepted, false);
});

test('A15 I09 derives paid capability only from active server billing lifecycle', () => {
  const now = 10_000;
  const active = buildEffectiveCapabilitySnapshot({ ...activeEntitlement('studio', now), accountId: 'acc_1', now });
  assert.equal(active.tierId, 'studio');
  assert.equal(active.entitlementAccessActive, true);
  assert.equal(active.limits.projectSlots, 35);
  assert.equal(hasEonCapability('studio-workflows', active), true);
  const revoked = buildEffectiveCapabilitySnapshot({ entitlement: { tier_id: 'max', status: 'revoked' }, lifecycle: { tier_id: 'max', access_status: 'revoked' }, accountId: 'acc_1', now });
  assert.equal(revoked.tierId, 'free');
  assert.equal(revoked.limits.projectSlots, 3);
});

test('A15 I09 active EONKEY unlocks alter individual limits and feature behavior without creating a tier', () => {
  const now = 20_000;
  const snapshot = buildEffectiveCapabilitySnapshot({
    accountId: 'acc_free',
    now,
    unlocks: [
      { recordId: 'unlock_1', unlockId: 'builder-project-slots-90d', status: 'active', issuedAt: now - 1000, expiresAt: now + 100000 },
      { recordId: 'unlock_2', unlockId: 'builder-premium-workflow-pack', status: 'active', issuedAt: now - 1000 },
      { recordId: 'expired', unlockId: 'power-project-slots-90d', status: 'active', issuedAt: 1, expiresAt: now - 1 }
    ]
  });
  assert.equal(snapshot.tierId, 'free');
  assert.equal(snapshot.subscriptionCreatedByUnlock, false);
  assert.equal(snapshot.limits.projectSlots, 6);
  assert.equal(snapshot.limits.premiumWorkflowPacks, 1);
  assert.equal(hasEonCapability('studio-workflows', snapshot), true);
  assert.equal(snapshot.unlocks.length, 2);
});

test('A15 I09 signs server snapshots and detects any payload tampering', async () => {
  const snapshot = buildEffectiveCapabilitySnapshot({ ...activeEntitlement('plus', 30_000), accountId: 'acc_2', now: 30_000, expiresAt: 40_000 });
  const envelope = await signCapabilitySnapshot(snapshot, 'test-signing-key-that-never-leaves-the-server');
  assert.equal(envelope.ok, true);
  assert.equal(envelope.schema, EON_CAPABILITY_ENVELOPE_SCHEMA);
  assert.equal(envelope.containsSigningKey, false);
  assert.equal((await verifyCapabilityEnvelope(envelope, 'test-signing-key-that-never-leaves-the-server', { now: 35_000 })).ok, true);
  const tampered = { ...envelope, snapshot: { ...envelope.snapshot, tierId: 'max' } };
  assert.equal((await verifyCapabilityEnvelope(tampered, 'test-signing-key-that-never-leaves-the-server', { now: 35_000 })).reason, 'capability-signature-invalid');
});

test('A15 I09 browser loader rejects unsigned or stale capability claims and keeps Free behavior', async () => {
  setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot());
  const unsigned = await fetchEonCapabilitySnapshot({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ snapshot: { tierId: 'max' } }) }) });
  assert.equal(unsigned.ok, false);
  assert.equal(unsigned.snapshot.tierId, 'free');
  const staleSnapshot = buildEffectiveCapabilitySnapshot({ ...activeEntitlement('max', 1000), accountId: 'acc', now: 1000, expiresAt: 1001 });
  const stale = await fetchEonCapabilitySnapshot({ now: 2000, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ schema: EON_CAPABILITY_ENVELOPE_SCHEMA, algorithm: 'HMAC-SHA-256', signature: 'present', snapshot: staleSnapshot }) }) });
  assert.equal(stale.ok, false);
  assert.equal(stale.snapshot.tierId, 'free');
});

test('A15 I09 capability limits change the existing no-eviction authority automatically', () => {
  const free = getFreeCapabilitySnapshot();
  setCurrentCapabilitySnapshot(free);
  const allowed = evaluateEonCapacity({ resourceId: 'ordinary-projects', activeCount: 2, totalCount: 2, requestedCount: 1, requestedTotalCount: 1 });
  const blocked = evaluateEonCapacity({ resourceId: 'ordinary-projects', activeCount: 3, totalCount: 3, requestedCount: 1, requestedTotalCount: 1 });
  assert.equal(allowed.allowed, true);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.limit, 3);
  assert.equal(blocked.limitSource, 'free-capability-fallback');
  const power = buildEffectiveCapabilitySnapshot({ ...activeEntitlement('power'), accountId: 'acc_power' });
  setCurrentCapabilitySnapshot(power);
  assert.equal(getEonCapabilityLimit('ordinary-projects'), 90);
  assert.equal(evaluateEonCapacity({ resourceId: 'ordinary-projects', activeCount: 89, totalCount: 89, requestedCount: 1 }).allowed, true);
});

test('A15 I09 enforces one global active Project limit across ordinary and Forge namespaces', () => {
  setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot());
  const storage = memoryStorage();
  for (const [namespace, sourceId] of [['ordinary', 'p1'], ['forge', 'p2'], ['ordinary', 'p3']]) {
    const result = registerProjectSource({ namespace, sourceId, relation: 'owner', title: sourceId, operationalStatus: 'active' }, { storage, emit: false });
    assert.equal(result.ok, true);
  }
  const fourth = registerProjectSource({ namespace: 'forge', sourceId: 'p4', relation: 'owner', title: 'p4', operationalStatus: 'active' }, { storage, emit: false });
  assert.equal(fourth.ok, false);
  assert.equal(fourth.reason, 'capacity-reached');
  assert.equal(fourth.capacity.resourceId, 'universal-projects');
  assert.equal(fourth.capacity.limit, 3);
});

test('A15 I09 verified plan or EONKEY feature groups unlock the real locked-feature resolver', () => {
  const plan = buildEffectiveCapabilitySnapshot({ ...activeEntitlement('plus'), accountId: 'acc_plus' });
  const planDecision = resolveLockedFeature('project-slots-plus', { capabilitySnapshot: plan });
  assert.equal(planDecision.accessActive, true);
  assert.equal(planDecision.accessSource, 'subscription-plan');
  const key = buildEffectiveCapabilitySnapshot({ accountId: 'acc_free', unlocks: [{ unlockId: 'builder-premium-workflow-pack', status: 'active', issuedAt: 1 }] });
  const keyDecision = resolveLockedFeature('studio-workflow-systems', { capabilitySnapshot: key });
  assert.equal(keyDecision.accessActive, true);
  assert.equal(keyDecision.accessSource, 'eonkey-unlock');
});



test('A15 I09 endpoint returns a signed no-store Free envelope for a guest and fails closed without signing authority', async () => {
  const request = new Request('https://eonapp.ch/api/capabilities/status');
  const success = await getCapabilityStatus({ request, env: { EON_ENTITLEMENT_SIGNING_KEY: 'test-only-capability-key', EON_SESSION_SECRET: 'test-only-session-key' } });
  assert.equal(success.status, 200);
  assert.match(success.headers.get('cache-control') || '', /no-store/);
  assert.equal(success.headers.get('vary'), 'cookie');
  const payload = await success.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.snapshot.tierId, 'free');
  assert.equal(payload.snapshot.signedIn, false);
  assert.equal(Boolean(payload.signature), true);

  const unavailable = await getCapabilityStatus({ request, env: { EON_SESSION_SECRET: 'test-only-session-key' } });
  assert.equal(unavailable.status, 503);
  const unavailablePayload = await unavailable.json();
  assert.equal(unavailablePayload.freeFallbackRequired, true);
  assert.equal(unavailablePayload.reason, 'capability-signing-key-missing');
});

test('A15 I09 capability endpoint and Core bootstrap require signed no-store server truth', () => {
  const endpoint = readFileSync(new URL('../../functions/api/capabilities/status.js', import.meta.url), 'utf8');
  const shell = readFileSync(new URL('../../assets/js/eon-app-shell.js', import.meta.url), 'utf8');
  assert.match(endpoint, /EON_ENTITLEMENT_SIGNING_KEY/);
  assert.match(endpoint, /signCapabilitySnapshot/);
  assert.match(endpoint, /cache-control': 'no-store/);
  assert.match(endpoint, /readAccountActiveEonKeyUnlocks/);
  assert.match(endpoint, /capability-ledger-read-failed/);
  assert.match(shell, /page !== 'eoncity'/);
  assert.match(shell, /installEonCapabilityService/);
});
