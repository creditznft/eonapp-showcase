import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_REALM_RELIC_PASSPORT_EVENTS,
  awardLocalRealmShareRelic,
  clearLocalRealmShareRelics,
  getLocalRealmShareRelicPassportTruth,
  listLocalRealmShareRelics
} from '../../assets/js/realm-relic/eon-realm-relic-passport.js';
import { getCapabilityTruth } from '../../assets/js/capabilities/capability-truth-registry.js';
import { runW347RealmShareRelicPassportGate } from '../../scripts/w347-realm-share-relic-passport-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); }
  };
}

const realm = Object.freeze({ id: 'eonrealm_testpassport', handle: 'quiet-realm', label: 'Quiet Realm', theme: 'aurora' });

test('W347 creates one local cosmetic Signal Relic only after an explicit share event', () => {
  const storage = fakeStorage();
  const first = awardLocalRealmShareRelic({ eventType: EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE, realm, storage, cryptoApi: webcrypto, now: 1_770_000_000_000 });
  assert.equal(first.ok, true);
  assert.equal(first.created, true);
  assert.equal(first.relic.label, 'Signal Relic');
  assert.equal(first.relic.localOnly, true);
  assert.equal(first.relic.transferAllowed, false);
  assert.equal(first.relic.saleAllowed, false);
  assert.equal(first.relic.financialValueAssigned, false);
  assert.equal(first.relic.paidFeatureEntitlementCreated, false);
  assert.equal(first.relic.subscriptionEntitlementCreated, false);

  const repeated = awardLocalRealmShareRelic({ eventType: EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE, realm, storage, cryptoApi: webcrypto });
  assert.equal(repeated.ok, true);
  assert.equal(repeated.created, false);
  assert.equal(listLocalRealmShareRelics({ storage }).length, 1);
});

test('W347 creates one Welcome Relic only for a locally verified incoming Realm event', () => {
  const storage = fakeStorage();
  const welcome = awardLocalRealmShareRelic({ eventType: EON_REALM_RELIC_PASSPORT_EVENTS.INCOMING_VERIFIED_REALM_LINK, realm, storage, cryptoApi: webcrypto, now: 1_770_001_000_000 });
  assert.equal(welcome.ok, true);
  assert.equal(welcome.created, true);
  assert.equal(welcome.relic.label, 'Welcome Relic');
  assert.match(welcome.relic.verificationLabel, /signature only|does not create a referral/i);
  assert.equal(welcome.relic.note.includes('NFT'), true);
});

test('W347 Relic Passport can be cleared only through explicit device confirmation', () => {
  const storage = fakeStorage();
  awardLocalRealmShareRelic({ eventType: EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE, realm, storage, cryptoApi: webcrypto });
  assert.equal(clearLocalRealmShareRelics({ storage }).ok, false);
  assert.equal(listLocalRealmShareRelics({ storage }).length, 1);
  const cleared = clearLocalRealmShareRelics({ confirmedByUser: true, storage });
  assert.equal(cleared.ok, true);
  assert.equal(cleared.removed, 1);
  assert.equal(listLocalRealmShareRelics({ storage }).length, 0);
});

test('W347 product truth and source gate remain local, non-commercial, and no-network', () => {
  const truth = getLocalRealmShareRelicPassportTruth();
  assert.equal(truth.network, false);
  assert.equal(truth.cloudSync, false);
  assert.equal(truth.referralConversionTracking, false);
  assert.equal(truth.subscriptionEntitlement, false);
  assert.equal(truth.cashOrCryptoValue, false);
  assert.equal(getCapabilityTruth('realm-share-relic-passport')?.lifecycle, 'active-local');
  const result = runW347RealmShareRelicPassportGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});
