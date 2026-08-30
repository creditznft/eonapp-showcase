import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRealmWorldSnapshot,
  buildRealmWorldSafetyProfile,
  buildRealmWorldArweaveManifest,
  normalizePresenceMode
} from '../../assets/js/utils/realmworld-generator.js';

describe('realmworld generator', () => {
  it('creates deterministic safe snapshots', () => {
    const input = { wallet: '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862', username: 'eon-team', displayName: 'EON Team' };
    const a = buildRealmWorldSnapshot(input, { presenceMode: 'public-listed', now: '2026-06-02T00:00:00.000Z' });
    const b = buildRealmWorldSnapshot(input, { presenceMode: 'public-listed', now: '2026-06-02T00:00:00.000Z' });
    assert.deepEqual(a, b);
    assert.equal(a.schema, 'eon.realmworld.snapshot.v1');
    assert.equal(a.safety.chat, false);
    assert.equal(a.safety.uploads, false);
    assert.equal(a.safety.maxPeers, 4);
    assert.ok(a.districts.length >= 5);
    assert.ok(a.monuments.length >= 1);
    assert.ok(a.npcs.find((npc) => npc.id === 'npc-eonbot-guide'));
  });

  it('normalizes presence modes and keeps solo private by default', () => {
    assert.equal(normalizePresenceMode('public'), 'public-listed');
    assert.equal(normalizePresenceMode('invite'), 'invite-only');
    assert.equal(normalizePresenceMode('bad'), 'solo');
    const safety = buildRealmWorldSafetyProfile('solo');
    assert.equal(safety.multiplayer, false);
    assert.equal(safety.publicDiscovery, false);
  });

  it('builds an Arweave-ready manifest', () => {
    const snapshot = buildRealmWorldSnapshot({ username: 'My Realm' }, { now: '2026-06-02T00:00:00.000Z' });
    const manifest = buildRealmWorldArweaveManifest(snapshot);
    assert.equal(manifest.schema, 'eon.realmworld.arweave-manifest.v1');
    assert.equal(manifest.path, 'realms/my-realm/realmworld.snapshot.json');
    assert.ok(manifest.tags.find((tag) => tag.name === 'EON-Object' && tag.value === 'RealmWorldSnapshot'));
  });
});
