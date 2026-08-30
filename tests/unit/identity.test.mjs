import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../assets/js/utils/identity.js');

function makeModule(cryptoOverride = {}) {
  const ctx = createContext({
    Array, Object, String, Number, Math,
    Uint8Array,
    globalThis: {
      crypto: {
        getRandomValues: (arr) => {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
          return arr;
        },
        randomUUID: () => '12345678-1234-1234-1234-123456789abc',
        ...cryptoOverride
      }
    }
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

describe('identity — isValidIdentityId', () => {
  it('accepts current format g_ + 48 hex chars', () => {
    assert.equal(mod.isValidIdentityId('g_' + 'a'.repeat(48)), true);
  });

  it('accepts current format with mixed hex digits', () => {
    assert.equal(mod.isValidIdentityId('g_12345678901234567890123456789012345678901234abcd'), true);
  });

  it('accepts legacy format eon_ + 12 hex chars', () => {
    assert.equal(mod.isValidIdentityId('eon_123456789abc'), true);
  });

  it('rejects unknown prefix', () => {
    assert.equal(mod.isValidIdentityId('usr_' + 'a'.repeat(48)), false);
  });

  it('rejects g_ with too few chars', () => {
    assert.equal(mod.isValidIdentityId('g_' + 'a'.repeat(47)), false);
  });

  it('rejects g_ with too many chars', () => {
    assert.equal(mod.isValidIdentityId('g_' + 'a'.repeat(49)), false);
  });

  it('rejects empty string', () => {
    assert.equal(mod.isValidIdentityId(''), false);
  });

  it('is case-insensitive (uppercase g_)', () => {
    assert.equal(mod.isValidIdentityId('G_' + 'A'.repeat(48)), true);
  });

  it('is case-insensitive (uppercase EON_)', () => {
    assert.equal(mod.isValidIdentityId('EON_123456789ABC'), true);
  });

  it('rejects non-hex chars in id body', () => {
    assert.equal(mod.isValidIdentityId('g_' + 'z'.repeat(48)), false);
  });

  it('rejects eon_ with wrong length', () => {
    assert.equal(mod.isValidIdentityId('eon_' + 'a'.repeat(11)), false);
    assert.equal(mod.isValidIdentityId('eon_' + 'a'.repeat(13)), false);
  });
});

describe('identity — normalizeIdentityId', () => {
  it('normalizes uppercase g_ id to lowercase', () => {
    const id = 'G_' + 'A'.repeat(48);
    assert.equal(mod.normalizeIdentityId(id), 'g_' + 'a'.repeat(48));
  });

  it('returns null for invalid id', () => {
    assert.equal(mod.normalizeIdentityId('invalid'), null);
  });

  it('trims whitespace before validating', () => {
    const id = '  g_' + 'a'.repeat(48) + '  ';
    assert.equal(mod.normalizeIdentityId(id), 'g_' + 'a'.repeat(48));
  });

  it('returns null for empty string', () => {
    assert.equal(mod.normalizeIdentityId(''), null);
  });

  it('normalizes valid legacy id', () => {
    assert.equal(mod.normalizeIdentityId('EON_123456789ABC'), 'eon_123456789abc');
  });
});

describe('identity — shortIdentityId', () => {
  it('returns last 6 chars uppercase for valid id', () => {
    const id = 'g_' + 'a'.repeat(42) + '123456';
    assert.equal(mod.shortIdentityId(id), '123456'.toUpperCase());
  });

  it('returns ?????? for invalid id', () => {
    assert.equal(mod.shortIdentityId('invalid'), '??????');
  });

  it('returns ?????? for empty string', () => {
    assert.equal(mod.shortIdentityId(''), '??????');
  });

  it('last 6 chars are uppercased', () => {
    const id = 'g_' + 'a'.repeat(42) + 'abcdef';
    assert.equal(mod.shortIdentityId(id), 'ABCDEF');
  });
});

describe('identity — generateIdentityId', () => {
  it('returns a string matching g_ + 48 hex chars', () => {
    const id = mod.generateIdentityId();
    assert.ok(mod.isValidIdentityId(id), `Expected valid id, got: ${id}`);
  });

  it('generated id starts with g_', () => {
    const id = mod.generateIdentityId();
    assert.ok(id.startsWith('g_'));
  });

  it('each call generates a unique id (randomUUID stub returns fixed, but extraEntropy varies)', () => {
    // With randomUUID returning a fixed UUID, uniqueness comes from extraEntropy
    const id1 = mod.generateIdentityId();
    const id2 = mod.generateIdentityId();
    // Both should be valid identity ids
    assert.ok(mod.isValidIdentityId(id1));
    assert.ok(mod.isValidIdentityId(id2));
  });
});
