import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  EON_CITY_WORK_HANDOFF_SCHEMA,
  EON_CITY_WORK_RETURN_SCHEMA,
  consumeEonCityWorkHandoff,
  consumeEonCityWorkReturnReceipt,
  getEonCityWorkHandoffTruth,
  inspectEonCityWorkReturnStore,
  listEonCityWorkDestinations,
  prepareEonCityWorkHandoff,
  readEonCityWorkReturnReceipt,
  resolveEonCityWorkDestination,
  writeEonCityWorkHandoff,
  writeEonCityWorkReturnReceipt
} from '../../assets/js/contracts/city/eon-city-work-handoff.js';
import {
  createCityWorkLoopProposal,
  consumeCityWorkLoopReturnReceipt,
  writeCityWorkLoopHandoff,
  writeCityWorkLoopReturnReceipt
} from '../../assets/js/city/eon-city-work-loop.js';
import {
  createEonCityW751ProductiveStations,
  projectEonCityW751ProductiveStations,
  validateEonCityW751ProductiveStations
} from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    dump: () => Object.fromEntries(values)
  };
}

const NOW = Date.UTC(2026, 7, 5, 1, 45, 0);

test('C04 maps all ten Command Hub stations to maintained Core destinations', () => {
  const rows = listEonCityWorkDestinations();
  assert.equal(rows.length, 10);
  assert.equal(new Set(rows.map((row) => row.stationId)).size, 10);
  for (const row of rows) {
    const resolved = resolveEonCityWorkDestination(row);
    assert.equal(resolved.ok, true, row.stationId);
    assert.notEqual(resolved.receiverId, 'eoncity');
    assert.match(resolved.destination.route, /^\//);
  }
  assert.equal(resolveEonCityWorkDestination({ surface: 'automations' }).receiverId, 'automations');
  assert.equal(resolveEonCityWorkDestination({ surface: 'creator-capture' }).receiverId, 'create');
  assert.equal(resolveEonCityWorkDestination({ receiverId: 'eoncity' }).reason, 'maintained-core-destination-required');
});

test('C04 prepares only explicit, redacted, expiring City work handoffs', async () => {
  const implicit = await prepareEonCityWorkHandoff({ stationId: 'create-forge' }, { cryptoApi: webcrypto, now: NOW });
  assert.equal(implicit.reason, 'explicit-user-action-required');
  const sensitive = await prepareEonCityWorkHandoff({ stationId: 'create-forge', prompt: 'private' }, { explicitUserAction: true, cryptoApi: webcrypto, now: NOW });
  assert.equal(sensitive.reason, 'city-work-context-sensitive-field');
  assert.equal(JSON.stringify(sensitive).includes('private'), false);
  const prepared = await prepareEonCityWorkHandoff({
    stationId: 'create-forge',
    actionId: 'prepare-website',
    citySessionId: 'city-session-001',
    missionId: 'creator',
    objectiveId: 'creator-brief',
    returnContextId: 'station:create-forge',
    safeLabel: 'Open Create'
  }, { explicitUserAction: true, cryptoApi: webcrypto, now: NOW });
  assert.equal(prepared.ok, true, prepared.reason);
  assert.equal(prepared.handoff.kind, 'city-work');
  assert.equal(prepared.handoff.payload.schema, EON_CITY_WORK_HANDOFF_SCHEMA);
  assert.equal(prepared.handoff.sender.id, 'eoncity');
  assert.equal(prepared.handoff.receiver.id, 'create');
  assert.equal(prepared.handoff.payload.containsPrivateContent, false);
  assert.equal(prepared.handoff.payload.grantsXp, false);
  assert.equal(prepared.verifiedOutcome, false);
  assert.match(prepared.handoff.payloadDigest, /^[a-f0-9]{64}$/);
  assert.match(prepared.href, /^\/create\?handoff=/);
});

test('C04 handoff is receiver-bound, tamper checked, expiring and single-consume', async () => {
  const sessionStorage = storage();
  const written = await writeEonCityWorkHandoff({ stationId: 'project-atlas', missionId: 'project', returnContextId: 'mission:project' }, { explicitUserAction: true, sessionStorage, cryptoApi: webcrypto, now: NOW });
  assert.equal(written.ok, true);
  assert.equal((await consumeEonCityWorkHandoff(written.handoff.handoffId, { receiverId: 'library', sessionStorage, cryptoApi: webcrypto, now: NOW + 1 })).reason, 'handoff-receiver-mismatch');
  const consumed = await consumeEonCityWorkHandoff(written.handoff.handoffId, { receiverId: 'projects', sessionStorage, cryptoApi: webcrypto, now: NOW + 2 });
  assert.equal(consumed.ok, true, consumed.reason);
  assert.equal(consumed.receipt.status, 'accepted');
  assert.equal(consumed.receipt.outcomeVerified, false);
  assert.equal((await consumeEonCityWorkHandoff(written.handoff.handoffId, { receiverId: 'projects', sessionStorage, cryptoApi: webcrypto, now: NOW + 3 })).reason, 'handoff-already-consumed');

  const expired = await writeEonCityWorkHandoff({ stationId: 'local-ai-lab', ttlMs: 60_000 }, { explicitUserAction: true, sessionStorage, cryptoApi: webcrypto, now: NOW });
  assert.equal(expired.ok, true);
  assert.equal((await consumeEonCityWorkHandoff(expired.handoff.handoffId, { receiverId: 'local-ai', sessionStorage, cryptoApi: webcrypto, now: NOW + 60_001 })).reason, 'handoff-expired');
});

test('C04 writes and consumes one bounded Core return receipt without awarding progress', async () => {
  const sessionStorage = storage();
  const handoff = await writeEonCityWorkHandoff({ stationId: 'automation-theatre', missionId: 'automation', objectiveId: 'review-plan', returnContextId: 'station:automation-theatre' }, { explicitUserAction: true, sessionStorage, cryptoApi: webcrypto, now: NOW });
  assert.equal((await consumeEonCityWorkHandoff(handoff.handoff.handoffId, { receiverId: 'automations', sessionStorage, cryptoApi: webcrypto, now: NOW + 1 })).ok, true);
  const returned = writeEonCityWorkReturnReceipt({ handoffId: handoff.handoff.handoffId, receiverId: 'automations', result: 'completed', resultCode: 'automation-reviewed' }, { explicitUserAction: true, sessionStorage, now: NOW + 2 });
  assert.equal(returned.ok, true, returned.reason);
  assert.equal(returned.receipt.schema, EON_CITY_WORK_RETURN_SCHEMA);
  assert.equal(returned.receipt.grantsXp, false);
  assert.equal(returned.receipt.verifiedOutcome, false);
  assert.equal(returned.receipt.containsPrivateContent, false);
  assert.match(returned.href, /^\/eoncity\?handoff=.*&returnReceipt=/);
  assert.equal(readEonCityWorkReturnReceipt(returned.receipt.receiptId, { sessionStorage }).ok, true);
  assert.equal(writeEonCityWorkReturnReceipt({ handoffId: handoff.handoff.handoffId }, { explicitUserAction: true, sessionStorage, now: NOW + 3 }).reason, 'return-receipt-already-exists');
  const consumed = consumeEonCityWorkReturnReceipt(returned.receipt.receiptId, { sessionStorage, now: NOW + 4 });
  assert.equal(consumed.ok, true);
  assert.equal(consumed.grantsXp, false);
  assert.equal(consumeEonCityWorkReturnReceipt(returned.receipt.receiptId, { sessionStorage, now: NOW + 5 }).reason, 'return-receipt-already-consumed');
  assert.deepEqual(inspectEonCityWorkReturnStore({ sessionStorage }), {
    schema: 'eon.city-work-return-store.a15.v1', receiptCount: 1, pendingCityCount: 0, consumedCityCount: 1, verifiedOutcomeCount: 0
  });
});

test('C04 upgrades the legacy City work loop to canonical handoff and return receipts', async () => {
  const sessionStorage = storage();
  const cityStorage = storage();
  const proposal = await createCityWorkLoopProposal({ intentId: 'build-brief', typedRequest: 'do not persist this', now: NOW }, { cryptoApi: webcrypto, sessionStorage, cityStorage });
  assert.equal(proposal.ok, true);
  const handoff = await writeCityWorkLoopHandoff(proposal.proposal, { explicitUserAction: true, sessionStorage, cryptoApi: webcrypto, now: NOW + 1 });
  assert.equal(handoff.ok, true, handoff.reason);
  assert.equal(JSON.stringify(handoff).includes('do not persist this'), false);
  assert.equal((await consumeEonCityWorkHandoff(handoff.handoff.handoffId, { receiverId: 'projects', sessionStorage, cryptoApi: webcrypto, now: NOW + 2 })).ok, true);
  const returned = writeCityWorkLoopReturnReceipt(proposal.proposal, handoff.handoff.handoffId, { result: 'completed' }, { explicitUserAction: true, sessionStorage, now: NOW + 3 });
  assert.equal(returned.ok, true);
  assert.equal(consumeCityWorkLoopReturnReceipt(returned.receipt.receiptId, { sessionStorage, now: NOW + 4 }).ok, true);
});

test('C04 productive station controller prepares a canonical handoff for every station', async () => {
  const sessionStorage = storage();
  const localStorage = storage();
  const view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { schema: 'eon.city.productive-stations.activity.w751.v1', stations: {} }, shareReceipt: null });
  assert.equal(validateEonCityW751ProductiveStations(view).ok, true);
  assert.equal(view.stations.every((station) => station.handoffRequired && station.receiverId), true);
  const controller = createEonCityW751ProductiveStations({ storage: localStorage, environment: {}, now: () => NOW, getProductivePlan: () => ({ missions: [] }), getMissionView: () => [] });
  for (const station of view.stations) {
    const result = await controller.prepareHandoff(station.stationId, { citySessionId: `session:${station.stationId}`, sourceMode: 'command-hub' }, { explicitUserAction: true, sessionStorage, cryptoApi: webcrypto, now: NOW });
    assert.equal(result.ok, true, `${station.stationId}:${result.reason}`);
    assert.equal(result.handoff.payload.stationId, station.stationId);
    assert.equal(result.handoff.receiver.id, station.receiverId);
  }
  controller.dispose();
});

test('C04 launch truth never equates navigation or return with verified work', () => {
  assert.deepEqual(getEonCityWorkHandoffTruth(), {
    schema: EON_CITY_WORK_HANDOFF_SCHEMA,
    maintainedCoreDestinationRequired: true,
    explicitUserActionRequired: true,
    singleConsumeHandoff: true,
    singleConsumeReturnReceipt: true,
    privateContentAllowed: false,
    openingRouteGrantsXp: false,
    returningToCityGrantsXp: false,
    verifiedOutcomeAuthority: false,
    automaticNavigation: false,
    automaticExecution: false
  });
});
