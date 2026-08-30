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

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

test('W212 default referral links are compact eon2 envelopes with a negligible-collision 128-bit nonce', async () => {
  const one = await signed.createSignedShareLink({ destination: '/market', source: 'qr' });
  const two = await signed.createSignedShareLink({ destination: '/market', source: 'qr' });
  assert.match(one.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.match(two.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.notEqual(one.payload.shareId, two.payload.shareId);
  assert.match(one.payload.shareId, /^[A-Za-z0-9_-]{22}$/);
  assert.ok(one.link.length < 380, `compact social/QR link expected; got ${one.link.length}`);
  assert.equal(one.storageMode, 'self-contained-signed-no-registry');
  assert.equal(one.shortRegistration.disabled, true);
  const verified = await signed.verifySignedShareToken(one.link);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.destination, '/market');
  assert.equal(verified.payload.expiresAt, 0);
  assert.equal(verified.payload.permanent, true);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W212 has no Cloudflare short-link registry and no central write on link open', () => {
  assert.equal(fs.existsSync(path.join(root, 'functions/api/share-links/register.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'functions/api/share-links/resolve.js')), false);
  const landing = read('assets/js/referral-landing-page.js');
  const referralPar = read('assets/js/utils/referral-par.js');
  const redirects = read('public/_redirects');
  assert.doesNotMatch(landing, /api\/share-links\/resolve|captureReferralCloud|EON_SHARE_LINKS_KV/);
  assert.doesNotMatch(referralPar, /_queueReferralTreeConfirmation|referral tree confirmation|central write/i);
  assert.match(referralPar, /local-invite-context-only/);
  assert.match(referralPar, /no_active_server_referral_tree/);
  assert.match(redirects, /no short-link registry, KV,\s*# D1 resolver, or Worker is required/i);
});

test('W212 current signed-share surfaces do not promise reward or claim access for sharing', () => {
  const landing = read('assets/js/referral-landing-page.js');
  const studio = read('assets/js/realm-studio-page.js');
  const vault = read('assets/js/vault/eon-vault-page.js');
  assert.doesNotMatch(`${landing}\n${studio}\n${vault}`, /Signed Share &amp; Earn|capped rewards|Build, share, earn Pool Points|Open Claim Page|AI share campaign|Invite \+ claim loop|earn Pool Points/);
  assert.match(landing, /does not create a reward, click record, central database record, or referral conversion/);
  assert.match(studio, /No central link registry, reward, payout, or public store was used/);
  assert.match(studio, /signed identity link/);
  assert.doesNotMatch(vault, /Share your Realm safely/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W212 Preview Studio has explicit private generation and server-truth commercial safeguards with no checkout or exchange claim', () => {
  const market = read('assets/js/market/eon-market-page.js');
  const privateDrop = read('assets/js/market/market-private-drop.js');
  const commerce = read('assets/js/commerce/official-commerce-foundation.js');
  assert.match(market, /data-market-scope="private-preview-official-disabled"/);
  assert.match(market, />Private generate<\/button>/);
  assert.match(market, />Future safeguards<\/button>/);
  assert.match(market, /Create 4 original local previews/);
  assert.match(market, /No official catalog is active/);
  assert.match(market, /getOfficialCommercePublicSummary/);
  assert.match(market, /User seller marketplace: disabled/i);
  assert.match(market, /server-authoritative catalog/i);
  assert.match(commerce, /clientCallbackIsNotProof: true/);
  assert.match(commerce, /userSellerMarketplaceActive: false/);
  assert.match(commerce, /payoutActive: false/);
  assert.match(commerce, /tokenSettlementActive: false/);
  assert.match(market, /Generated on this device · not minted · not a purchase · no financial value/);
  assert.match(privateDrop, /userTriggered: true/);
  assert.match(privateDrop, /localOnly: true/);
  assert.doesNotMatch(market, /ensureMarketStarterDrop|Nothing is for sale yet|purchase path appears only after verified checkout|Buy now|Checkout now/);
});


test('W212.1 Realm links use the same stateless contract with a stable realm id and fresh 128-bit share id', async () => {
  const realmId = signed.createRealmPublicId(new Uint8Array(16).fill(7));
  const one = await signed.createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'maya-studio', realmLabel: 'Maya Studio', source: 'realm' });
  const two = await signed.createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'maya-studio', realmLabel: 'Maya Studio', source: 'realm' });
  assert.match(one.link, /^https:\/\/eonapp\.ch\/r\/#eon3\./);
  assert.match(two.link, /^https:\/\/eonapp\.ch\/r\/#eon3\./);
  assert.notEqual(one.payload.shareId, two.payload.shareId);
  assert.equal(one.payload.realm.id, realmId);
  assert.equal(one.payload.realm.handle, 'maya-studio');
  assert.equal(one.payload.expiresAt, 0);
  const verified = await signed.verifySignedShareToken(one.link);
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.linkKind, 'realm');
  assert.equal(verified.payload.realm.id, realmId);
  assert.equal(verified.payload.destination, '/u/maya-studio');
});

test('W212.1 current Realm Studio uses signed portable links and does not publish raw local Realm snapshots', () => {
  const studio = read('assets/js/realm-studio-page.js');
  const runtime = read('assets/js/utils/realm-share-runtime.js');
  const vault = read('assets/js/vault/eon-vault-page.js');
  assert.match(studio, /createRealmShareLink/);
  assert.match(studio, /function issueShare|realm-studio-issue/);
  assert.match(runtime, /createSignedShareLink/);
  assert.match(runtime, /destination: `\/u\/\$\{handle\}`/);
  assert.doesNotMatch(`${studio}\n${runtime}\n${vault}`, /realmworld\.html\?realm=/);
  assert.match(studio, /No central link registry, reward, payout, or public store was used/);
  assert.doesNotMatch(`${studio}\n${runtime}\n${vault}`, /(?:Buy now|Checkout now|Connect wallet|Mint now|List for sale|Open crate)/i);
});

test('W212.1 assigns a stable public Realm id per Realm handle rather than one shared global id', async () => {
  const runtime = await importBrowserModule(root, 'assets/js/utils/realm-share-runtime.js', [
    'assets/js/utils/share-link-codec.js', 'assets/js/utils/share-link-identity.js', 'assets/js/utils/signed-share-link.js', 'assets/js/utils/realm-share-runtime.js'
  ]);
  const mayaA = runtime.getOrCreateRealmPublicId({ username: 'maya' });
  const mayaB = runtime.getOrCreateRealmPublicId({ username: 'maya' });
  const atlas = runtime.getOrCreateRealmPublicId({ username: 'atlas' });
  assert.equal(mayaA, mayaB);
  assert.notEqual(mayaA, atlas);
  assert.match(mayaA, /^eonrealm_[A-Za-z0-9_-]{22}$/);
});


test('W212.2 current referral and Realm share surfaces use the signed contract without raw query-link fallback', () => {
  const signedSurfaces = [
    'assets/js/chat-page.js',
    'assets/js/chat/chatbot.js',
    'assets/js/realm-studio-page.js',
    'assets/js/referral-landing-page.js',
    'assets/js/utils/referral-par.js',
    'assets/js/realm/realm-state.js',
    'assets/js/vault/eon-vault-page.js'
  ];
  for (const file of signedSurfaces) {
    const source = read(file);
    assert.doesNotMatch(source, /[?&](?:ref|vref|referral)=/i, `${file} must not publish raw referral query links`);
  }
  const studio = read('assets/js/realm-studio-page.js');
  const referral = read('assets/js/utils/referral-par.js');
  const fallback = read('assets/js/utils/gateway-fallback.js');
  const profile = read('assets/js/utils/profile.js');
  const orchestrator = read('assets/js/utils/campaign-orchestrator.js');
  const realmProfile = read('realm-profile.html');
  const realmProfilePage = read('assets/js/realm-profile-page.js');
  const redirects = read('public/_redirects');
  assert.match(studio, /createRealmShareLink/);
  assert.match(studio, /No central link registry, reward, payout, or public store was used/);
  assert.match(referral, /REFERRAL_REWARDS_ENABLED = false/);
  assert.doesNotMatch(fallback, /referral\.pathname\s*=\s*`?\/r\//i);
  assert.doesNotMatch(fallback, /[?&](?:ref|vref|nonce)=/i);
  assert.match(fallback, /legacy-route-retired/);
  assert.match(profile, /raw-query referral retirement/);
  assert.match(profile, /legacyShareUrl: ''/);
  assert.doesNotMatch(orchestrator, /\$5\s*Referral Bonus|[?&]ref=/i);
  assert.match(redirects, /\/u\/\* \/realm-profile\.html\?user=:splat 200/);
  assert.match(realmProfile, /Portable verified Realm identity/);
  assert.match(realmProfilePage, /readIncomingRealmShare\(handle\)/);
  assert.match(realmProfilePage, /No Cloudflare D1, KV, Worker resolver/);
});
