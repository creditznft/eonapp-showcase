import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MY_REALM_LEGACY_KEYS,
  MY_REALM_STATE_KEY,
  createMyRealmState,
  ensureMyRealmState,
  getMyRealmPublicIdentity,
  reviewRealmPublicMetadata,
  updateMyRealmShowcase
} from '../../assets/js/realm/realm-state.js';
import { CITY_WORLD_STATE_KEY, getCityWorldPublicSummary } from '../../assets/js/contracts/city/city-world-state.js';
import { createRealmShareLink } from '../../assets/js/utils/realm-share-runtime.js';
import { verifySignedShareToken } from '../../assets/js/utils/signed-share-link.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

function installStorage(storage) {
  const previous = globalThis.localStorage;
  globalThis.localStorage = storage;
  return () => {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  };
}

test('W222 creates a local My Realm and binds only safe identity/theme/entry data into CityWorldState', () => {
  const storage = memoryStorage({ 'eon:profile:v1': JSON.stringify({ displayName: 'Maya Studio', username: 'maya-studio' }) });
  const restore = installStorage(storage);
  try {
    const result = ensureMyRealmState({ storage, now: 100 });
    assert.equal(result.created, true);
    assert.match(result.state.id, /^eonrealm_[A-Za-z0-9_-]{22}$/);
    assert.equal(result.state.label, 'Maya Studio');
    assert.equal(result.state.handle, 'maya-studio');
    assert.equal(result.state.safety.publicPublishingActive, false);
    assert.equal(result.state.safety.officialMarketPlacementActive, false);
    assert.equal(result.state.safety.affiliateActive, false);
    assert.equal(result.state.safety.payoutActive, false);

    const city = JSON.parse(storage.getItem(CITY_WORLD_STATE_KEY));
    assert.equal(city.realmId, result.state.id);
    assert.equal(city.realmAppearance.palette, 'graphite');
    assert.equal(city.realmAppearance.landmark, 'realm');
    assert.doesNotMatch(JSON.stringify(city), /displayName|username|apiKey|wallet|private chat/i);
    assert.equal(getCityWorldPublicSummary(city).realmId, result.state.id);
  } finally {
    restore();
  }
});

test('W222 migrates an earlier Realm record non-destructively and does not copy secret-shaped fields forward', () => {
  const legacyKey = MY_REALM_LEGACY_KEYS[0];
  const legacyRaw = JSON.stringify({
    publicRealmId: 'eonrealm_AQEBAQEBAQEBAQEBAQEBAQ',
    displayName: 'Legacy Aurora',
    username: 'legacy-aurora',
    theme: 'aurora',
    entryDistrict: 'market',
    showcaseRefs: ['private-v3-legacy-one', 'private-v3-legacy-two', 'bad-ref'],
    apiKey: 'must-not-copy',
    vaultSecret: 'must-not-copy'
  });
  const storage = memoryStorage({ [legacyKey]: legacyRaw });
  const restore = installStorage(storage);
  try {
    const result = ensureMyRealmState({ storage, now: 200 });
    assert.equal(result.migrated, true);
    assert.equal(result.preservedLegacySource, true);
    assert.equal(storage.getItem(legacyKey), legacyRaw);
    const current = JSON.parse(storage.getItem(MY_REALM_STATE_KEY));
    assert.equal(current.label, 'Legacy Aurora');
    assert.equal(current.handle, 'legacy-aurora');
    assert.equal(current.theme, 'graphite');
    assert.equal(current.entryDistrict, 'market');
    assert.deepEqual(current.showcaseRefs, ['private-v3-legacy-one', 'private-v3-legacy-two']);
    assert.doesNotMatch(JSON.stringify(current), /apiKey|vaultSecret|must-not-copy/i);
  } finally {
    restore();
  }
});

