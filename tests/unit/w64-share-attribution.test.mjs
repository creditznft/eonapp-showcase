import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBrowserModule, installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
installStoragePolyfill();
const files = [
  'assets/js/utils/share-link-codec.js','assets/js/utils/share-link-identity.js','assets/js/utils/signed-share-link.js',
  'assets/js/utils/share-attribution.js','assets/js/utils/share-lineage.js'
];
const signed = await importBrowserModule(root, 'assets/js/utils/signed-share-link.js', files);
const attribution = await importBrowserModule(root, 'assets/js/utils/share-attribution.js', files);
const lineage = await importBrowserModule(root, 'assets/js/utils/share-lineage.js', files);

test('legacy referral parameters migrate to eon.attribution.v2', () => {
  const env = attribution.legacyParamsToAttribution(new URLSearchParams('ref=alice&nonce=n1&exp=9999999999999&camp=launch&src=x'));
  assert.equal(env.schema, 'eon.attribution.v2');
  assert.equal(env.rootReferralId, 'alice');
  assert.equal(env.migratedFromLegacy, true);
});

test('exact share retains local attribution and a derived compact reshare does not embed public lineage', async () => {
  const rootShare = await signed.createSignedShareLink({ rootReferralId: 'alice', destination: '/eoncity' });
  const options = await lineage.buildReshareOptions(rootShare.link, { issuerId: 'bob', source: 'x' });
  assert.equal(options.exact.attributedShareId, rootShare.payload.shareId);
  assert.equal(options.exact.rootReferralId, rootShare.payload.rootReferralId);
  assert.equal(options.derived.parentShareId, rootShare.payload.shareId);
  assert.equal(options.derived.rootReferralId, rootShare.payload.rootReferralId);
  assert.equal(options.derived.payload.parentShareId, '');
  assert.match(options.derived.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
});


test('verified Realm attribution preserves link kind and portable Realm metadata', async () => {
  const realmId = signed.createRealmPublicId(new Uint8Array(16).fill(8));
  const share = await signed.createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'atlas', realmLabel: 'Atlas Realm' });
  const result = await attribution.signedTokenToAttribution(share.token);
  assert.equal(result.ok, true);
  assert.equal(result.envelope.linkKind, 'realm');
  assert.equal(result.envelope.realm.id, realmId);
  assert.equal(result.envelope.realm.handle, 'atlas');
});
