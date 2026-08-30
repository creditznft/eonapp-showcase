/**
 * Unit tests for assets/js/utils/lootbox.js
 * Tests pure computation: normalizeRarity, getRarityInfo, estimateValue,
 * encode/decode (via createSwapOfferCode + previewSwapOfferCode),
 * and collection/catalog helpers.
 */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const SRC = new URL('../../assets/js/utils/lootbox.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

// --- VM context setup ---
let counter = 0;
const cryptoMock = {
  getRandomValues(buf) {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = ((counter++ * 37 + 107) * 31) & 0xFF;
    }
    return buf;
  }
};

const localStorageMock = {
  _store: {},
  getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
  setItem(key, value) { this._store[key] = String(value); },
  removeItem(key) { delete this._store[key]; },
  clear() { this._store = {}; }
};

const documentMock = {
  dispatchEvent() {},
  createElement() {
    return {
      appendChild() {},
      setAttribute() {},
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      querySelector() { return null; },
      querySelectorAll() { return []; }
    };
  }
};

const ctx = createContext({
  window: {
    crypto: cryptoMock,
    EonXP: null,
    EonWallet: null
  },
  localStorage: localStorageMock,
  document: documentMock,
  console,
  // CustomEvent polyfill for fireEvent() calls during init
  CustomEvent: class CustomEvent {
    constructor(type, init) { this.type = type; this.detail = init?.detail; }
  },
  // Node.js 16+ has btoa/atob globally but not in VM — provide them
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  encodeURIComponent,
  decodeURIComponent
});

const compatSource = readFileSync(SRC, 'utf8')
  .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
  .replace(/^export\s+(const|let|var|function|async function|class)\s+/gm, '$1 ');
runInContext(compatSource, ctx);
const Lootbox = ctx.window.EonLootbox;

// Helper: reset mock state between tests
function resetStorage() {
  localStorageMock._store = {};
  counter = 0;
}

// Helper: inject a collection item into localStorage for tests that need it

function setProfileUid(uid) {
  localStorageMock._store['eon:profile:v1'] = JSON.stringify({ uid });
}

function injectCollectionItem(item) {
  const COLLECTION_KEY = 'eon:loot-collection:v2';
  const full = {
    id: item.id || 'orb-shard',
    name: item.name || 'Orb Shard',
    rarity: item.rarity || 'common',
    category: item.category || 'artifact',
    source: item.source || 'void-raider',
    description: item.description || 'A test fragment.',
    instanceId: item.instanceId || 'orb-shard-test001',
    obtainedAt: '2025-01-01T00:00:00.000Z',
    origin: item.origin || 'drop',
    mergedFrom: []
  };
  localStorageMock._store[COLLECTION_KEY] = JSON.stringify([full]);
}

// ============================================================
describe('getRarityInfo — RARITY_META lookup', () => {
  it('returns common meta for "common"', () => {
    const info = Lootbox.getRarityInfo('common');
    assert.equal(info.label, 'Common');
    assert.equal(info.oddsBase, 0.73);
    assert.equal(info.bonusValue, 0);
  });

  it('returns rare meta for "rare"', () => {
    const info = Lootbox.getRarityInfo('rare');
    assert.equal(info.label, 'Rare');
    assert.equal(info.oddsBase, 0.2);
    assert.equal(info.bonusValue, 20);
  });

  it('returns epic meta for "epic"', () => {
    const info = Lootbox.getRarityInfo('epic');
    assert.equal(info.label, 'Epic');
    assert.equal(info.oddsBase, 0.06);
    assert.equal(info.bonusValue, 70);
  });

  it('returns legendary meta for "legendary"', () => {
    const info = Lootbox.getRarityInfo('legendary');
    assert.equal(info.label, 'Legendary');
    assert.equal(info.oddsBase, 0.01);
    assert.equal(info.bonusValue, 180);
  });

  it('normalizes uppercase to valid rarity', () => {
    const info = Lootbox.getRarityInfo('RARE');
    assert.equal(info.label, 'Rare');
  });

  it('falls back to common for unknown rarity', () => {
    const info = Lootbox.getRarityInfo('mythic');
    assert.equal(info.label, 'Common');
  });
});

