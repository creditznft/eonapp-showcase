import assert from 'node:assert/strict';
import test from 'node:test';

function installStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); }
  };
 return store;
}

test('W108 Market starter drop seeds unique searchable NFTs for a new visitor', async () => {
  installStorage();
  const mod = await import('../../assets/js/utils/market-starter-nfts.js');
  const seeded = mod.ensureMarketStarterDrop({ count: 8 });

  assert.equal(seeded.items.length, 8);
  assert.equal(new Set(seeded.items.map((item) => item.id)).size, 8);
  assert.ok(seeded.items.every((item) => item.type === 'nft'));
  assert.ok(seeded.items.some((item) => /EON City|starter NFT|Device Lab|AI Cockpit|Vault|Trade/i.test(`${item.title} ${item.desc}`)));

  const second = mod.ensureMarketStarterDrop({ count: 8 });
  assert.equal(second.seeded, false);
  assert.deepEqual(second.items.map((item) => item.id), seeded.items.map((item) => item.id));
});

test('W108 Market starter NFT can be saved to Vault-compatible collections', async () => {
  installStorage();
  const mod = await import(`../../assets/js/utils/market-starter-nfts.js?claim=${Date.now()}`);
  const drop = mod.ensureMarketStarterDrop({ count: 8 });
  const target = drop.items[0];
  const result = mod.claimMarketStarterNftToVault(target.id);

  assert.equal(result.ok, true);
  const legacy = JSON.parse(globalThis.localStorage.getItem(mod.MARKET_STARTER_COLLECTION_KEY));
  const v3 = JSON.parse(globalThis.localStorage.getItem(mod.MARKET_STARTER_V3_COLLECTION_KEY));
  assert.equal(legacy[0].id, target.id);
  assert.ok(Array.isArray(v3[target.id]));
  assert.equal(v3[target.id][0].source, 'market-starter-drop');

  const again = mod.claimMarketStarterNftToVault(target.id);
  assert.equal(again.ok, true);
  assert.equal(again.alreadySaved, true);
});
