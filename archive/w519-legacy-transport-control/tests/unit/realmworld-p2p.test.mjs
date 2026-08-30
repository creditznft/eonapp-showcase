import test from 'node:test';
import assert from 'node:assert/strict';
import { getRealmWorldNetworkPolicy, buildRealmWorldInviteEnvelope, validateRealmWorldP2PPolicy } from '../../assets/js/utils/realmworld-p2p.js';

test('RealmWorld network policy never requires a Cloudflare Worker', () => {
  for (const mode of ['solo', 'invite-only', 'public-listed']) {
    const policy = getRealmWorldNetworkPolicy(mode);
    assert.equal(policy.requiresCloudflareWorker, false);
    assert.equal(policy.requiresCentralGameServer, false);
    assert.equal(policy.chat, false);
    assert.equal(policy.uploads, false);
    assert.ok(policy.maxPeers <= 4);
  }
});

test('RealmWorld invite envelope is static and owner-approved', () => {
  const envelope = buildRealmWorldInviteEnvelope({
    schema: 'eon.realmworld.snapshot.v1',
    generatedAt: '2026-06-02T00:00:00.000Z',
    seed: 'realmworld:test',
    owner: { username: 'Manisha Realm', displayName: 'Manisha Realm', wallet: '0xabc1234567890' },
    safety: { presenceMode: 'invite-only' }
  }, { now: '2026-06-02T12:00:00.000Z' });
  assert.equal(envelope.schema, 'eon.realmworld.invite.v1');
  assert.equal(envelope.policy.requiresCloudflareWorker, false);
  assert.equal(envelope.policy.discovery, 'manual-owner-invite');
  assert.match(envelope.note, /No Cloudflare Worker/);
});

test('P2P validator rejects unsafe server and moderation-heavy flags', () => {
  const result = validateRealmWorldP2PPolicy({
    presenceMode: 'public-listed',
    requiresCloudflareWorker: true,
    requiresCentralGameServer: true,
    chat: true,
    uploads: true,
    maxPeers: 99
  });
  assert.equal(result.ok, false);
  assert.ok(result.problems.length >= 5);
  assert.equal(result.policy.requiresCloudflareWorker, false);
  assert.equal(result.policy.chat, false);
  assert.equal(result.policy.uploads, false);
  assert.equal(result.policy.maxPeers, 4);
});