// ============================================================
describe('getCatalog — default catalog on empty storage', () => {
  it('returns non-empty array on empty localStorage', () => {
    resetStorage();
    const catalog = Lootbox.getCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length > 0);
  });

  it('catalog items have required fields: id, name, rarity, category, source', () => {
    resetStorage();
    const catalog = Lootbox.getCatalog();
    for (const item of catalog) {
      assert.ok(typeof item.id === 'string' && item.id.length > 0, `id missing on ${JSON.stringify(item)}`);
      assert.ok(typeof item.name === 'string' && item.name.length > 0);
      assert.ok(['common', 'rare', 'epic', 'legendary'].includes(item.rarity));
      assert.ok(['avatar', 'badge', 'artifact', 'companion', 'cosmetic'].includes(item.category));
      assert.ok(typeof item.source === 'string');
    }
  });

  it('includes common and rare items in default catalog', () => {
    resetStorage();
    const catalog = Lootbox.getCatalog();
    const rarities = new Set(catalog.map((i) => i.rarity));
    assert.ok(rarities.has('common'));
    assert.ok(rarities.has('rare'));
  });
});

// ============================================================
describe('getCollection — collection CRUD on mocked localStorage', () => {
  it('returns empty array when storage is empty', () => {
    resetStorage();
    const collection = Lootbox.getCollection();
    assert.ok(Array.isArray(collection));
    assert.equal(collection.length, 0);
  });

  it('returns injected items with correct structure', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'test-orb-001', rarity: 'epic', category: 'badge' });
    const collection = Lootbox.getCollection();
    assert.equal(collection.length, 1);
    assert.equal(collection[0].instanceId, 'test-orb-001');
    assert.equal(collection[0].rarity, 'epic');
    assert.equal(collection[0].category, 'badge');
  });

  it('inherits tokenId and metadataUri from catalog entries', () => {
    resetStorage();
    Lootbox.upsertCatalogEntries([
      {
        id: 'orb-shard',
        tokenId: 101,
        metadataUri: 'ipfs://bafybeigdyrzt-test/101.json'
      }
    ]);
    Lootbox.awardItem('orb-shard');
    const collection = Lootbox.getCollection();
    assert.equal(collection.length, 1);
    assert.equal(collection[0].tokenId, 101);
    assert.equal(collection[0].metadataUri, 'ipfs://bafybeigdyrzt-test/101.json');
  });
});

// ============================================================
describe('liquidateItem — demo collectibles are blocked', () => {
  it('rejects demo-origin collectibles and keeps them in collection', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'demo-drop-001', origin: 'demo', source: 'vault-demo' });
    const result = Lootbox.liquidateItem('demo-drop-001');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'liquidation_blocked');
    assert.ok(/cannot be liquidated/i.test(result.message));
    const collection = Lootbox.getCollection();
    assert.equal(collection.length, 1);
  });
});

// ============================================================
describe('upsertCatalogEntries — manifest-driven catalog merge', () => {
  it('merges CID metadata fields into the catalog', () => {
    resetStorage();
    const next = Lootbox.upsertCatalogEntries([
      {
        id: 'launch-box-alpha',
        name: 'Launch Box Alpha',
        rarity: 'rare',
        category: 'artifact',
        source: 'launch',
        description: 'Launch-season box.',
        tokenId: 501,
        metadataUri: 'ipfs://bafybeifrontendlaunch/501.json'
      }
    ]);
    const entry = next.find((item) => item.id === 'launch-box-alpha');
    assert.ok(entry);
    assert.equal(entry.tokenId, 501);
    assert.equal(entry.metadataUri, 'ipfs://bafybeifrontendlaunch/501.json');
  });
});

// ============================================================
describe('estimateValue — rarity-based item value', () => {
  it('common item value is between 20 and 80 (base + bonuses)', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'val-test-001', rarity: 'common' });
    const col = Lootbox.getCollection();
    const value = Lootbox.estimateValue(col[0]);
    assert.ok(Number.isFinite(value) && value >= 1);
    // common base=20, bonusValue=0, themeBonus<=12, hashBonus<=30, setBonus=0
    assert.ok(value <= 80, `expected ≤80, got ${value}`);
  });

  it('rare item value is greater than common', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'val-rare-001', rarity: 'rare', source: 'memory-lanes' });
    const col = Lootbox.getCollection();
    const rareValue = Lootbox.estimateValue(col[0]);
    // rare base=75 > common base=20
    assert.ok(rareValue > 20, `expected >20, got ${rareValue}`);
  });

  it('legendary item value is greater than epic', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'val-leg-001', rarity: 'legendary' });
    const colLeg = Lootbox.getCollection();
    const legValue = Lootbox.estimateValue(colLeg[0]);

    resetStorage();
    injectCollectionItem({ instanceId: 'val-ep-001', rarity: 'epic' });
    const colEpic = Lootbox.getCollection();
    const epicValue = Lootbox.estimateValue(colEpic[0]);

    assert.ok(legValue > epicValue, `legendary ${legValue} should > epic ${epicValue}`);
  });

  it('merged item (mergedFrom non-empty) gets +22 set bonus over identical unmerged item', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'set-bonus-001', rarity: 'rare', source: 'void-raider' });
    const col = Lootbox.getCollection();
    const base = col[0];
    // Same id/instanceId → same hashBonus; only setBonus differs
    const mergedValue = Lootbox.estimateValue({ ...base, mergedFrom: ['a', 'b', 'c'] });
    const normalValue = Lootbox.estimateValue({ ...base, mergedFrom: [] });
    assert.equal(mergedValue - normalValue, 22, `expected +22 set bonus, got diff=${mergedValue - normalValue}`);
  });
});

