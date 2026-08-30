import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadModuleFrom(relativePath, exportNames = []) {
  const src = join(__dirname, '../../', relativePath);
  const source = readFileSync(src, 'utf8')
    .replace(/^import\s+\{\s*secureRandom,\s*secureId\s*\}\s+from\s+['"].*?['"];?\s*$/gm, 'const secureRandom = () => 0.01; const secureId = () => "unitid";')
    .replace(/^export\s+(const|let|var|function|async function|class)\s+/gm, '$1 ')
    .replace(/^export\s+\{[^}]+\};?$/gm, '');

  const ctx = createContext({
    window: {},
    localStorage: {
      _store: {},
      getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
      setItem(key, value) { this._store[key] = String(value); },
      removeItem(key) { delete this._store[key]; },
      clear() { this._store = {}; }
    },
    document: {
      getElementById() { return null; },
      createElement() {
        return {
          appendChild() {},
          addEventListener() {},
          remove() {},
          querySelector() { return null; },
          style: { setProperty() {} }
        };
      },
      head: { appendChild() {} },
      body: { appendChild() {} }
    },
    Date,
    Map,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Math,
    Set,
    Uint8Array,
    TextEncoder,
    crypto: crypto.webcrypto
  });

  const suffix = (exportNames.length ? exportNames : [
    'normalizeNftRarity',
    'getRarityMeta',
    'buildObjectCollectibleVisualBundle',
    'buildNftProvenanceEnvelope',
    'buildNftMetadata',
    'buildDeterministicNftExport',
    'buildNftExportPackage',
    'buildObjectVisualQaReport'
  ]).map((name) => `exports.${name} = ${name};`).join('\n');

  return runInContext(`const exports = {};\n${source}\n${suffix}\nexports`, ctx);
}

const mod = loadModuleFrom('assets/js/utils/nft-visuals.js');

describe('nft-visuals export pipeline', () => {
  it('normalizes god-tier rarity aliases', () => {
    assert.equal(mod.normalizeNftRarity('godtier'), 'god-tier');
    assert.equal(mod.normalizeNftRarity('god-tier'), 'god-tier');
    assert.equal(mod.normalizeNftRarity('god.tier'), 'god-tier');
  });

  it('builds provenance metadata for premium collectibles', () => {
    const bundle = mod.buildObjectCollectibleVisualBundle({
      id: 'qa-premium-1',
      title: 'Premium Relic',
      rarity: 'god-tier',
      collectionType: 'ai'
    }, { context: 'marketplace' });

    const provenance = mod.buildNftProvenanceEnvelope({
      id: 'qa-premium-1',
      title: 'Premium Relic',
      rarity: 'god-tier',
      collectionType: 'ai'
    }, bundle, {});

    assert.equal(provenance.schema, 'eon.nft.provenance.v1');
    assert.equal(provenance.engine, 'EON Relic Engine');
    assert.equal(provenance.traits.rarityKey, 'god-tier');
    assert.equal(provenance.onChainEligibility, true);
    assert.ok(provenance.digests.image);
    assert.ok(provenance.digests.source);
  });

  it('builds deterministic export packages with sha-256 hashes', async () => {
    const pkg = await mod.buildNftExportPackage({
      id: 'qa-export-1',
      title: 'Premium Relic',
      rarity: 'legendary',
      collectionType: 'marketplace'
    }, { context: 'marketplace' });

    assert.equal(pkg.schema, 'eon.nft.export.v1');
    assert.ok(pkg.image.dataUri.startsWith('data:image/svg+xml;charset=UTF-8,'));
    assert.equal(pkg.hashes.imageSha256.length, 64);
    assert.equal(pkg.hashes.svgSha256.length, 64);
    assert.equal(pkg.hashes.metadataSha256.length, 64);
    assert.equal(pkg.metadata.provenance.imageSha256, pkg.hashes.imageSha256);
    assert.equal(pkg.metadata.provenance.metadataSha256, pkg.hashes.metadataSha256);
    assert.equal(pkg.preview.rarityKey, 'legendary');
  });

  it('reports a launch gate for collection QA', () => {
    const report = mod.buildObjectVisualQaReport({ count: 12, seedPrefix: 'qa-launch' });
    assert.equal(typeof report.launchGate.pass, 'boolean');
    assert.equal(report.launchGate.duplicateRateMax, 0.01);
    assert.equal(report.launchGate.visualCollisionRateMax, 0.08);
    assert.equal(report.launchGate.lowQualityRateMax, 0.05);
  });
});

describe('nft-collection rarity compatibility', () => {
  it('keeps legacy storage keys backward compatible', () => {
    const collection = loadModuleFrom('assets/js/utils/nft-collection.js', ['normalizeNftRarity']);

    assert.equal(collection.normalizeNftRarity('godtier'), 'god-tier');
    assert.equal(collection.normalizeNftRarity('god-tier', { storageKey: true }), 'godtier');
  });
});
