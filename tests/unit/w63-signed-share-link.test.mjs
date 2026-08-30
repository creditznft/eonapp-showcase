import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBrowserModule, installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
installStoragePolyfill();
const files = [
  'assets/js/utils/share-link-codec.js',
  'assets/js/utils/share-link-identity.js',
  'assets/js/utils/signed-share-link.js'
];
const signed = await importBrowserModule(root, 'assets/js/utils/signed-share-link.js', files);
const codec = await importBrowserModule(root, 'assets/js/utils/share-link-codec.js', ['assets/js/utils/share-link-codec.js']);

test('default signed share token verifies as compact self-contained eon2 without a central alias', async () => {
  const share = await signed.createSignedShareLink({ rootReferralId: 'alice', issuerId: 'alice', destination: '/eoncity', source: 'x', issuedAt: Date.now() - 1000 });
  assert.match(share.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.match(share.missionCode, /^EON-[0-9A-HJKMNP-TV-Z]{8}$/);
  const verified = await signed.verifySignedShareToken(share.token);
  assert.equal(verified.ok, true);
  assert.match(verified.payload.rootReferralId, /^eonr_[A-Za-z0-9_-]{22}$/);
  assert.equal(verified.payload.rootReferralId, share.payload.rootReferralId);
  assert.equal(verified.missionCode, share.missionCode);
  assert.equal(await codec.deriveMissionCode(share.token), share.missionCode);
  assert.equal(share.shortRegistration.disabled, true);
});

test('tamper, expiry and unsafe destinations fail', async () => {
  const share = await signed.createSignedShareLink({ rootReferralId: 'alice', destination: '/vault.html' });
  const parts = share.token.split('.');
  const payload = codec.decodeJsonBase64Url(parts[1]);
  payload.destination = '/marketplace.html';
  const tampered = `${parts[0]}.${codec.encodeJsonBase64Url(payload)}.${parts[2]}`;
  assert.equal((await signed.verifySignedShareToken(tampered)).reason, 'bad-signature');
  const expired = await signed.createSignedShareLink({ rootReferralId: 'alice', destination: '/', issuedAt: 1000, expiresAt: 2000 });
  assert.equal((await signed.verifySignedShareToken(expired.token)).reason, 'expired');
  assert.throws(() => signed.normalizeDestination('javascript:alert(1)'));
  assert.throws(() => signed.normalizeDestination('https://evil.example/'));
});

test('derived compact reshare creates a fresh self-contained public link while parent attribution remains local', async () => {
  const rootShare = await signed.createSignedShareLink({ rootReferralId: 'alice', destination: '/eoncity' });
  const child = await signed.createDerivedShareLink(rootShare.token, { issuerId: 'bob', source: 'telegram' });
  const verified = await signed.verifySignedShareToken(child.token);
  assert.match(child.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.equal(verified.ok, true);
  assert.notEqual(child.payload.shareId, rootShare.payload.shareId);
  assert.equal(child.payload.parentShareId, '');
  assert.match(child.payload.rootReferralId, /^eonr_[A-Za-z0-9_-]{22}$/);
  assert.equal(child.shortRegistration.disabled, true);
});

test('legacy compatibility envelope remains explicit and preserves legacy public lineage only when requested', async () => {
  const share = await signed.createSignedShareLink({ rootReferralId: 'alice', destination: '/realm.html', forceLegacy: true });
  assert.match(share.link, /^https:\/\/eonapp\.ch\/r\/#eon1\./);
  const verified = await signed.verifySignedShareToken(share.token);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.rootReferralId, 'alice');
});

test('100,000 random ids have no collision', () => {
  const ids = new Set();
  for (let i = 0; i < 100000; i += 1) ids.add(codec.randomId(16));
  assert.equal(ids.size, 100000);
});

test('deprecated short-code helper never creates a central alias; canonical token remains self-contained', async () => {
  const share = await signed.createSignedShareLink({ destination: '/eoncity' });
  assert.equal(share.shortRoute, 'referral');
  assert.match(signed.createShortShareCode(), /^[A-Za-z0-9_-]{22}$/);
  assert.equal(share.shortRegistration.ok, false);
  assert.equal(share.link, share.canonicalLink);
  assert.match(share.longLink, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
});


test('durable compact links use zero expiry and optional explicit expiry still works', async () => {
  const durable = await signed.createSignedShareLink({ destination: '/market', source: 'social' });
  assert.equal(durable.payload.expiresAt, 0);
  assert.equal((await signed.verifySignedShareToken(durable.token)).ok, true);
  const shortLived = await signed.createSignedShareLink({ destination: '/market', source: 'social', issuedAt: 1000, expiresAt: 2000 });
  assert.equal((await signed.verifySignedShareToken(shortLived.token, { now: 3000 })).reason, 'expired');
});

test('compact eon3 Realm links verify stable realm identity and fresh share ids', async () => {
  const realmId = signed.createRealmPublicId(new Uint8Array(16).fill(3));
  const a = await signed.createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'studio-3', realmLabel: 'Studio Three' });
  const b = await signed.createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'studio-3', realmLabel: 'Studio Three' });
  const verified = await signed.verifySignedShareToken(a.token);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.realm.id, realmId);
  assert.notEqual(a.payload.shareId, b.payload.shareId);
});
