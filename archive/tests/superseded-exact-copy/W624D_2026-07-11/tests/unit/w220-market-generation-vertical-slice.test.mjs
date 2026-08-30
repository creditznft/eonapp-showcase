import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function installMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
    key(index) { return Array.from(values.keys())[index] || null; },
    get length() { return values.size; }
  };
  return {
    values,
    restore() {
      if (previous === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = previous;
    }
  };
}

test('W220 Preview Studio imports and opens empty without generating or writing a local collection', async () => {
  const storage = installMemoryStorage();
  try {
    const market = await import(`../../assets/js/market/market-private-drop.js?w220-empty=${Date.now()}`);
    assert.equal(market.readPrivateMarketDrop(), null);
    assert.equal(market.readPrivateMarketResumeCandidate(), null);
    assert.equal(storage.values.has(market.EON_PRIVATE_DROP_KEY), false);
    assert.equal(storage.values.has(market.EON_PRIVATE_DROP_LEGACY_KEY), false);
  } finally {
    storage.restore();
  }
});

test('W220 generates exactly four user-triggered local previews and saves truthful local Vault records', async () => {
  const storage = installMemoryStorage();
  try {
    const market = await import(`../../assets/js/market/market-private-drop.js?w220-generate=${Date.now()}`);
    const drop = market.getPrivateMarketDrop({ regenerate: true, count: 4, theme: 'quiet-cosmos', prompt: 'calm city archive' });
    assert.equal(drop.items.length, 4);
    assert.equal(new Set(drop.items.map((item) => item.id)).size, 4);
    assert.equal(new Set(drop.items.map((item) => item.visualFingerprint)).size, 4);
    assert.equal(drop.theme.id, 'quiet-cosmos');
    assert.equal(drop.prompt, 'calm city archive');
    assert.equal(drop.policy.privateGenerated, true);
    assert.equal(drop.policy.userTriggered, true);
    assert.equal(drop.policy.localOnly, true);
    assert.equal(drop.policy.notFinancialProduct, true);
    assert.equal(drop.policy.purchaseProviderConfigured, false);
    assert.equal(drop.policy.publicListingAvailable, false);
    assert.equal(drop.items.every((item) => item.userFacingState === 'Generated Preview' && item.mintState === 'not-minted'), true);
    assert.equal(drop.items.every((item) => item.imageUri.startsWith('data:image/svg+xml')), true);

    const reread = market.readPrivateMarketDrop();
    assert.deepEqual(reread.items.map((item) => item.id), drop.items.map((item) => item.id));
    const saved = market.savePrivateMarketDropItemToVault(drop.items[0].id);
    assert.equal(saved.ok, true);
    assert.equal(saved.receipt.state, 'Saved Local Preview');
    assert.equal(saved.receipt.mintState, 'not-minted');
    assert.equal(saved.receipt.vaultRoute, '/vault');
  } finally {
    storage.restore();
  }
});

test('W220 migrates a legacy local collection only after explicit resume and preserves its source record', async () => {
  const storage = installMemoryStorage();
  try {
    const market = await import(`../../assets/js/market/market-private-drop.js?w220-migration=${Date.now()}`);
    const generated = market.getPrivateMarketDrop({ regenerate: true, count: 4, theme: 'forest-signal' });
    const legacyRaw = JSON.parse(storage.values.get(market.EON_PRIVATE_DROP_KEY));
    legacyRaw.schema = 'eon.market.private-drop.v2';
    legacyRaw.items.forEach((item) => { item.source = 'market-private-drop-v2'; });
    storage.values.set(market.EON_PRIVATE_DROP_LEGACY_KEY, JSON.stringify(legacyRaw));
    storage.values.delete(market.EON_PRIVATE_DROP_KEY);
    const originalLegacyText = storage.values.get(market.EON_PRIVATE_DROP_LEGACY_KEY);

    const candidate = market.readPrivateMarketResumeCandidate();
    assert.equal(candidate.kind, 'legacy');
    assert.equal(market.readPrivateMarketDrop(), null);
    const resumed = market.activatePrivateMarketResumeCandidate(candidate);
    assert.equal(resumed.ok, true);
    assert.equal(resumed.migrated, true);
    assert.equal(resumed.drop.schema, market.EON_PRIVATE_DROP_SCHEMA);
    assert.equal(resumed.drop.migration.explicitUserResume, true);
    assert.equal(resumed.drop.migration.preservedLegacySource, true);
    assert.equal(resumed.drop.items.length, generated.items.length);
    assert.equal(storage.values.get(market.EON_PRIVATE_DROP_LEGACY_KEY), originalLegacyText);
    assert.equal(market.readPrivateMarketDrop().items.length, generated.items.length);
    assert.equal(market.savePrivateMarketDropItemToVault(resumed.drop.items[0].id).ok, true);
  } finally {
    storage.restore();
  }
});

test('W220 Preview Studio UI declares empty start, explicit generation, progressive reveal, safe resume, and a non-marketplace boundary', () => {
  const marketHtml = read('market.html');
  const marketPage = read('assets/js/market/eon-market-page.js');
  const marketDrop = read('assets/js/market/market-private-drop.js');
  const css = read('assets/css/eon-market-v2.css');
  const guide = read('assets/js/chat/guide-mode-playbooks.js');

  assert.match(marketHtml, /Opening Preview Studio/);
  assert.doesNotMatch(marketHtml, /data-w131-prehydrated-starter/);
  assert.doesNotMatch(marketHtml, /Preparing your private Preview Studio drop/);
  assert.match(marketPage, /Create 4 original local previews/);
  assert.match(marketPage, /Generate 4 originals/);
  assert.match(marketPage, /function runProgressiveReveal/);
  assert.match(marketPage, /function prefersReducedMotion/);
  assert.match(marketPage, /activatePrivateMarketResumeCandidate/);
  assert.match(marketPage, /This studio is not a marketplace/);
  assert.match(marketPage, /Dodo Payments hosted checkout/);
  assert.doesNotMatch(marketPage, /official-commerce-foundation/);
  assert.doesNotMatch(marketPage, /ensureMarketStarterDrop/);
  assert.match(marketDrop, /Nothing is generated, persisted, or shown/);
  assert.match(marketDrop, /explicitUserResume: true/);
  assert.match(marketDrop, /preservedLegacySource: true/);
  assert.match(css, /\.eon-market-card\.is-revealing/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(guide, /Preview Studio starts empty/);
  assert.doesNotMatch(guide, /Owned Utility Pass/);
});
