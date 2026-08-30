import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('W212 referral links are compact, self-contained, and do not use a central resolver', async () => {
  const share = await signed.createSignedShareLink({ destination: '/eoncity', source: 'vault', issuedAt: Date.now() - 1000 });
  assert.match(share.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.equal(share.storageMode, 'self-contained-signed-no-registry');
  assert.equal(share.shortLink, '');
  assert.equal(share.shortRegistration.disabled, true);
  assert.ok(share.link.length < 380, `expected social/QR-safe compact link, got ${share.link.length}`);
  const verified = await signed.verifySignedShareToken(share.link);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.destination, '/eoncity');
  assert.match(verified.payload.rootReferralId, /^eonr_[A-Za-z0-9_-]{22}$/);
});

test('no KV short-link resolver remains in the W212 source tree', () => {
  assert.equal(fs.existsSync(path.join(root, 'functions/api/share-links/register.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'functions/api/share-links/resolve.js')), false);
  const signedSource = fs.readFileSync(path.join(root, 'assets/js/utils/signed-share-link.js'), 'utf8');
  const landingSource = fs.readFileSync(path.join(root, 'assets/js/referral-landing-page.js'), 'utf8');
  assert.doesNotMatch(signedSource, /share-links\/register|EON_SHARE_LINKS_KV|registerShortShareLink/);
  assert.doesNotMatch(landingSource, /api\/share-links\/resolve|captureReferralCloud/);
});