test('W222 keeps private showcase references local, bounded, and separate from a signed public identity', async () => {
  const storage = memoryStorage();
  const restore = installStorage(storage);
  try {
    const initial = ensureMyRealmState({ storage, now: 300 });
    const selected = updateMyRealmShowcase([
      'private-v3-aaa1', 'private-v3-bbb2', 'private-v3-ccc3', 'private-v3-ddd4', 'private-v3-eee5', 'invalid'
    ], { storage, now: 301 });
    assert.deepEqual(selected.state.showcaseRefs, ['private-v3-aaa1', 'private-v3-bbb2', 'private-v3-ccc3', 'private-v3-ddd4']);

    const publicIdentity = getMyRealmPublicIdentity(selected.state);
    assert.equal(publicIdentity.shareEligible, true);
    assert.equal(publicIdentity.publicPublishingActive, false);
    assert.equal(publicIdentity.officialMarketPlacementActive, false);
    assert.equal(publicIdentity.affiliateActive, false);
    assert.equal(publicIdentity.payoutActive, false);
    assert.equal(Object.hasOwn(publicIdentity, 'showcaseRefs'), false);
    assert.equal(Object.hasOwn(publicIdentity, 'commission'), false);
    assert.equal(Object.hasOwn(publicIdentity, 'wallet'), false);

    const share = await createRealmShareLink({
      publicRealmId: publicIdentity.id,
      username: publicIdentity.handle,
      displayName: publicIdentity.label,
      theme: publicIdentity.theme
    }, { source: 'realm-studio', origin: 'https://eonapp.ch' });
    assert.match(share.link, /^https:\/\/eonapp\.ch\/r\/#eon3\./);
    const verified = await verifySignedShareToken(share.link);
    assert.equal(verified.ok, true);
    assert.equal(verified.payload.linkKind, 'realm');
    assert.equal(verified.payload.realm.id, initial.state.id);
    assert.equal(verified.payload.realm.handle, publicIdentity.handle);
    assert.equal(Object.hasOwn(verified.payload.realm, 'showcaseRefs'), false);
    assert.equal(Object.hasOwn(verified.payload.realm, 'commission'), false);
    assert.equal(Object.hasOwn(verified.payload.realm, 'payout'), false);
    assert.equal(Object.hasOwn(verified.payload.realm, 'wallet'), false);
  } finally {
    restore();
  }
});

test('W222 blocks unsafe or impersonating metadata from portable identity sharing while preserving it as local draft data', () => {
  const unsafe = createMyRealmState({ input: { label: 'EONAPP support — seed phrase test@example.com', handle: 'support' }, now: 400 });
  const review = reviewRealmPublicMetadata({ label: unsafe.label, handle: unsafe.handle });
  assert.equal(review.ok, false);
  assert.match(review.issues.join(' '), /credentials|wallet|contact|official EONAPP ownership|support/i);
  const publicIdentity = getMyRealmPublicIdentity(unsafe);
  assert.equal(publicIdentity.shareEligible, false);
  assert.equal(publicIdentity.label, '');
  assert.equal(publicIdentity.handle, '');
  assert.equal(publicIdentity.publicPublishingActive, false);
  assert.equal(publicIdentity.payoutActive, false);
});

test('W222 My Realm page is a local editor with safe metadata review and no storefront, seller, or earning claim', () => {
  const page = read('realm-studio.html');
  const script = read('assets/js/realm-studio-page.js');
  const state = read('assets/js/realm/realm-state.js');
  const css = read('assets/css/realm-studio.css');
  assert.match(page, /My Realm/);
  assert.match(page, /private City district/i);
  assert.match(page, /id="realm-studio-showcase"/);
  assert.match(page, /id="realm-studio-safety"/);
  assert.match(page, /id="realm-studio-issue"/);
  assert.match(script, /readPrivateMarketDrop/);
  assert.match(script, /updateMyRealmShowcase/);
  assert.match(script, /createRealmShareLink/);
  assert.match(script, /public marketplace or earnings surface was created/i);
  assert.match(state, /preservedLegacySource/);
  assert.match(state, /publicPublishingActive: false/);
  assert.match(state, /officialMarketPlacementActive: false/);
  assert.match(state, /affiliateActive: false/);
  assert.match(state, /payoutActive: false/);
  assert.match(css, /realm-studio-showcase-grid/);
  assert.doesNotMatch(`${page}\n${script}`, /open a store in seconds|passive income|earn \d+%|withdraw/i);
});
