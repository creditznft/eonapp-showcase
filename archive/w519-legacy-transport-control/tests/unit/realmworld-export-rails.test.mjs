import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOfficialEonCitySnapshot } from '../../assets/js/utils/eon-city-realm.js';
import { buildRealmWorldSnapshot } from '../../assets/js/utils/realmworld-generator.js';
import {
  buildRealmWorldExportChecklist,
  buildRealmWorldStorageBundle,
  validateRealmWorldSnapshotForPublicExport
} from '../../assets/js/utils/realmworld-arweave.js';
import {
  buildRealmWorldLandMetadata,
  buildRealmWorldLandParcelPreview,
  mapRealmObjectToLandTrait
} from '../../assets/js/utils/realmworld-land-contracts.js';

test('RealmWorld storage bundle validates safe snapshots without upload side effects', () => {
  const snapshot = buildRealmWorldSnapshot({ username: 'Export Realm' }, { presenceMode: 'public-listed', now: '2026-06-02T00:00:00.000Z' });
  const validation = validateRealmWorldSnapshotForPublicExport(snapshot);
  assert.equal(validation.ok, true);
  const bundle = buildRealmWorldStorageBundle(snapshot, { now: '2026-06-02T12:00:00.000Z' });
  assert.equal(bundle.schema, 'eon.realmworld.storage-bundle.v1');
  assert.equal(bundle.uploadPerformedHere, false);
  assert.equal(bundle.requiresCloudflareWorker, false);
  assert.equal(bundle.requiresCentralGameServer, false);
  assert.ok(bundle.files.some((file) => file.role === 'realm-snapshot'));
});

test('RealmWorld export checklist warns that EON City is bundled, not Arweave-required', () => {
  const city = buildOfficialEonCitySnapshot({ now: '2026-06-02T00:00:00.000Z' });
  const checklist = buildRealmWorldExportChecklist(city);
  assert.equal(checklist.okToExport, true);
  assert.match(checklist.note, /bundled/);
  assert.ok(checklist.steps.length >= 5);
});

test('RealmWorld land metadata maps realm objects into safe NFT traits', () => {
  const city = buildOfficialEonCitySnapshot({ now: '2026-06-02T00:00:00.000Z' });
  const trait = mapRealmObjectToLandTrait(city.monuments[0]);
  assert.ok(trait.trait_type);
  assert.ok(trait.value);
  const metadata = buildRealmWorldLandMetadata(city, { tokenId: 'city-001' });
  assert.equal(metadata.schema, 'eon.realmworld.land-metadata.v1');
  assert.equal(metadata.tokenId, 'city-001');
  assert.equal(metadata.bundledOfficialRealm, true);
  assert.equal(metadata.requiresCloudflareWorker, false);
  assert.equal(metadata.requiresCentralGameServer, false);
  assert.ok(metadata.attributes.some((attr) => attr.trait_type === 'Realm Type'));
  const preview = buildRealmWorldLandParcelPreview(city);
  assert.equal(preview.publicSafe, true);
  assert.equal(preview.serverless, true);
});