// ============================================================
describe('createSwapOfferCode — validation and structure', () => {
  it('returns offered_not_found error when collection is empty', () => {
    resetStorage();
    const result = Lootbox.createSwapOfferCode({ offeredInstanceId: 'nonexistent' });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'offered_not_found');
  });

  it('returns offered_not_found for mismatched instanceId', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'valid-item-001' });
    const result = Lootbox.createSwapOfferCode({ offeredInstanceId: 'wrong-id' });
    assert.equal(result.ok, false);
    assert.equal(result.code, 'offered_not_found');
  });

  it('returns ok:true with a code string when item exists', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'trade-test-001', rarity: 'common' });
    const result = Lootbox.createSwapOfferCode({
      offeredInstanceId: 'trade-test-001',
      wantedRarity: 'rare',
      wantedCategory: 'artifact'
    });
    assert.equal(result.ok, true);
    assert.ok(typeof result.code === 'string' && result.code.startsWith('eonoffer.v1.'));
    assert.ok(typeof result.offerId === 'string' && result.offerId.startsWith('offer-'));
  });

  it('returned code has 4 dot-separated parts', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'trade-test-002' });
    const result = Lootbox.createSwapOfferCode({ offeredInstanceId: 'trade-test-002' });
    assert.equal(result.ok, true);
    const parts = result.code.split('.');
    assert.equal(parts.length, 4);
    assert.equal(parts[0], 'eonoffer');
    assert.equal(parts[1], 'v1');
  });

  it('preview object from createSwapOfferCode has correct shape', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'trade-test-003', rarity: 'rare' });
    const result = Lootbox.createSwapOfferCode({
      offeredInstanceId: 'trade-test-003',
      wantedRarity: 'epic',
      wantedCategory: 'badge',
      priceEon: 100
    });
    assert.equal(result.ok, true);
    assert.equal(result.preview.wanted.rarity, 'epic');
    assert.equal(result.preview.wanted.category, 'badge');
    assert.equal(result.preview.priceEon, 100);
  });

  it('clamps priceEon to 0-20000 range', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'trade-test-004' });
    const result = Lootbox.createSwapOfferCode({
      offeredInstanceId: 'trade-test-004',
      priceEon: 999999
    });
    assert.equal(result.ok, true);
    assert.equal(result.preview.priceEon, 20000);
  });
});

// ============================================================
describe('previewSwapOfferCode — decode and validate', () => {
  it('returns invalid_code for completely invalid input', () => {
    const result = Lootbox.previewSwapOfferCode('this-is-not-a-code');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'invalid_code');
  });

  it('returns invalid_code for empty string', () => {
    const result = Lootbox.previewSwapOfferCode('');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'invalid_code');
  });

  it('returns invalid_code for wrong kind prefix', () => {
    const result = Lootbox.previewSwapOfferCode('eonreceipt.v1.abc.deadbeef');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'invalid_code');
  });

  it('returns invalid_code on tampered payload (checksum mismatch)', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'preview-test-001' });
    const created = Lootbox.createSwapOfferCode({ offeredInstanceId: 'preview-test-001' });
    const parts = created.code.split('.');
    parts[2] = parts[2].slice(0, -2) + 'ZZ'; // tamper with base64
    const tampered = parts.join('.');
    const result = Lootbox.previewSwapOfferCode(tampered);
    assert.equal(result.ok, false);
  });

  it('returns ok:true and offer object for valid code', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'preview-test-002', rarity: 'rare' });
    const created = Lootbox.createSwapOfferCode({
      offeredInstanceId: 'preview-test-002',
      wantedRarity: 'epic'
    });
    assert.equal(created.ok, true);
    const preview = Lootbox.previewSwapOfferCode(created.code);
    assert.equal(preview.ok, true);
    assert.ok(preview.offer && typeof preview.offer === 'object');
    assert.equal(preview.offer.wanted.rarity, 'epic');
  });

  it('round-trip: created code decodes to same offerId', () => {
    resetStorage();
    injectCollectionItem({ instanceId: 'preview-test-003' });
    const created = Lootbox.createSwapOfferCode({ offeredInstanceId: 'preview-test-003' });
    const preview = Lootbox.previewSwapOfferCode(created.code);
    assert.equal(preview.ok, true);
    assert.equal(preview.offer.offerId, created.offerId);
  });

  it('returns expired error for manually crafted expired code', () => {
    // Construct a code with a past expiresAt
    const payload = {
      offerId: 'offer-expired',
      createdAt: '2020-01-01T00:00:00.000Z',
      expiresAt: '2020-01-02T00:00:00.000Z',  // in the past
      offeredItem: { id: 'orb-shard', name: 'Test', rarity: 'common', category: 'artifact', source: 'void-raider', description: '', obtainedAt: '2020-01-01T00:00:00.000Z' },
      offeredValue: 20,
      wanted: { rarity: 'common', category: 'artifact', minValue: 0 },
      priceEon: 0
    };
    // Build the code using the same algorithm
    const payloadString = JSON.stringify(payload);
    // toBase64Url: utf8 → base64url
    const base64url = Buffer.from(payloadString, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // strHash (FNV-1a-32)
    let hash = 2166136261;
    for (let i = 0; i < payloadString.length; i++) {
      hash ^= payloadString.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const checksum = (hash >>> 0).toString(16).padStart(8, '0');
    const expiredCode = `eonoffer.v1.${base64url}.${checksum}`;

    const result = Lootbox.previewSwapOfferCode(expiredCode);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'expired');
  });
});


