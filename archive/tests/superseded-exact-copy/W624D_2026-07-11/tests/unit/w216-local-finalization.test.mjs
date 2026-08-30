import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRealmPublicId, createSignedShareLink, verifySignedShareToken } from '../../assets/js/utils/signed-share-link.js';
import { RETIRED_REDIRECTS, renderCloudflareRedirects } from '../../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W216/W392 keep direct EON City entry, City Map fallback, and command-space preview isolated', () => {
  const cityEntry = read('eoncity.html');
  const city2d = read('eoncity-lite.html');
  const city3d = read('eoncity-3d.html');
  const station = read('assets/js/eon-city-3d-station.js');
  assert.match(cityEntry, /data-eon-city-direct-entry/);
  assert.match(cityEntry, /Checking City access/);
  assert.match(cityEntry, /eon-city-access-station\.js/);
  assert.match(cityEntry, /data-eon-app-shell="1"/);
  assert.match(cityEntry, /eon-app-shell\.js/);
  assert.doesNotMatch(cityEntry, /<script[^>]+eon-city-play-station\.js|eon-operator-map\.js|eon-city-portal\.js/);
  assert.match(city2d, /eon-operator-map\.js/);
  assert.doesNotMatch(city2d, /realm3d\/eon-city-app\.js|eon-city-3d-station\.js/);
  assert.match(city3d, /eon-city-3d-station\.css/);
  assert.match(city3d, /eon-city-3d-station\.js/);
  assert.match(city3d, /Spatial Command Space/i);
  assert.match(city3d, /City Overview remains available/i);
  assert.doesNotMatch(city3d, /realm3d\/eon-city-app\.js|realm3d-preflight/);
  assert.match(station, /getEonCity3dCapability/);
  assert.match(station, /probeWebgl/);
  assert.match(station, /automaticFallbackTo2d/);
});

test('general referrals stay eon2 and explicit Realm shares stay eon3 with fresh share ids', async () => {
  const invite = await createSignedShareLink({ issuerId: 'local-user', rootReferralId: 'local-user', destination: '/chat', source: 'generic' });
  const realmId = createRealmPublicId();
  const realmA = await createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'atlas-lab', realmLabel: 'Atlas Lab', source: 'realm' });
  const realmB = await createSignedShareLink({ linkKind: 'realm', realmId, realmHandle: 'atlas-lab', realmLabel: 'Atlas Lab', source: 'realm' });
  assert.match(invite.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  assert.match(realmA.link, /^https:\/\/eonapp\.ch\/r\/#eon3\./);
  const verifiedInvite = await verifySignedShareToken(invite.link);
  const verifiedA = await verifySignedShareToken(realmA.link);
  const verifiedB = await verifySignedShareToken(realmB.link);
  assert.equal(verifiedInvite.payload.linkKind, 'referral');
  assert.equal(verifiedA.payload.linkKind, 'realm');
  assert.equal(verifiedA.payload.realm.id, verifiedB.payload.realm.id);
  assert.notEqual(verifiedA.payload.shareId, verifiedB.payload.shareId);
});

test('Realm Studio is an explicit local generator with signed, QR and no-registry paths', () => {
  const html = read('realm-studio.html');
  const page = read('assets/js/realm-studio-page.js');
  const redirects = read('public/_redirects');
  assert.match(html, /id="realm-studio-issue"/);
  assert.match(html, /id="realm-studio-qr"/);
  assert.match(page, /createRealmShareLink/);
  assert.match(page, /renderQrCanvas/);
  assert.match(page, /No central link registry, reward, payout, or public store was used/);
  assert.equal(redirects, renderCloudflareRedirects());
  assert.doesNotMatch(page, /fetch\(|REFERRALS_DB|api\/share-links/);
});

test('the 2D city opens Realm Studio as a canonical low-device route', () => {
  const map = read('assets/js/eon-operator-map.js');
  const cityEngine = read('assets/js/city/eon-city-2d-engine.js');
  const registry = read('assets/js/city/city-landmark-registry.js');
  assert.match(map, /data-city-canvas/);
  assert.match(cityEngine, /CITY_LANDMARKS\.map\(toCityDistrict\)/);
  assert.match(registry, /name: 'Realm Relay'/);
  assert.match(registry, /route: '\/realm-studio'/);
  assert.match(registry, /private local City identity/i);
});

test('disabled campaign boundary is a current-status surface, not a legacy provider compatibility module', () => {
  const rewards = read('assets/js/access/rewards-status-page.js');
  const policy = read('config/sponsored-discovery-policy.mjs');
  assert.match(rewards, /No reward or offer campaign is active/);
  assert.match(rewards, /Access Milestones are not active/);
  assert.doesNotMatch(rewards, /fetch\s*\(|XMLHttpRequest|window\.open\(/);
  assert.match(policy, /SPONSORED_DISCOVERY_ACTIVE = false/);
});


test('W216 current public trust surfaces separate live Dodo subscriptions from disabled campaigns and wallet value', () => {
  const publicDocs = {
    about: read('about.html'),
    privacy: read('privacy.html'),
    billing: read('billing.html'),
    support: read('support.html'),
    rewards: read('rewards.html')
  };
  for (const [name, source] of Object.entries(publicDocs)) {
    assert.doesNotMatch(source, /monetag|mylead|cpagrip|watch rewarded|rewarded-only|postback pending|nowpayments email subscription|direct evm fallback/i, `${name} contains retired campaign copy`);
  }
  for (const name of ['about', 'privacy', 'billing', 'support']) assert.match(publicDocs[name], /data-monetization="subscription"/, `${name} declares the canonical subscription state`);
  assert.match(publicDocs.rewards, /data-monetization="disabled"/);
  assert.match(publicDocs.about, /subscriptions are available through Dodo Payments hosted checkout/i);
  assert.match(publicDocs.privacy, /eon2<\/code> referral and <code>eon3<\/code> Realm links/);
  assert.match(publicDocs.billing, /Every paid plan starts with the same seven-day trial/);
  assert.match(publicDocs.support, /subscriptions are available only through the hosted Dodo checkout/i);
  assert.match(publicDocs.rewards, /No reward campaign is active/);
  assert.match(publicDocs.about, /never grant a free subscription tier or payment credit/i);
  assert.match(publicDocs.billing, /never create a free subscription tier, first-month discount, renewal credit/i);
});


test('retired legacy Realm and commercial URLs cannot become competing share or campaign surfaces', () => {
  const redirects = read('public/_redirects');
  const required = [
    ['/realm.html', '/eoncity'],
    ['/realmworld.html', '/eoncity'],
    ['/team-realm.html', '/eoncity'],
    ['/marketplace.html', '/market'],
    ['/subscription.html', '/archive'],
    ['/trade/sandbox', '/insights']
  ];
  for (const [legacy, canonical] of required) {
    assert.equal(
      RETIRED_REDIRECTS.some((row) => row.from === legacy && row.to === canonical && row.status === 301),
      true,
      `${legacy} retires to ${canonical}`
    );
  }
  assert.equal(redirects, renderCloudflareRedirects());
  assert.match(redirects, /\/u\/\* \/realm-profile\.html\?user=:splat 200/);
  assert.match(redirects, /\/r\/\* \/referral\.html 200/);
});
