import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CAPABILITY_SERVICE_SCHEMA,
  setCurrentCapabilitySnapshot
} from '../../assets/js/capabilities/eon-capability-service.js';
import {
  EON_CITY_ACCESS_PROJECTION_SCHEMA,
  EON_CITY_DISTRIBUTION_PROJECTION_SCHEMA,
  projectEonCityAccess,
  projectEonCityDistribution,
  validateEonCityAccessProjection,
  validateEonCityDistributionProjection
} from '../../assets/js/contracts/city/eon-city-access-distribution-projection.js';
import { fetchEonCityW659gMembershipStatus } from '../../assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js';
import { getEonCityW659gCaptureCapability } from '../../assets/js/contracts/city/w659g/eon-city-w659g-creator-capture.js';

const NOW = Date.now();
function snapshot(overrides = {}) {
  return Object.freeze({
    schema: EON_CAPABILITY_SERVICE_SCHEMA,
    tierId: 'studio', tierLabel: 'Studio', entitlementStatus: 'active', serverAuthoritative: true, browserClaimAccepted: false,
    expiresAt: NOW + 60_000,
    limits: { projectSlots: 35, automationDrafts: 12, creatorPresetPacks: 3, showcaseSlots: 2 },
    featureGroups: ['max-city-skins', 'creator-preset-packs', 'unrelated-core-feature'],
    unlocks: [
      { unlockId: 'power-creator-presets', featureGroup: 'creator-preset-packs', category: 'creator-preset', sourceRecordId: 'private-ledger-row' },
      { unlockId: 'not-city', featureGroup: 'private-workflow', category: 'workflow', sourceRecordId: 'private' }
    ],
    accountId: 'private-account-id', ...overrides
  });
}

test('C07 projects only bounded City capability truth', () => {
  const value = projectEonCityAccess(snapshot(), { now: NOW });
  assert.equal(value.schema, EON_CITY_ACCESS_PROJECTION_SCHEMA);
  assert.equal(value.tierId, 'studio');
  assert.equal(value.effectiveLimits.projectSlots, 35);
  assert.deepEqual(value.cityFeatureGroups, ['creator-preset-packs', 'max-city-skins']);
  assert.equal(value.activeCityUnlocks.length, 1);
  assert.equal('accountId' in value, false);
  assert.equal('sourceRecordId' in value.activeCityUnlocks[0], false);
  assert.equal(value.baseCityAvailable, true);
  assert.equal(value.signalFrontierAvailable, true);
  assert.equal(value.eonKeysGrantWholeTier, false);
  assert.equal(validateEonCityAccessProjection(value).ok, true);
});

test('C07 expired or browser-forged snapshots fail closed to Free', () => {
  const expired = projectEonCityAccess(snapshot({ expiresAt: NOW - 1 }), { now: NOW });
  assert.equal(expired.tierId, 'free');
  assert.equal(expired.serverAuthoritative, false);
  const forged = projectEonCityAccess({ ...snapshot(), schema: 'forged' }, { now: NOW });
  assert.equal(forged.tierId, 'free');
  assert.equal(forged.baseCityAvailable, true);
});

test('C07 distribution never auto-starts, uploads, publishes or rewards', () => {
  const value = projectEonCityDistribution({ snapshot: snapshot(), captureCapability: { ready: true }, shareReceipt: { verified: true, kind: 'reviewed-signed-handoff' }, now: NOW });
  assert.equal(value.schema, EON_CITY_DISTRIBUTION_PROJECTION_SCHEMA);
  assert.equal(value.captureReadyOnDevice, true);
  assert.equal(value.reviewedShareReceiptPresent, true);
  assert.equal(value.captureStartsAutomatically, false);
  assert.equal(value.captureUploadsToEonapp, false);
  assert.equal(value.captureRequiresPaidTier, false);
  assert.equal(value.automaticPublishing, false);
  assert.equal(value.referralRewardIssued, false);
  assert.equal(value.eonKeyIssuedByShare, false);
  assert.equal(validateEonCityDistributionProjection(value).ok, true);
});

test('C07 membership status joins billing and same-origin capability truth', async () => {
  setCurrentCapabilitySnapshot(snapshot(), { emit: false });
  const fetch = async (url) => {
    if (url === '/api/billing/status') return { ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: true }, checkoutActive: true, plans: [] }) };
    if (url === '/api/capabilities/status') return { ok: true, status: 200, json: async () => ({ schema: 'eonapp.capability-envelope.a15.v1', algorithm: 'HMAC-SHA-256', signature: 'present', snapshot: snapshot() }) };
    throw new Error(`unexpected ${url}`);
  };
  const result = await fetchEonCityW659gMembershipStatus({ fetch, dispatchEvent() {}, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
  assert.equal(result.ok, true);
  assert.equal(result.capabilityVerified, true);
  assert.equal(result.cityAccess.tierId, 'studio');
  assert.equal(result.cityAccess.accountIdStored, false);
});

test('C07 Creator Capture remains local and independent of paid access', () => {
  const capability = getEonCityW659gCaptureCapability({ environment: {} });
  assert.equal(capability.cityDistribution.captureRequiresPaidTier, false);
  assert.equal(capability.cityDistribution.captureStartsAutomatically, false);
  assert.equal(capability.cityDistribution.captureUploadsToEonapp, false);
});
