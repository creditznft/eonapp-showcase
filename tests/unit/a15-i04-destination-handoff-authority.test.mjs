import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_DESTINATIONS,
  buildEonDestinationHref,
  findEonDestinationByRoute,
  getEonDestination,
  resolveEonDestination,
  validateEonDestinationRegistry
} from '../../assets/js/contracts/navigation/eon-destination-registry.js';
import {
  EON_HANDOFF_MAX_ACTIVE,
  EON_HANDOFF_STORAGE_KEY,
  consumeEonHandoff,
  inspectEonHandoffStore,
  prepareEonHandoff,
  readEonHandoff,
  writeEonHandoff
} from '../../assets/js/contracts/navigation/eon-handoff-authority.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => map
  };
}

const cryptoApi = globalThis.crypto;
const base = {
  senderId: 'create',
  receiverId: 'projects',
  kind: 'create-mode',
  referenceId: 'website',
  safeLabel: 'Website project',
  payload: { modeId: 'website', rail: 'forge' },
  handoffId: 'handoff_a15_i04_test'
};

test('A15 I04 destination registry owns canonical internal routes and query allowlists', () => {
  const validation = validateEonDestinationRegistry();
  assert.equal(validation.ok, true);
  assert.equal(validation.destinationCount, EON_DESTINATIONS.length);
  assert.equal(getEonDestination('projects')?.route, '/projects');
  assert.equal(findEonDestinationByRoute('/projects?project=abc')?.id, 'projects');
  assert.equal(findEonDestinationByRoute('https://example.com/projects'), null);
  assert.equal(buildEonDestinationHref('projects', { project: 'abc', unknown: 'drop-me' }), '/projects?project=abc');
  assert.equal(resolveEonDestination('/eoncity', { resume: 1 }).href, '/eoncity?resume=1');
  assert.equal(resolveEonDestination('missing').ok, false);
});

test('A15 I04 handoffs require explicit user action and registered endpoints', async () => {
  assert.equal((await prepareEonHandoff(base, { cryptoApi, now: 1_000 })).reason, 'explicit-user-action-required');
  assert.equal((await prepareEonHandoff({ ...base, senderId: 'unknown' }, { explicitUserAction: true, cryptoApi, now: 1_000 })).reason, 'registered-sender-and-receiver-required');
});

test('A15 I04 handoff writes, verifies, consumes once and records a non-execution receipt', async () => {
  const sessionStorage = memoryStorage();
  const written = await writeEonHandoff(base, { explicitUserAction: true, cryptoApi, sessionStorage, now: 1_000 });
  assert.equal(written.ok, true);
  assert.equal(written.href, '/projects?handoff=handoff_a15_i04_test');
  assert.equal(readEonHandoff(base.handoffId, { sessionStorage }).handoff.payload.modeId, 'website');

  const consumed = await consumeEonHandoff(base.handoffId, { receiverId: 'projects', cryptoApi, sessionStorage, now: 2_000 });
  assert.equal(consumed.ok, true);
  assert.equal(consumed.receipt.status, 'accepted');
  assert.equal(consumed.receipt.outcomeVerified, false);
  assert.equal(consumed.receipt.externalExecutionAuthority, false);

  const duplicate = await consumeEonHandoff(base.handoffId, { receiverId: 'projects', cryptoApi, sessionStorage, now: 3_000 });
  assert.equal(duplicate.reason, 'handoff-already-consumed');
  assert.equal(duplicate.receipt.receiptId, consumed.receipt.receiptId);
  assert.deepEqual(inspectEonHandoffStore({ sessionStorage }), {
    schema: 'eonapp.handoff-store.a15.v1',
    activeCount: 0,
    consumedCount: 1,
    receiptCount: 1
  });
});

test('A15 I04 handoffs reject receiver mismatch, expiry and payload tampering', async () => {
  const mismatchStore = memoryStorage();
  await writeEonHandoff(base, { explicitUserAction: true, cryptoApi, sessionStorage: mismatchStore, now: 1_000 });
  assert.equal((await consumeEonHandoff(base.handoffId, { receiverId: 'forge', cryptoApi, sessionStorage: mismatchStore, now: 2_000 })).reason, 'handoff-receiver-mismatch');

  const expiredStore = memoryStorage();
  await writeEonHandoff({ ...base, ttlMs: 60_000 }, { explicitUserAction: true, cryptoApi, sessionStorage: expiredStore, now: 1_000 });
  assert.equal((await consumeEonHandoff(base.handoffId, { receiverId: 'projects', cryptoApi, sessionStorage: expiredStore, now: 61_001 })).reason, 'handoff-expired');

  const tamperStore = memoryStorage();
  await writeEonHandoff(base, { explicitUserAction: true, cryptoApi, sessionStorage: tamperStore, now: 1_000 });
  const state = JSON.parse(tamperStore.getItem(EON_HANDOFF_STORAGE_KEY));
  state.handoffs[0].payload.modeId = 'tampered';
  tamperStore.setItem(EON_HANDOFF_STORAGE_KEY, JSON.stringify(state));
  assert.equal((await consumeEonHandoff(base.handoffId, { receiverId: 'projects', cryptoApi, sessionStorage: tamperStore, now: 2_000 })).reason, 'handoff-digest-mismatch');
});

test('A15 I04 handoffs reject sensitive payload fields and block capacity without eviction', async () => {
  const sensitive = await prepareEonHandoff({ ...base, payload: { apiKey: 'must-not-cross' } }, { explicitUserAction: true, cryptoApi, now: 1_000 });
  assert.equal(sensitive.reason, 'handoff-payload-sensitive-field');

  const sessionStorage = memoryStorage();
  for (let index = 0; index < EON_HANDOFF_MAX_ACTIVE; index += 1) {
    const written = await writeEonHandoff({ ...base, handoffId: `handoff_capacity_${index}` }, { explicitUserAction: true, cryptoApi, sessionStorage, now: 1_000 });
    assert.equal(written.ok, true);
  }
  const blocked = await writeEonHandoff({ ...base, handoffId: 'handoff_capacity_blocked' }, { explicitUserAction: true, cryptoApi, sessionStorage, now: 1_000 });
  assert.equal(blocked.reason, 'handoff-capacity-reached');
  assert.equal(inspectEonHandoffStore({ sessionStorage }).activeCount, EON_HANDOFF_MAX_ACTIVE);
  assert.equal(readEonHandoff('handoff_capacity_0', { sessionStorage }).ok, true);
});