describe('swap offer trust boundaries — profile scoping and owner binding', () => {
  it('records ownerUid in created exchange code payload', () => {
    resetStorage();
    setProfileUid('owner-a');
    injectCollectionItem({ instanceId: 'owner-item-001', rarity: 'rare', category: 'artifact', id: 'owner-item' });
    const result = Lootbox.createSwapOfferCode({ offeredInstanceId: 'owner-item-001', wantedRarity: 'rare', wantedCategory: 'artifact' });
    assert.equal(result.ok, true);
    const preview = Lootbox.previewSwapOfferCode(result.code);
    assert.equal(preview.ok, true);
    assert.equal(preview.offer.ownerUid, 'owner-a');
  });

  it('blocks accepting an exchange code from the same profile when ownerUid is present', () => {
    resetStorage();
    setProfileUid('owner-a');
    localStorageMock._store['eon:loot-collection:v2'] = JSON.stringify([
      { id: 'owner-item', name: 'Owner Item', rarity: 'rare', category: 'artifact', source: 'void-raider', description: 'Owner offer item', instanceId: 'owner-item-001', obtainedAt: '2025-01-01T00:00:00.000Z', origin: 'drop', mergedFrom: [] },
      { id: 'bid-item', name: 'Bid Item', rarity: 'rare', category: 'artifact', source: 'void-raider', description: 'Bid item', instanceId: 'bid-item-001', obtainedAt: '2025-01-01T00:00:00.000Z', origin: 'drop', mergedFrom: [] }
    ]);
    const created = Lootbox.createSwapOfferCode({ offeredInstanceId: 'owner-item-001', wantedRarity: 'rare', wantedCategory: 'artifact' });
    const accepted = Lootbox.acceptSwapOfferCode(created.code, 'bid-item-001');
    assert.equal(accepted.ok, false);
    assert.equal(accepted.code, 'self_accept_blocked');
  });

  it('binds receipt redemption to issuerUid when present', () => {
    resetStorage();
    setProfileUid('owner-a');
    localStorageMock._store['eon:loot-collection:v2'] = JSON.stringify([
      { id: 'owner-item', name: 'Owner Item', rarity: 'rare', category: 'artifact', source: 'void-raider', description: 'Owner offer item', instanceId: 'owner-item-001', obtainedAt: '2025-01-01T00:00:00.000Z', origin: 'drop', mergedFrom: [] }
    ]);
    const created = Lootbox.createSwapOfferCode({ offeredInstanceId: 'owner-item-001', wantedRarity: 'rare', wantedCategory: 'artifact' });

    setProfileUid('acceptor-b');
    localStorageMock._store['eon:loot-collection:v2'] = JSON.stringify([
      { id: 'bid-item', name: 'Bid Item', rarity: 'rare', category: 'artifact', source: 'void-raider', description: 'Bid item', instanceId: 'bid-item-001', obtainedAt: '2025-01-01T00:00:00.000Z', origin: 'drop', mergedFrom: [] }
    ]);
    const accepted = Lootbox.acceptSwapOfferCode(created.code, 'bid-item-001');
    assert.equal(accepted.ok, true);

    const wrongRedeem = Lootbox.redeemSwapReceiptCode(accepted.receiptCode);
    assert.equal(wrongRedeem.ok, false);
    assert.equal(wrongRedeem.code, 'receipt_owner_mismatch');

    setProfileUid('owner-a');
    const correctRedeem = Lootbox.redeemSwapReceiptCode(accepted.receiptCode);
    assert.equal(correctRedeem.ok, true);
  });
});
