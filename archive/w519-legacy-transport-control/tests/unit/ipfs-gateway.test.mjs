import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../assets/js/utils/ipfs-gateway.js');

function makeModule() {
  const createStore = () => {
    const map = new Map();
    return {
      getItem(key) {
        return map.has(key) ? map.get(key) : null;
      },
      setItem(key, value) {
        map.set(String(key), String(value));
      },
      removeItem(key) {
        map.delete(String(key));
      },
      clear() {
        map.clear();
      }
    };
  };

  const ctx = createContext({
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
    localStorage: createStore(),
    sessionStorage: createStore(),
    setTimeout: () => 0,
    clearTimeout: () => {}
  });

  const src = readFileSync(SRC, 'utf8')
    .replace(/^export (const|let|var|function|async function|class) /gm, '$1 ');
  const exportedNames = [...readFileSync(SRC, 'utf8').matchAll(/^export (?:const|let|var|function|async function|class) (\w+)/gm)]
    .map((m) => m[1]);
  const suffix = exportedNames.map((n) => `exports.${n} = ${n};`).join('\n');
  const wrapped = `const exports = {};\n${src}\n${suffix}\nexports`;
  return runInContext(wrapped, ctx);
}

const mod = makeModule();

describe('ipfs-gateway — isValidCid', () => {
  it('accepts valid CID v0 (Qm...)', () => {
    assert.equal(mod.isValidCid('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'), true);
  });

  it('accepts valid CID v1 (bafy...)', () => {
    assert.equal(mod.isValidCid('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'), true);
  });

  it('rejects empty string', () => {
    assert.equal(mod.isValidCid(''), false);
  });

  it('rejects arbitrary string', () => {
    assert.equal(mod.isValidCid('not-a-cid'), false);
  });

  it('rejects too-short Qm string', () => {
    assert.equal(mod.isValidCid('QmShort'), false);
  });

  it('rejects null/undefined gracefully', () => {
    assert.equal(mod.isValidCid(null), false);
    assert.equal(mod.isValidCid(undefined), false);
  });

  it('rejects CID with invalid base58 characters (0, O, I, l)', () => {
    assert.equal(mod.isValidCid('Qm0wAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'), false);
  });
});

describe('ipfs-gateway — isValidArweaveTx', () => {
  it('accepts valid 43-char base64url tx id', () => {
    assert.equal(mod.isValidArweaveTx('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq'), true);
  });

  it('rejects empty string', () => {
    assert.equal(mod.isValidArweaveTx(''), false);
  });

  it('rejects string too short', () => {
    assert.equal(mod.isValidArweaveTx('short'), false);
  });

  it('rejects string too long', () => {
    assert.equal(mod.isValidArweaveTx('a'.repeat(44)), false);
  });

  it('rejects string with invalid chars (space)', () => {
    assert.equal(mod.isValidArweaveTx('43character base64url identifierXXXXXXXXX'), false);
  });

  it('accepts underscore and hyphen (base64url chars)', () => {
    assert.equal(mod.isValidArweaveTx('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij_-XXXXX'), true);
  });
});

describe('ipfs-gateway — getGatewayStats', () => {
  it('returns an array of gateway health entries', () => {
    const stats = mod.getGatewayStats();
    assert.ok(Array.isArray(stats));
    assert.ok(stats.length >= 8);
  });

  it('each stat entry has url, successRate, avgLatencyMs, blacklisted fields', () => {
    const stats = mod.getGatewayStats();
    for (const entry of stats) {
      assert.ok(typeof entry.url === 'string');
      assert.ok(typeof entry.successRate === 'number');
      assert.ok(typeof entry.avgLatencyMs === 'number');
      assert.ok(typeof entry.blacklisted === 'boolean');
    }
  });

  it('initial stats have zero successRate and latency', () => {
    const stats = mod.getGatewayStats();
    for (const entry of stats) {
      assert.equal(entry.successRate, 0);
      assert.equal(entry.avgLatencyMs, 0);
      assert.equal(entry.blacklisted, false);
    }
  });
});

describe('ipfs-gateway — provider config storage', () => {
  it('stores provider config in sessionStorage by default', () => {
    const result = mod.setProviderConfig({ provider: 'pinata', apiKey: 'abc123' });
    assert.equal(result, undefined);
    const cfg = mod.getProviderConfig();
    assert.equal(cfg.provider, 'pinata');
    assert.equal(cfg.apiKey, 'abc123');
    assert.equal(cfg.rememberOnDevice, false);
  });

  it('can persist provider config on device when explicitly requested', () => {
    mod.setProviderConfig({ provider: 'nftstorage', apiKey: 'persist-me' }, true);
    const cfg = mod.getProviderConfig();
    assert.equal(cfg.provider, 'nftstorage');
    assert.equal(cfg.apiKey, 'persist-me');
    assert.equal(cfg.rememberOnDevice, true);
  });
});
